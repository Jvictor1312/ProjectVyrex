"use server";

import { redirect } from "next/navigation";
import { fetchActiveRoleKeys } from "@/lib/auth";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidPhoneMessage, normalizePhone } from "@/lib/validation/phone";
import { dashboardPathForRoles } from "@/lib/auth-routing";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  loginSchema,
  passwordUpdateSchema,
  recoverySchema,
  signupSchema,
  type FormState,
} from "@/lib/validation/auth";

const invalidForm: FormState = {
  message: "Confira os campos e tente novamente.",
  success: false,
};
const setupMessage: FormState = {
  message:
    "A autenticação ainda não foi configurada neste ambiente. Configure o projeto Supabase para continuar.",
  success: false,
};

export async function loginAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) return invalidForm;
  if (!isSupabaseConfigured()) return setupMessage;
  if (
    !(await rateLimit("login-email", 8, 900, parsed.data.email)).allowed ||
    !(await rateLimit("login-ip", 30, 900)).allowed
  ) {
    return tooManyAttempts;
  }

  const supabase = await createSupabaseServerClient();
  const { data: signIn, error } = await supabase.auth.signInWithPassword(
    parsed.data,
  );

  if (error) {
    return {
      message: "E-mail ou senha inválidos. Confira os dados e tente novamente.",
      success: false,
    };
  }

  const roles = await fetchActiveRoleKeys(supabase, signIn.user.id);
  if (roles.error) {
    await supabase.auth.signOut();
    return {
      message:
        "Não foi possível identificar seu acesso. Tente entrar novamente.",
      success: false,
    };
  }

  redirect(dashboardPathForRoles(roles.keys));
}

export async function signupAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = signupSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
    phone: formData.get("phone") || undefined,
    termsAccepted: formData.get("termsAccepted") === "on",
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? invalidForm.message,
      success: false,
    };
  }
  const phone = parsed.data.phone ? normalizePhone(parsed.data.phone) : null;
  if (parsed.data.phone && !phone) {
    return { message: invalidPhoneMessage, success: false };
  }
  if (!isSupabaseConfigured()) return setupMessage;
  if (!(await rateLimit("signup", 5, 3600)).allowed) return tooManyAttempts;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
        ...(phone ? { phone } : {}),
        terms_version: "draft-2026-10-14",
        privacy_version: "draft-2026-10-14",
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/dashboard`,
    },
  });

  if (error) {
    return {
      message:
        "Não foi possível concluir o cadastro agora. Confira os dados e tente novamente.",
      success: false,
    };
  }

  // Com confirmação de e-mail ativa, o Supabase não retorna erro para um
  // e-mail já cadastrado: devolve um usuário sem identidades.
  if (data.user && data.user.identities?.length === 0) {
    return {
      message:
        "Este e-mail já está cadastrado. Entre com sua senha ou use a recuperação de senha.",
      success: false,
    };
  }

  if (data.session) redirect("/dashboard");
  redirect("/cadastro/confirmacao");
}

export type RecoveryOptions =
  | { status: "idle" }
  | { status: "error"; message: string }
  | {
      status: "options";
      email: string;
      maskedEmail: string;
      phoneHint: string | null;
    };

function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  return `${name.slice(0, 2)}•••@${domain}`;
}

// Passo 1: mostra para onde a recuperação pode ser enviada. O e-mail aparece
// mascarado mesmo se não houver conta, para não revelar quem está cadastrado.
export async function recoveryOptionsAction(
  _previousState: RecoveryOptions,
  formData: FormData,
): Promise<RecoveryOptions> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) {
    return { status: "error", message: "Informe um e-mail válido." };
  }
  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage.message };
  }

  if (!(await rateLimit("recovery-lookup", 10, 900)).allowed) {
    return { status: "error", message: tooManyAttempts.message };
  }

  // A dica do celular só pode ser lida pelo servidor (chave de serviço).
  const admin = createSupabaseAdminClient();
  const { data } = admin
    ? await admin.rpc("recovery_phone_hint", {
        lookup_email: parsed.data.email,
      })
    : { data: null };
  return {
    status: "options",
    email: parsed.data.email,
    maskedEmail: maskEmail(parsed.data.email),
    phoneHint: typeof data === "string" && data ? data : null,
  };
}

// Passo 2: envia pelo canal escolhido. O SMS depende de um provedor de envio
// configurado no Supabase; até lá, só o e-mail está disponível.
export async function recoveryAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidForm;
  if (!isSupabaseConfigured()) return setupMessage;

  if (!(await rateLimit("recovery-send", 3, 3600, parsed.data.email)).allowed) {
    return tooManyAttempts;
  }
  if (formData.get("channel") === "phone") {
    return {
      message: "O envio por SMS ainda não está disponível. Use o e-mail.",
      success: false,
    };
  }

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/redefinir-senha`,
  });

  return {
    message:
      "Se houver uma conta com esse e-mail, enviamos as instruções de recuperação.",
    success: true,
  };
}

export async function passwordUpdateAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = passwordUpdateSchema.safeParse({
    password: formData.get("password"),
    passwordConfirmation: formData.get("passwordConfirmation"),
  });
  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? invalidForm.message,
      success: false,
    };
  }
  if (!isSupabaseConfigured()) return setupMessage;

  const supabase = await createSupabaseServerClient();
  const { data, error: userError } = await supabase.auth.getUser();
  if (userError || !data.user) {
    return {
      message:
        "O link expirou ou é inválido. Solicite uma nova recuperação de senha.",
      success: false,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return {
      message:
        "Não foi possível atualizar a senha. Solicite um novo link de recuperação.",
      success: false,
    };
  }
  redirect("/login?senha-atualizada=1");
}

export async function logoutAction() {
  if (!isSupabaseConfigured()) redirect("/login?configuracao=supabase");
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/");
}
