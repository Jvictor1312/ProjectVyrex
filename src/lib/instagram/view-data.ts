import type { SupabaseClient } from "@supabase/supabase-js";
import { recordingBucket } from "@/lib/recordings/video";

// Dados da verificação de métricas para as telas (criador e equipe). Lê com
// a sessão de quem está vendo: as regras do banco decidem o que aparece.

export type InstagramConnectionView = {
  username: string;
  accountType: string | null;
  status: string;
  connectedAt: string;
  lastSyncedAt: string | null;
  lastSyncError: string | null;
  tokenExpiresAt: string | null;
  grantedScopes: string[];
};

export type StoryMetricsView = {
  mediaId: string;
  postedAt: string | null;
  permalink: string | null;
  views: number | null;
  reach: number | null;
  unavailable: Record<string, string>;
};

export type InstagramSnapshotView = {
  fetchedAt: string;
  username: string;
  followersCount: number | null;
  mediaCount: number | null;
  accountViews: number | null;
  accountReach: number | null;
  insightsSince: string | null;
  insightsUntil: string | null;
  stories: StoryMetricsView[];
  unavailable: Record<string, string>;
};

export type MetricRecordingView = {
  id: string;
  url: string | null;
  contentType: string;
  sizeBytes: number;
  durationSeconds: number;
  status: string;
  reason: string | null;
  createdAt: string;
  reviewedAt: string | null;
};

export type MetricVerificationData = {
  connection: InstagramConnectionView | null;
  snapshot: InstagramSnapshotView | null;
  recording: MetricRecordingView | null;
  loadError: boolean;
};

function asRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => typeof item === "string"),
  ) as Record<string, string>;
}

function asStories(value: unknown): StoryMetricsView[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item) => item && typeof item === "object")
    .map((item) => ({
      mediaId: String(item.mediaId ?? ""),
      postedAt: typeof item.postedAt === "string" ? item.postedAt : null,
      permalink:
        typeof item.permalink === "string" && item.permalink.startsWith("https://")
          ? item.permalink
          : null,
      views: typeof item.views === "number" ? item.views : null,
      reach: typeof item.reach === "number" ? item.reach : null,
      unavailable: asRecord(item.unavailable),
    }));
}

export async function loadMetricVerification(
  supabase: SupabaseClient,
  creatorId: string,
): Promise<MetricVerificationData> {
  const [connectionResult, snapshotResult, recordingResult] = await Promise.all([
    supabase
      .from("instagram_connections")
      .select(
        "username, account_type, status, connected_at, last_synced_at, last_sync_error, token_expires_at, granted_scopes",
      )
      .eq("creator_id", creatorId)
      .maybeSingle(),
    supabase
      .from("instagram_metric_snapshots")
      .select(
        "fetched_at, username, followers_count, media_count, account_views, account_reach, insights_since, insights_until, stories, unavailable",
      )
      .eq("creator_id", creatorId)
      .order("fetched_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("metric_recordings")
      .select(
        "id, storage_path, content_type, size_bytes, duration_seconds, review_status, review_reason, created_at, reviewed_at",
      )
      .eq("creator_id", creatorId)
      .maybeSingle(),
  ]);

  const recordingRow = recordingResult.data;
  const signed = recordingRow
    ? await supabase.storage.from(recordingBucket).createSignedUrl(recordingRow.storage_path, 600)
    : null;

  const connection = connectionResult.data;
  const snapshot = snapshotResult.data;
  return {
    loadError: Boolean(connectionResult.error || snapshotResult.error || recordingResult.error),
    connection: connection
      ? {
          username: connection.username,
          accountType: connection.account_type,
          status: connection.status,
          connectedAt: connection.connected_at,
          lastSyncedAt: connection.last_synced_at,
          lastSyncError: connection.last_sync_error,
          tokenExpiresAt: connection.token_expires_at,
          grantedScopes: connection.granted_scopes ?? [],
        }
      : null,
    snapshot: snapshot
      ? {
          fetchedAt: snapshot.fetched_at,
          username: snapshot.username,
          followersCount: snapshot.followers_count,
          mediaCount: snapshot.media_count,
          accountViews: snapshot.account_views === null ? null : Number(snapshot.account_views),
          accountReach: snapshot.account_reach === null ? null : Number(snapshot.account_reach),
          insightsSince: snapshot.insights_since,
          insightsUntil: snapshot.insights_until,
          stories: asStories(snapshot.stories),
          unavailable: asRecord(snapshot.unavailable),
        }
      : null,
    recording: recordingRow
      ? {
          id: recordingRow.id,
          url: signed?.data?.signedUrl ?? null,
          contentType: recordingRow.content_type,
          sizeBytes: recordingRow.size_bytes,
          durationSeconds: Number(recordingRow.duration_seconds),
          status: recordingRow.review_status,
          reason: recordingRow.review_reason,
          createdAt: recordingRow.created_at,
          reviewedAt: recordingRow.reviewed_at,
        }
      : null,
  };
}
