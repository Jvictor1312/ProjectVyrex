"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSession } from "@/lib/auth";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import type { FormState } from "@/lib/validation/auth";

const creatorIdSchema = z.object({ targetCreator: z.uuid() });
const reasonSchema = z.string().trim().min(1).max(2000);
const summarySchema = z.string().trim().min(1).max(3000);
const messageSchema = z.string().trim().min(1).max(3000);
const channels = ["email", "phone", "whatsapp", "platform", "other"] as const;
const internalRoles = [
  "admin",
  "recruiter",
  "relationship_manager",
  "validator",
] as const;

const denied: FormState = {
  message: "A ação não foi autorizada ou não pode ser aplicada neste estágio.",
  success: false,
};

function invalid(message?: string): FormState {
  return {
    message: message ?? "Confira os dados e tente novamente.",
    success: false,
  };
}

function refreshCreator(creatorId: string) {
  revalidatePath("/interno");
  revalidatePath(`/interno/${creatorId}`);
}

export async function forwardCreatorAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = creatorIdSchema.safeParse({
    targetCreator: formData.get("targetCreator"),
  });
  if (!parsed.success) return invalid();

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("forward_creator_to_validation", {
    target_creator: parsed.data.targetCreator,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return { message: "Cadastro encaminhado para validação.", success: true };
}

export async function recordContactEventAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetCreator: z.uuid(),
      channel: z.enum(channels),
      summary: summarySchema,
      visibleToCreator: z.boolean(),
    })
    .safeParse({
      targetCreator: formData.get("targetCreator"),
      channel: formData.get("channel"),
      summary: formData.get("summary"),
      visibleToCreator: formData.get("visibleToCreator") === "on",
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("record_contact_event", {
    target_creator: parsed.data.targetCreator,
    contact_channel: parsed.data.channel,
    contact_summary: parsed.data.summary,
    visible_to_creator: parsed.data.visibleToCreator,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return { message: "Contato registrado no histórico.", success: true };
}

export async function sendCreatorMessageAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetCreator: z.uuid(),
      body: messageSchema,
    })
    .safeParse({
      targetCreator: formData.get("targetCreator"),
      body: formData.get("body"),
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("write_staff_message", {
    target_creator: parsed.data.targetCreator,
    message_body: parsed.data.body,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return { message: "Mensagem enviada ao criador.", success: true };
}

export async function requestCorrectionsAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetCreator: z.uuid(),
      reason: reasonSchema,
    })
    .safeParse({
      targetCreator: formData.get("targetCreator"),
      reason: formData.get("reason"),
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("request_creator_corrections", {
    target_creator: parsed.data.targetCreator,
    correction_reason: parsed.data.reason,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return { message: "Correção solicitada e notificada.", success: true };
}

export async function reviewStoryEvidenceAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      evidenceId: z.uuid(),
      decision: z.enum(["approved", "rejected", "changes_requested"]),
      reason: z.string().trim().max(2000),
    })
    .safeParse({
      evidenceId: formData.get("evidenceId"),
      decision: formData.get("decision"),
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  if (parsed.data.decision !== "approved" && !parsed.data.reason) {
    return invalid("Informe o motivo para rejeitar ou solicitar correção.");
  }

  const { supabase } = await requireSession();
  const { data: evidence, error: evidenceError } = await supabase
    .from("metric_evidence")
    .select("creator_id")
    .eq("id", parsed.data.evidenceId)
    .maybeSingle();
  if (evidenceError || !evidence) return denied;

  const { error } = await supabase.rpc("review_story_evidence", {
    evidence_id: parsed.data.evidenceId,
    decision: parsed.data.decision,
    reason: parsed.data.reason || null,
  });
  if (error) return denied;
  refreshCreator(evidence.creator_id);
  return { message: "Resultado da evidência registrado.", success: true };
}

export async function reviewSocialAccountAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      accountId: z.uuid(),
      decision: z.enum(["verified", "rejected"]),
      reason: z.string().trim().max(2000),
    })
    .safeParse({
      accountId: formData.get("accountId"),
      decision: formData.get("decision"),
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  if (parsed.data.decision === "rejected" && !parsed.data.reason) {
    return invalid("Informe o motivo para rejeitar a rede social.");
  }

  const { supabase } = await requireSession();
  const { data: account, error: accountError } = await supabase
    .from("social_accounts")
    .select("creator_id")
    .eq("id", parsed.data.accountId)
    .maybeSingle();
  if (accountError || !account) return denied;

  const { error } = await supabase.rpc("review_social_account", {
    target_account: parsed.data.accountId,
    decision: parsed.data.decision,
    reason: parsed.data.reason || null,
  });
  if (error) return denied;
  refreshCreator(account.creator_id);
  return { message: "Verificação da rede social registrada.", success: true };
}

export async function recordFinalDecisionAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetCreator: z.uuid(),
      decision: z.enum(["approved", "rejected", "changes_requested"]),
      reason: reasonSchema,
    })
    .safeParse({
      targetCreator: formData.get("targetCreator"),
      decision: formData.get("decision"),
      reason: formData.get("reason"),
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("record_review_decision", {
    target_creator: parsed.data.targetCreator,
    decision: parsed.data.decision,
    reason: parsed.data.reason,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return {
    message: "Decisão registrada e notificada ao criador.",
    success: true,
  };
}

export async function assignCreatorResponsiblesAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetCreator: z.uuid(),
      recruiterId: z.uuid().nullable(),
      relationshipManagerId: z.uuid().nullable(),
    })
    .safeParse({
      targetCreator: formData.get("targetCreator"),
      recruiterId: formData.get("recruiterId") || null,
      relationshipManagerId: formData.get("relationshipManagerId") || null,
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("assign_creator_responsibles", {
    target_creator: parsed.data.targetCreator,
    new_recruiter: parsed.data.recruiterId,
    new_manager: parsed.data.relationshipManagerId,
  });
  if (error) return denied;
  refreshCreator(parsed.data.targetCreator);
  return { message: "Responsáveis atualizados.", success: true };
}

export async function inviteInternalUserAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      fullName: z.string().trim().min(2).max(120),
      email: z.email().max(254),
      role: z.enum(internalRoles),
    })
    .safeParse({
      fullName: formData.get("fullName"),
      email: formData.get("email"),
      role: formData.get("role"),
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { data: allowed, error: permissionError } = await supabase.rpc(
    "has_permission",
    { permission_name: "creators.manage_roles" },
  );
  if (permissionError || !allowed) return denied;

  const adminClient = createSupabaseAdminClient();
  if (!adminClient) {
    return {
      message: "Convites exigem SUPABASE_SERVICE_ROLE_KEY somente no servidor.",
      success: false,
    };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const { data, error } = await adminClient.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: { full_name: parsed.data.fullName },
      redirectTo: `${siteUrl}/auth/callback?next=/login`,
    },
  );
  if (error || !data.user) {
    return {
      message:
        "Não foi possível enviar o convite. Verifique o e-mail e a configuração de Auth.",
      success: false,
    };
  }

  const { error: roleError } = await supabase.rpc("set_user_role", {
    target_user: data.user.id,
    role_key: parsed.data.role,
    enabled: true,
  });
  revalidatePath("/interno/equipe");
  if (roleError) {
    return {
      message:
        "Convite enviado, mas a função não foi atribuída. Atribua-a pela lista da equipe.",
      success: false,
    };
  }

  return { message: "Convite enviado e função atribuída.", success: true };
}

export async function manageInternalRoleAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = z
    .object({
      targetUser: z.uuid(),
      role: z.enum(internalRoles),
      enabled: z.boolean(),
    })
    .safeParse({
      targetUser: formData.get("targetUser"),
      role: formData.get("role"),
      enabled: formData.get("enabled") === "true",
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("set_user_role", {
    target_user: parsed.data.targetUser,
    role_key: parsed.data.role,
    enabled: parsed.data.enabled,
  });
  if (error) return denied;
  revalidatePath("/interno/equipe");
  return {
    message: "Função atualizada com trilha de auditoria.",
    success: true,
  };
}

export async function setInternalUserActiveAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const enabled = formData.get("enabled") === "true";
  const parsed = z
    .object({
      targetUser: z.uuid(),
      enabled: z.boolean(),
      reason: z.string().trim().max(2000),
    })
    .safeParse({
      targetUser: formData.get("targetUser"),
      enabled,
      reason: formData.get("reason") ?? "",
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);
  if (!parsed.data.enabled && !parsed.data.reason) {
    return invalid("Informe o motivo para desativar a conta.");
  }

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("set_user_active", {
    target_user: parsed.data.targetUser,
    enabled: parsed.data.enabled,
    reason: parsed.data.reason || null,
  });
  if (error) return denied;
  revalidatePath("/interno/equipe");
  return {
    message: parsed.data.enabled ? "Conta reativada." : "Conta desativada.",
    success: true,
  };
}

export async function updateEligibilitySettingsAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const rawMaxAge = formData.get("maxStoryAgeDays");
  const parsed = z
    .object({
      minimumFollowers: z.number().int().min(0).max(2_147_483_647),
      requiredEvidence: z.number().int().min(1).max(5),
      minimumViews: z.number().int().min(0).max(2_147_483_647),
      maxStoryAgeDays: z.number().int().min(1).max(365).nullable(),
    })
    .safeParse({
      minimumFollowers: Number(formData.get("minimumFollowers")),
      requiredEvidence: Number(formData.get("requiredEvidence")),
      minimumViews: Number(formData.get("minimumViews")),
      maxStoryAgeDays:
        rawMaxAge === "" || rawMaxAge === null ? null : Number(rawMaxAge),
    });
  if (!parsed.success) return invalid(parsed.error.issues[0]?.message);

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("update_eligibility_settings", {
    new_minimum_followers: parsed.data.minimumFollowers,
    new_required_evidence: parsed.data.requiredEvidence,
    new_minimum_views: parsed.data.minimumViews,
    new_max_story_age_days: parsed.data.maxStoryAgeDays,
  });
  if (error) return denied;
  revalidatePath("/interno/configuracoes");
  revalidatePath("/interno");
  return { message: "Critérios atualizados e auditados.", success: true };
}
