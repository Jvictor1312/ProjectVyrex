import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import {
  collectInstagramMetrics,
  exchangeCodeForToken,
  exchangeForLongLivedToken,
  fetchInstagramProfile,
  InstagramApiError,
  type InstagramMetrics,
  refreshLongLivedToken,
} from "./graph";
import type { Json } from "@/lib/supabase/database.types";
import { decryptToken, encryptToken, parseTokenKey } from "./token-crypto";

// Conexão com o Instagram, só no servidor. Conexões, tokens e métricas são
// gravados com a chave de serviço, sempre para o usuário da sessão (ou para
// um criador que a equipe pode acessar, conferido antes de chamar aqui).

export type InstagramConfig = {
  appId: string;
  appSecret: string;
  redirectUri: string;
  tokenKey: Buffer;
};

// Sem as quatro configurações, a conexão fica indisponível (a tela avisa) e
// a gravação de tela continua funcionando.
export function getInstagramConfig(): InstagramConfig | null {
  const appId = process.env.INSTAGRAM_APP_ID?.trim();
  const appSecret = process.env.INSTAGRAM_APP_SECRET?.trim();
  const tokenKey = parseTokenKey(process.env.INSTAGRAM_TOKEN_ENCRYPTION_KEY);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "");
  const redirectUri =
    process.env.INSTAGRAM_REDIRECT_URI?.trim() ||
    (siteUrl ? `${siteUrl}/api/instagram/callback` : "");
  if (!appId || !appSecret || !tokenKey || !redirectUri) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  return { appId, appSecret, redirectUri, tokenKey };
}

export function isInstagramConfigured() {
  return getInstagramConfig() !== null;
}

const day = 24 * 60 * 60 * 1000;
// Intervalo mínimo entre duas consultas do mesmo criador.
export const minimumSyncIntervalMs = 5 * 60 * 1000;

export type SyncOutcome =
  | "synced"
  | "not_configured"
  | "not_connected"
  | "reconnect_required"
  | "too_soon"
  | "rate_limited"
  | "failed";

export type ConnectOutcome =
  | "connected"
  | "not_configured"
  | "already_linked"
  | "failed";

function admin() {
  const client = createSupabaseAdminClient();
  if (!client) throw new Error("Service role is not configured");
  return client;
}

async function audit(actorId: string, action: string, creatorId: string, details: Json) {
  await admin().from("audit_logs").insert({
    actor_id: actorId,
    action,
    entity_type: "instagram_connection",
    entity_id: creatorId,
    details,
  });
}

async function saveSnapshot(creatorId: string, metrics: InstagramMetrics) {
  const client = admin();
  const { error } = await client.from("instagram_metric_snapshots").insert({
    creator_id: creatorId,
    instagram_user_id: metrics.instagramUserId,
    username: metrics.username,
    followers_count: metrics.followersCount,
    media_count: metrics.mediaCount,
    account_views: metrics.accountViews,
    account_reach: metrics.accountReach,
    insights_since: metrics.insightsSince,
    insights_until: metrics.insightsUntil,
    stories: metrics.stories,
    unavailable: metrics.unavailable,
  });
  if (error) throw new Error("Could not save Instagram metrics");
  await client
    .from("instagram_connections")
    .update({
      username: metrics.username,
      account_type: metrics.accountType,
      last_synced_at: new Date().toISOString(),
      last_sync_error: null,
    })
    .eq("creator_id", creatorId);
}

async function markReconnect(creatorId: string, reason: string) {
  const client = admin();
  await client
    .from("instagram_connections")
    .update({ status: "reconnect_required", status_reason: reason })
    .eq("creator_id", creatorId);
  await client
    .from("instagram_tokens")
    .update({ access_token_ciphertext: null })
    .eq("creator_id", creatorId);
}

// Depois da autorização na Meta: troca o código, guarda o token cifrado e
// faz a primeira consulta das métricas.
export async function connectInstagramAccount(
  creatorId: string,
  code: string,
): Promise<ConnectOutcome> {
  const config = getInstagramConfig();
  if (!config) return "not_configured";
  const client = admin();

  try {
    const short = await exchangeCodeForToken({
      appId: config.appId,
      appSecret: config.appSecret,
      redirectUri: config.redirectUri,
      code,
    });
    const long = await exchangeForLongLivedToken({
      appSecret: config.appSecret,
      accessToken: short.accessToken,
    });
    const profile = await fetchInstagramProfile(long.accessToken);

    const { data: other } = await client
      .from("instagram_connections")
      .select("creator_id")
      .eq("instagram_user_id", profile.instagramUserId)
      .in("status", ["active", "reconnect_required"])
      .neq("creator_id", creatorId)
      .limit(1);
    if (other && other.length > 0) return "already_linked";

    const now = new Date();
    const expiresAt = long.expiresInSeconds
      ? new Date(now.getTime() + long.expiresInSeconds * 1000).toISOString()
      : new Date(now.getTime() + 60 * day).toISOString();

    const { error: connectionError } = await client.from("instagram_connections").upsert({
      creator_id: creatorId,
      instagram_user_id: profile.instagramUserId,
      app_scoped_id: profile.appScopedId,
      username: profile.username,
      account_type: profile.accountType,
      granted_scopes: short.permissions,
      status: "active",
      status_reason: null,
      connected_at: now.toISOString(),
      token_expires_at: expiresAt,
      last_sync_error: null,
    });
    if (connectionError) {
      return connectionError.code === "23505" ? "already_linked" : "failed";
    }
    const { error: tokenError } = await client.from("instagram_tokens").upsert({
      creator_id: creatorId,
      access_token_ciphertext: encryptToken(long.accessToken, config.tokenKey),
      issued_at: now.toISOString(),
      expires_at: expiresAt,
    });
    if (tokenError) return "failed";

    await audit(creatorId, "creator.instagram.connected", creatorId, {
      username: profile.username,
      account_type: profile.accountType,
      scopes: short.permissions,
    });

    try {
      await saveSnapshot(
        creatorId,
        await collectInstagramMetrics({
          accessToken: long.accessToken,
          grantedScopes: short.permissions,
        }),
      );
    } catch (error) {
      // A conexão vale mesmo que a primeira consulta falhe; o criador pode
      // atualizar depois.
      await client
        .from("instagram_connections")
        .update({ last_sync_error: syncErrorCode(error) })
        .eq("creator_id", creatorId);
    }
    return "connected";
  } catch (error) {
    if (error instanceof InstagramApiError) {
      console.warn("Instagram connection failed", error.kind, error.code ?? "");
    } else {
      console.warn("Instagram connection failed");
    }
    return "failed";
  }
}

function syncErrorCode(error: unknown) {
  return error instanceof InstagramApiError ? error.kind : "error";
}

// Consulta as métricas de novo. Renova o token quando ele tem mais de 24 h
// (a Meta só renova a partir daí); token vencido ou revogado pede reconexão.
export async function syncInstagramMetrics(
  creatorId: string,
  actorId: string,
): Promise<SyncOutcome> {
  const config = getInstagramConfig();
  if (!config) return "not_configured";
  const client = admin();

  const [{ data: connection }, { data: token }] = await Promise.all([
    client
      .from("instagram_connections")
      .select("status, granted_scopes, last_synced_at, last_sync_error, updated_at")
      .eq("creator_id", creatorId)
      .maybeSingle(),
    client
      .from("instagram_tokens")
      .select("access_token_ciphertext, issued_at, expires_at")
      .eq("creator_id", creatorId)
      .maybeSingle(),
  ]);
  if (!connection || ["revoked", "disconnected"].includes(connection.status)) {
    return "not_connected";
  }
  if (connection.status === "reconnect_required" || !token?.access_token_ciphertext) {
    return "reconnect_required";
  }
  // O intervalo mínimo vale também para tentativas que falharam (a falha
  // grava last_sync_error, o que atualiza updated_at).
  const lastAttempt = connection.last_sync_error
    ? connection.updated_at
    : connection.last_synced_at;
  if (lastAttempt && Date.now() - new Date(lastAttempt).getTime() < minimumSyncIntervalMs) {
    return "too_soon";
  }
  if (token.expires_at && new Date(token.expires_at).getTime() <= Date.now()) {
    await markReconnect(creatorId, "token_expired");
    return "reconnect_required";
  }

  let accessToken: string;
  try {
    accessToken = decryptToken(token.access_token_ciphertext, config.tokenKey);
  } catch {
    // Chave trocada ou dado corrompido: o token não serve mais.
    await markReconnect(creatorId, "token_unreadable");
    return "reconnect_required";
  }

  try {
    if (token.issued_at && Date.now() - new Date(token.issued_at).getTime() > day) {
      const renewed = await refreshLongLivedToken(accessToken);
      accessToken = renewed.accessToken;
      const now = Date.now();
      const expiresAt = new Date(
        now + (renewed.expiresInSeconds ?? 60 * 24 * 60 * 60) * 1000,
      ).toISOString();
      await client
        .from("instagram_tokens")
        .update({
          access_token_ciphertext: encryptToken(accessToken, config.tokenKey),
          issued_at: new Date(now).toISOString(),
          expires_at: expiresAt,
        })
        .eq("creator_id", creatorId);
      await client
        .from("instagram_connections")
        .update({ token_expires_at: expiresAt })
        .eq("creator_id", creatorId);
    }

    const metrics = await collectInstagramMetrics({
      accessToken,
      grantedScopes: connection.granted_scopes ?? [],
    });
    await saveSnapshot(creatorId, metrics);
    await audit(actorId, "creator.instagram.synced", creatorId, {
      by_staff: actorId !== creatorId,
    });
    return "synced";
  } catch (error) {
    if (error instanceof InstagramApiError && error.kind === "token") {
      await markReconnect(creatorId, "token_invalid");
      return "reconnect_required";
    }
    await client
      .from("instagram_connections")
      .update({ last_sync_error: syncErrorCode(error) })
      .eq("creator_id", creatorId);
    if (error instanceof InstagramApiError && error.kind === "rate_limit") return "rate_limited";
    console.warn("Instagram sync failed", syncErrorCode(error));
    return "failed";
  }
}

// O criador desconecta: a conexão fica registrada como desconectada e o
// token é apagado do campo (deixa de existir no banco).
export async function disconnectInstagram(creatorId: string) {
  const client = admin();
  const { data } = await client
    .from("instagram_connections")
    .update({ status: "disconnected", status_reason: "creator_disconnected" })
    .eq("creator_id", creatorId)
    .select("creator_id")
    .maybeSingle();
  await client
    .from("instagram_tokens")
    .update({ access_token_ciphertext: null })
    .eq("creator_id", creatorId);
  if (data) await audit(creatorId, "creator.instagram.disconnected", creatorId, {});
  return Boolean(data);
}

// Aviso da Meta de que a pessoa removeu o app (ou pediu exclusão de dados):
// a conexão passa a "revogada" e o token é apagado do campo.
export async function revokeInstagramByMetaUserId(
  metaUserId: string,
  source: { kind: "deauthorize" | "data_deletion"; confirmationCode?: string },
) {
  if (!/^[0-9]{1,40}$/.test(metaUserId)) return 0;
  const client = admin();
  const { data } = await client
    .from("instagram_connections")
    .update({ status: "revoked", status_reason: "revoked_on_meta" })
    .or(`app_scoped_id.eq.${metaUserId},instagram_user_id.eq.${metaUserId}`)
    .select("creator_id");
  for (const row of data ?? []) {
    await client
      .from("instagram_tokens")
      .update({ access_token_ciphertext: null })
      .eq("creator_id", row.creator_id);
    await client.from("audit_logs").insert({
      actor_id: null,
      action: "creator.instagram.revoked",
      entity_type: "instagram_connection",
      entity_id: row.creator_id,
      details: {
        source: "meta",
        kind: source.kind,
        // Código devolvido à Meta: permite à equipe localizar o pedido de
        // exclusão de dados quando o titular perguntar por ele.
        confirmation_code: source.confirmationCode ?? null,
      },
    });
  }
  return data?.length ?? 0;
}
