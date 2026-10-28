"use server";

import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { invalidPhoneMessage, normalizePhone } from "@/lib/validation/phone";
import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import {
  accountSettingsSchema,
  dataRequestSchema,
  resolveDataRequestSchema,
} from "@/lib/validation/privacy";
import { passwordUpdateSchema, type FormState } from "@/lib/validation/auth";

export async function createDataRequestAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = dataRequestSchema.safeParse({
    kind: formData.get("kind"),
    details: formData.get("details") || undefined,
  });
  if (!parsed.success) {
    return {
      message: "Escolha o tipo de solicitação e confira o texto informado.",
      success: false,
    };
  }

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("create_data_request", {
    request_kind: parsed.data.kind,
    request_details: parsed.data.details ?? null,
  });

  if (error) {
    return {
      message:
        error.code === "23505"
          ? "Você já tem uma solicitação ativa desse tipo. Aguarde a resposta da equipe."
          : "Não foi possível registrar a solicitação. Tente novamente.",
      success: false,
    };
  }

  revalidatePath("/dashboard/privacidade");
  return {
    message:
      "Solicitação registrada na plataforma. Ela será analisada pela equipe; nenhum e-mail foi enviado automaticamente.",
    success: true,
  };
}

export async function resolveDataRequestAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = resolveDataRequestSchema.safeParse({
    requestId: formData.get("requestId"),
    status: formData.get("status"),
    note: formData.get("note") || undefined,
  });
  if (!parsed.success) {
    return { message: "Confira os campos informados.", success: false };
  }

  const { supabase } = await requireSession();
  const { error } = await supabase.rpc("resolve_data_request", {
    request_id: parsed.data.requestId,
    new_status: parsed.data.status,
    note: parsed.data.note ?? null,
  });

  if (error) {
    const message =
      error.code === "42501"
        ? "Você não tem permissão para tratar solicitações de privacidade."
        : error.code === "22023"
          ? "Informe uma justificativa para concluir ou recusar a solicitação."
          : error.code === "55000"
            ? "Esta solicitação já foi encerrada."
            : "Não foi possível atualizar a solicitação. Tente novamente.";
    return { message, success: false };
  }

  revalidatePath("/interno/privacidade");
  revalidatePath("/dashboard/privacidade");
  return { message: "Solicitação atualizada.", success: true };
}

export async function updateAccountSettingsAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = accountSettingsSchema.safeParse({
    fullName: formData.get("fullName"),
    phone: formData.get("phone") || undefined,
  });
  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? "Confira os campos.",
      success: false,
    };
  }
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
  if (parsed.data.phone && !phone) {
    return { message: invalidPhoneMessage, success: false };
  }

  const { supabase, user } = await requireSession();
  const { data, error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone,
    })
    .eq("id", user.id)
    .select("id")
    .maybeSingle();

  if (error || !data) {
    return {
      message: "Não foi possível salvar seus dados. Tente novamente.",
      success: false,
    };
  }

  revalidatePath("/dashboard/configuracoes");
  return { message: "Dados da conta salvos.", success: true };
}

export async function changePasswordAction(
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    return {
      message:
        parsed.error.issues[0]?.message ??
        "Mínimo de 11 caracteres, com maiúscula, minúscula, número e símbolo.",
      success: false,
    };
  }

  const currentPassword = formData.get("currentPassword");
  if (typeof currentPassword !== "string" || !currentPassword) {
    return { message: "Informe a senha atual.", success: false };
  }

  const { supabase, user } = await requireSession();
  if (!(await rateLimit("password-change", 5, 900, user.id)).allowed) {
    return tooManyAttempts;
  }
  // Confirma que quem está trocando a senha conhece a senha atual: uma sessão
  // aberta (computador compartilhado, cookie roubado) não basta.
  const { error: currentError } = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: currentPassword,
  });
  if (currentError) {
    return { message: "A senha atual não confere.", success: false };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      message:
        "Não foi possível alterar a senha. Entre novamente e tente de novo.",
      success: false,
    };
  }

  return { message: "Senha alterada.", success: true };
}
