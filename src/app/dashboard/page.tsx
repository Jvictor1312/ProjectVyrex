import Link from "next/link";
import { logoutAction } from "@/app/actions/auth";
import { CreatorNav } from "@/app/components/creator-nav";
import { requireUser } from "@/lib/auth";
import { CreatorOverview, nextStepFor } from "./creator-overview";

export default async function CreatorDashboardPage() {
  const { supabase, user } = await requireUser();
  const [
    profileResult,
    messageResult,
    notificationResult,
    historyResult,
    accountsResult,
    evidenceResult,
    settingsResult,
  ] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select("status, public_name, decision_reason")
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("team_messages")
      .select("id, body, created_at")
      .eq("creator_id", user.id)
      .eq("visible_to_creator", true)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("notifications")
      .select("id, title, body, created_at, read_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(3),
    supabase
      .from("review_history")
      .select("id, action, reason, created_at")
      .eq("creator_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("social_accounts")
      .select("id", { count: "exact", head: true })
      .eq("creator_id", user.id),
    supabase
      .from("metric_evidence")
      .select("position, review_status, review_reason")
      .eq("creator_id", user.id)
      .order("position"),
    supabase
      .from("eligibility_settings")
      .select("required_story_evidence")
      .eq("singleton", true)
      .maybeSingle(),
  ]);

  const creatorProfile = profileResult.data;
  const accountCount = accountsResult.count ?? 0;
  const evidence = evidenceResult.data ?? [];
  const requiredEvidence = settingsResult.data?.required_story_evidence ?? 5;
  const evidenceIssues = evidence.filter(
    (item) =>
      item.review_status === "rejected" ||
      item.review_status === "changes_requested",
  );
  const hasLoadError = Boolean(
    accountsResult.error ||
      evidenceResult.error ||
      settingsResult.error ||
      profileResult.error ||
      messageResult.error ||
      notificationResult.error ||
      historyResult.error ||
      !creatorProfile,
  );
  const status = creatorProfile?.status ?? "incomplete";

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <Link className="brand" href="/">
          <span className="brand-mark">V</span>
          <span>VYREX</span>
        </Link>
        <form action={logoutAction}>
          <button className="quiet-button" type="submit">
            Sair
          </button>
        </form>
      </header>
      <CreatorNav />
      <CreatorOverview
        name={creatorProfile?.public_name ?? null}
        status={status}
        decisionReason={creatorProfile?.decision_reason ?? null}
        steps={[
          { label: "Perfil", done: Boolean(creatorProfile?.public_name) },
          { label: "Rede social", done: accountCount > 0 },
          {
            label: `Evidências ${evidence.length}/${requiredEvidence}`,
            done: evidence.length >= requiredEvidence,
          },
        ]}
        evidenceIssues={evidenceIssues}
        nextStep={nextStepFor(
          status,
          accountCount,
          evidence.length,
          requiredEvidence,
          evidenceIssues.length > 0,
        )}
        messages={messageResult.data ?? []}
        notifications={notificationResult.data ?? []}
        history={historyResult.data ?? []}
        hasLoadError={hasLoadError}
      />
    </main>
  );
}
