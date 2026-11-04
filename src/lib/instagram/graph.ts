// Cliente da "Instagram API with Instagram Login" (Meta). Só usa endpoints,
// campos e métricas descritos na documentação oficial, conferida em
// 2026-10-31 (ver docs/INSTAGRAM.md):
// - autorização: https://www.instagram.com/oauth/authorize
// - token curto: POST https://api.instagram.com/oauth/access_token
// - token longo (60 dias): GET https://graph.instagram.com/access_token
// - renovação: GET https://graph.instagram.com/refresh_access_token
// - perfil: GET /me?fields=user_id,username,account_type,followers_count,media_count
// - conta: GET /<IG_ID>/insights (views, reach; period=day, total_value)
// - Stories: GET /<IG_ID>/stories e GET /<MEDIA_ID>/insights (reach, views)
// O token nunca entra em mensagens de erro nem em logs.

export const graphApiVersion = "v26.0";
const graphHost = "https://graph.instagram.com";

export const instagramScopes = [
  "instagram_business_basic",
  "instagram_business_manage_insights",
] as const;
const insightsScope = "instagram_business_manage_insights";

// Período das métricas da conta: 28 dias até agora (a Meta avisa que os
// dados podem atrasar até 48 horas).
export const accountInsightsDays = 28;
const maximumStories = 10;
const requestTimeoutMs = 10_000;

export type InstagramErrorKind =
  | "token" // token vencido, revogado ou inválido: precisa conectar de novo
  | "permission" // permissão não concedida ou conta sem acesso
  | "rate_limit"
  | "not_enough_viewers" // Story com menos de 5 espectadores (erro 10)
  | "unsupported" // métrica ou recurso não disponível para esta conta
  | "network"
  | "unknown";

export class InstagramApiError extends Error {
  kind: InstagramErrorKind;
  code?: number;
  subcode?: number;

  constructor(kind: InstagramErrorKind, code?: number, subcode?: number) {
    super(`Instagram API error: ${kind}${code ? ` (${code})` : ""}`);
    this.name = "InstagramApiError";
    this.kind = kind;
    this.code = code;
    this.subcode = subcode;
  }
}

export type UnavailableReason =
  | "permission_missing"
  | "not_enough_viewers"
  | "not_supported"
  | "no_data"
  | "rate_limited"
  | "error";

export type StoryMetrics = {
  mediaId: string;
  postedAt: string | null;
  permalink: string | null;
  views: number | null;
  reach: number | null;
  unavailable: Partial<Record<"views" | "reach", UnavailableReason>>;
};

export type InstagramProfile = {
  instagramUserId: string;
  appScopedId: string | null;
  username: string;
  accountType: string | null;
  followersCount: number | null;
  mediaCount: number | null;
};

export type InstagramMetrics = InstagramProfile & {
  accountViews: number | null;
  accountReach: number | null;
  insightsSince: string;
  insightsUntil: string;
  stories: StoryMetrics[];
  unavailable: Record<string, UnavailableReason>;
};

type FetchLike = typeof fetch;

type GraphErrorBody = {
  error?: { code?: number; error_subcode?: number; type?: string; message?: string };
  error_type?: string;
  code?: number;
};

export function classifyGraphError(status: number, body: unknown): InstagramApiError {
  const parsed = (body ?? {}) as GraphErrorBody;
  const code = parsed.error?.code ?? parsed.code;
  const subcode = parsed.error?.error_subcode;
  const message = parsed.error?.message ?? "";
  if (code === 190 || code === 102 || status === 401) {
    return new InstagramApiError("token", code, subcode);
  }
  if (code === 10 && /not enough viewers/i.test(message)) {
    return new InstagramApiError("not_enough_viewers", code, subcode);
  }
  if (code === 10 || (typeof code === "number" && code >= 200 && code <= 299) || status === 403) {
    return new InstagramApiError("permission", code, subcode);
  }
  if (code === 4 || code === 17 || code === 32 || code === 613 || status === 429) {
    return new InstagramApiError("rate_limit", code, subcode);
  }
  if (code === 100) return new InstagramApiError("unsupported", code, subcode);
  return new InstagramApiError("unknown", code, subcode);
}

async function request(fetchImpl: FetchLike, url: string, init?: RequestInit) {
  let response: Response;
  try {
    response = await fetchImpl(url, {
      ...init,
      cache: "no-store",
      signal: AbortSignal.timeout(requestTimeoutMs),
    });
  } catch {
    throw new InstagramApiError("network");
  }
  let body: unknown = null;
  try {
    body = await response.json();
  } catch {
    body = null;
  }
  if (!response.ok || (body as GraphErrorBody | null)?.error) {
    throw classifyGraphError(response.status, body);
  }
  return body as Record<string, unknown>;
}

function graphUrl(path: string, params: Record<string, string>, accessToken: string) {
  const url = new URL(`${graphHost}/${graphApiVersion}/${path}`);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  url.searchParams.set("access_token", accessToken);
  return url.toString();
}

const asCount = (value: unknown) =>
  typeof value === "number" && Number.isFinite(value) && value >= 0
    ? Math.round(value)
    : null;

export function buildAuthorizeUrl(options: {
  appId: string;
  redirectUri: string;
  state: string;
}) {
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", options.appId);
  url.searchParams.set("redirect_uri", options.redirectUri);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", instagramScopes.join(","));
  url.searchParams.set("state", options.state);
  return url.toString();
}

// Troca o código da autorização (vale 1 hora, uso único) pelo token curto.
export async function exchangeCodeForToken(
  options: { appId: string; appSecret: string; redirectUri: string; code: string },
  fetchImpl: FetchLike = fetch,
) {
  const body = new URLSearchParams({
    client_id: options.appId,
    client_secret: options.appSecret,
    grant_type: "authorization_code",
    redirect_uri: options.redirectUri,
    code: options.code,
  });
  const data = await request(fetchImpl, "https://api.instagram.com/oauth/access_token", {
    method: "POST",
    body,
  });
  // A resposta pode vir dentro de "data" (formato atual da documentação).
  const entry = (Array.isArray(data.data) ? data.data[0] : data) as Record<string, unknown>;
  const accessToken = typeof entry?.access_token === "string" ? entry.access_token : "";
  if (!accessToken) throw new InstagramApiError("unknown");
  const permissions = Array.isArray(entry.permissions)
    ? entry.permissions.map(String)
    : typeof entry.permissions === "string"
      ? entry.permissions.split(",").map((item) => item.trim()).filter(Boolean)
      : [];
  return { accessToken, permissions };
}

// Token longo: 60 dias. Só no servidor (usa a chave secreta do app).
export async function exchangeForLongLivedToken(
  options: { appSecret: string; accessToken: string },
  fetchImpl: FetchLike = fetch,
) {
  const url = new URL(`${graphHost}/access_token`);
  url.searchParams.set("grant_type", "ig_exchange_token");
  url.searchParams.set("client_secret", options.appSecret);
  url.searchParams.set("access_token", options.accessToken);
  return parseLongLivedToken(await request(fetchImpl, url.toString()));
}

// Renova o token longo (precisa ter pelo menos 24 horas e ainda valer).
export async function refreshLongLivedToken(
  accessToken: string,
  fetchImpl: FetchLike = fetch,
) {
  const url = new URL(`${graphHost}/refresh_access_token`);
  url.searchParams.set("grant_type", "ig_refresh_token");
  url.searchParams.set("access_token", accessToken);
  return parseLongLivedToken(await request(fetchImpl, url.toString()));
}

function parseLongLivedToken(data: Record<string, unknown>) {
  const accessToken = typeof data.access_token === "string" ? data.access_token : "";
  if (!accessToken) throw new InstagramApiError("unknown");
  const expiresIn = asCount(data.expires_in);
  return { accessToken, expiresInSeconds: expiresIn };
}

export async function fetchInstagramProfile(
  accessToken: string,
  fetchImpl: FetchLike = fetch,
): Promise<InstagramProfile> {
  const data = await request(
    fetchImpl,
    graphUrl(
      "me",
      { fields: "id,user_id,username,account_type,followers_count,media_count" },
      accessToken,
    ),
  );
  const instagramUserId = String(data.user_id ?? data.id ?? "");
  const username = typeof data.username === "string" ? data.username : "";
  if (!/^[0-9]{1,40}$/.test(instagramUserId) || !username) {
    throw new InstagramApiError("unknown");
  }
  const appScopedId = data.id === undefined ? null : String(data.id);
  return {
    instagramUserId,
    appScopedId: appScopedId && /^[0-9]{1,40}$/.test(appScopedId) ? appScopedId : null,
    username: username.slice(0, 100),
    accountType: typeof data.account_type === "string" ? data.account_type.slice(0, 40) : null,
    followersCount: asCount(data.followers_count),
    mediaCount: asCount(data.media_count),
  };
}

// Lê o valor de uma métrica no formato total_value ou values[0].
function insightValue(data: Record<string, unknown>, metric: string): number | null {
  const rows = Array.isArray(data.data) ? (data.data as Record<string, unknown>[]) : [];
  const row = rows.find((item) => item?.name === metric) ?? rows[0];
  if (!row) return null;
  const total = (row.total_value as { value?: unknown } | undefined)?.value;
  if (total !== undefined) return asCount(total);
  const values = Array.isArray(row.values) ? (row.values as { value?: unknown }[]) : [];
  return values.length ? asCount(values[0]?.value) : null;
}

function reasonFor(error: unknown): UnavailableReason {
  if (!(error instanceof InstagramApiError)) return "error";
  switch (error.kind) {
    case "permission":
      return "permission_missing";
    case "not_enough_viewers":
      return "not_enough_viewers";
    case "unsupported":
      return "not_supported";
    case "rate_limit":
      return "rate_limited";
    default:
      return "error";
  }
}

// Consulta tudo o que a API entrega. Cada métrica que falhar fica nula, com
// o motivo; só um token inválido interrompe a consulta (precisa reconectar).
export async function collectInstagramMetrics(
  options: { accessToken: string; grantedScopes: string[]; now?: Date },
  fetchImpl: FetchLike = fetch,
): Promise<InstagramMetrics> {
  const now = options.now ?? new Date();
  const until = Math.floor(now.getTime() / 1000);
  const since = until - accountInsightsDays * 24 * 60 * 60;
  const profile = await fetchInstagramProfile(options.accessToken, fetchImpl);
  const unavailable: Record<string, UnavailableReason> = {};
  if (profile.followersCount === null) unavailable.followers_count = "no_data";

  // Lista vazia = a Meta não informou as permissões na troca do código: tenta
  // consultar e deixa a própria API dizer se falta permissão.
  const hasInsights =
    options.grantedScopes.length === 0 || options.grantedScopes.includes(insightsScope);
  const metrics: Pick<InstagramMetrics, "accountViews" | "accountReach"> = {
    accountViews: null,
    accountReach: null,
  };
  const stories: StoryMetrics[] = [];

  async function guarded<T>(key: string, run: () => Promise<T>): Promise<T | null> {
    try {
      return await run();
    } catch (error) {
      if (error instanceof InstagramApiError && error.kind === "token") throw error;
      unavailable[key] = reasonFor(error);
      return null;
    }
  }

  if (!hasInsights) {
    unavailable.account_views = "permission_missing";
    unavailable.account_reach = "permission_missing";
    unavailable.stories = "permission_missing";
  } else {
    for (const [key, metric] of [
      ["account_views", "views"],
      ["account_reach", "reach"],
    ] as const) {
      const value = await guarded(key, async () =>
        insightValue(
          await request(
            fetchImpl,
            graphUrl(
              `${profile.instagramUserId}/insights`,
              {
                metric,
                period: "day",
                metric_type: "total_value",
                since: String(since),
                until: String(until),
              },
              options.accessToken,
            ),
          ),
          metric,
        ),
      );
      if (value === null && !unavailable[key]) unavailable[key] = "no_data";
      if (key === "account_views") metrics.accountViews = value;
      else metrics.accountReach = value;
    }

    const storyList = await guarded("stories", async () =>
      request(
        fetchImpl,
        graphUrl(
          `${profile.instagramUserId}/stories`,
          { fields: "id,media_type,timestamp,permalink", limit: String(maximumStories) },
          options.accessToken,
        ),
      ),
    );
    const items = Array.isArray(storyList?.data)
      ? (storyList.data as Record<string, unknown>[]).slice(0, maximumStories)
      : [];
    for (const item of items) {
      const mediaId = String(item.id ?? "");
      if (!/^[0-9]{1,40}$/.test(mediaId)) continue;
      const story: StoryMetrics = {
        mediaId,
        postedAt: typeof item.timestamp === "string" ? item.timestamp : null,
        permalink:
          typeof item.permalink === "string" && item.permalink.startsWith("https://")
            ? item.permalink
            : null,
        views: null,
        reach: null,
        unavailable: {},
      };
      for (const metric of ["reach", "views"] as const) {
        try {
          const value = insightValue(
            await request(
              fetchImpl,
              graphUrl(`${mediaId}/insights`, { metric }, options.accessToken),
            ),
            metric,
          );
          story[metric] = value;
          if (value === null) story.unavailable[metric] = "no_data";
        } catch (error) {
          if (error instanceof InstagramApiError && error.kind === "token") throw error;
          story.unavailable[metric] = reasonFor(error);
        }
      }
      stories.push(story);
    }
  }

  return {
    ...profile,
    ...metrics,
    insightsSince: new Date(since * 1000).toISOString(),
    insightsUntil: new Date(until * 1000).toISOString(),
    stories,
    unavailable,
  };
}
