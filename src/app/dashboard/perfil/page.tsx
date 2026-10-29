import type { Metadata } from "next";
import { requireUserFast } from "@/lib/auth";
import {
  creatorStatusLabel,
  defaultRequiredEvidence,
  evidenceStatusLabels,
} from "@/lib/labels";
import { CreatorProfileView } from "./creator-profile-view";

export const metadata: Metadata = { title: "Meu cadastro" };

// Para o criador, "pendente" significa que a evidência foi enviada e espera
// a conferência da equipe.
const evidenceStatus: Record<string, string> = {
  ...evidenceStatusLabels,
  pending: "Enviada",
};

export default async function CreatorProfilePage() {
  const { supabase, user, activeCheck, ensureActive } = await requireUserFast();
  const [
    profileResult,
    accountsResult,
    evidenceResult,
    settingsResult,
    activeResult,
  ] = await Promise.all([
    supabase
      .from("creator_profiles")
      .select(
        "public_name, city, region, biography, categories, status, decision_reason",
      )
      .eq("user_id", user.id)
      .maybeSingle(),
    supabase
      .from("social_accounts")
      .select(
        "id, platform, handle, profile_url, followers_reported, followers_reported_at, verification_status",
      )
      .eq("creator_id", user.id)
      .order("created_at"),
    supabase
      .from("metric_evidence")
      .select(
        "id, position, content_type, story_published_on, views_reported, review_status, review_reason, storage_path",
      )
      .eq("creator_id", user.id)
      .order("position"),
    supabase
      .from("eligibility_settings")
      .select(
        "minimum_followers, minimum_story_views, max_story_age_days, required_story_evidence",
      )
      .eq("singleton", true)
      .maybeSingle(),
    activeCheck,
  ]);
  await ensureActive(activeResult);

  const profile = profileResult.data;
  const accounts = accountsResult.data ?? [];
  const evidence = evidenceResult.data ?? [];
  const settings = settingsResult.data;
  const evidenceSlots = new Map(evidence.map((item) => [item.position, item]));
  const signedUrls = evidence.length
    ? await supabase.storage.from("story-evidence").createSignedUrls(
        evidence.map((item) => item.storage_path),
        600,
      )
    : { data: [] };
  const urlByPath = new Map(
    (signedUrls.data ?? []).map((item) => [item.path, item.signedUrl]),
  );
  const hasLoadError =
    profileResult.error ||
    accountsResult.error ||
    evidenceResult.error ||
    settingsResult.error;
  const minimumViews = settings?.minimum_story_views ?? 1000;
  const maxStoryAgeDays = settings ? settings.max_story_age_days : 7;
  const requiredEvidence =
    settings?.required_story_evidence ?? defaultRequiredEvidence;
  const canEdit =
    Boolean(profile) &&
    ["incomplete", "changes_requested"].includes(profile?.status ?? "");
  // Por que a edição está bloqueada e o que a pessoa pode fazer.
  const lockedMessages: Record<string, string> = {
    submitted:
      "Seu cadastro foi enviado e aguarda a equipe. Enquanto a análise não começar, você pode desfazer o envio na visão geral e voltar a editar.",
    under_review:
      "Seu cadastro está em análise. Se a equipe pedir alguma correção, a edição é liberada de novo.",
    approved:
      "Seu cadastro foi aprovado. Para alterar algum dado, fale com a equipe pela página Mensagens.",
    rejected:
      "Seu cadastro não foi aprovado e não pode ser editado. Veja a resposta da equipe na página Mensagens.",
    suspended:
      "Seu cadastro está suspenso. Veja a orientação da equipe na página Mensagens.",
  };
  const lockedMessage =
    lockedMessages[profile?.status ?? ""] ??
    "Seu cadastro não pode ser editado agora. Veja a situação na visão geral.";
  const reviewIssues: string[] = [];
  if (!settings) {
    reviewIssues.push(
      "Não foi possível carregar os critérios atuais. Atualize a página.",
    );
  }
  if (!profile?.public_name.trim()) {
    reviewIssues.push("Informe seu nome público.");
  }
  const earliestStoryDate =
    maxStoryAgeDays === null
      ? null
      : new Date(Date.now() - maxStoryAgeDays * 24 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 10);
  for (const position of [1, 2, 3, 4, 5]) {
    const item = evidenceSlots.get(position);
    if (!item) {
      if (position <= requiredEvidence) {
        reviewIssues.push(`Envie a evidência ${position}.`);
      }
    } else {
      if (item.views_reported < minimumViews) {
        reviewIssues.push(
          `A evidência ${position} precisa informar pelo menos ${minimumViews.toLocaleString("pt-BR")} visualizações.`,
        );
      }
      if (earliestStoryDate && item.story_published_on < earliestStoryDate) {
        reviewIssues.push(
          `A evidência ${position} está fora do limite de ${maxStoryAgeDays} dias.`,
        );
      }
    }
  }

  return (
    <>
      <CreatorProfileView
        lede={
          canEdit
            ? "Tudo é salvo enquanto você preenche."
            : `Situação: ${creatorStatusLabel(profile?.status ?? "")}. A edição está bloqueada nesta etapa.`
        }
        hasLoadError={Boolean(hasLoadError)}
        canEdit={canEdit}
        lockedMessage={lockedMessage}
        status={profile?.status ?? null}
        decisionReason={profile?.decision_reason ?? null}
        profile={{
          publicName: profile?.public_name ?? "",
          city: profile?.city ?? "",
          region: profile?.region?.trim() ?? "",
          biography: profile?.biography ?? "",
          categories: profile?.categories ?? [],
        }}
        accounts={accounts}
        evidenceSlots={[1, 2, 3, 4, 5].map((position) => {
          const item = evidenceSlots.get(position);
          return {
            position,
            uploaded: Boolean(item),
            imageUrl: (item && urlByPath.get(item.storage_path)) || undefined,
            statusLabel: item
              ? (evidenceStatus[item.review_status] ?? "Em análise")
              : "Pendente",
            meta: item
              ? `${item.views_reported.toLocaleString("pt-BR")} visualizações`
              : undefined,
            reason: item?.review_reason,
            needsAttention:
              item?.review_status === "rejected" ||
              item?.review_status === "changes_requested",
          };
        })}
        evidenceCount={evidence.length}
        evidenceComplete={
          [...Array(requiredEvidence)].every((_, index) =>
            evidenceSlots.has(index + 1),
          ) &&
          evidence.every(
            (item) =>
              item.views_reported >= minimumViews &&
              (!earliestStoryDate ||
                item.story_published_on >= earliestStoryDate),
          )
        }
        requiredEvidence={requiredEvidence}
        minimumViews={minimumViews}
        maxStoryAgeDays={maxStoryAgeDays}
        reviewIssues={reviewIssues}
      />
    </>
  );
}
