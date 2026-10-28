"use server";

import { redirect } from "next/navigation";
import { fetchActiveRoleKeys } from "@/lib/auth";
import { rateLimit, tooManyAttempts } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { invalidPhoneMessage, normalizePhone } from "@/lib/validation/phone";
import { isValidCpf, looksLikeEmail, normalizeCpf } from "@/lib/validation/cpf";
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
  | { status: "error"; message: string; identifier?: string }
  | {
      status: "options";
      // E-mail ou CPF (só dígitos), como a pessoa informou. No caminho do CPF
      // o e-mail completo nunca vai para o navegador, só a versão mascarada.
      identifier: string;
      kind: "email" | "cpf";
      maskedEmail: string;
      phoneHint: string | null;
    };

// CPF -> e-mail da conta ativa. Só o servidor consegue (chave de serviço).
async function emailForCpf(cpf: string): Promise<string | null | "unavailable"> {
  const admin = createSupabaseAdminClient();
  if (!admin) return "unavailable";
  const { data, error } = await admin.rpc("recovery_email_for_cpf", { lookup_cpf: cpf });
  if (error) return "unavailable";
  return typeof data === "string" && data ? data : null;
}

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
  const raw = String(formData.get("identifier") ?? "").trim().slice(0, 254);
  if (!isSupabaseConfigured()) {
    return { status: "error", message: setupMessage.message, identifier: raw };
  }
  if (!(await rateLimit("recovery-lookup", 10, 900)).allowed) {
    return { status: "error", message: tooManyAttempts.message, identifier: raw };
  }

  let email: string;
  let kind: "email" | "cpf";
  let identifier: string;
  if (looksLikeEmail(raw)) {
    const parsed = recoverySchema.safeParse({ email: raw });
    if (!parsed.success) {
      return { status: "error", message: "Informe um e-mail válido.", identifier: raw };
    }
    email = parsed.data.email;
    kind = "email";
    identifier = email;
  } else {
    const cpf = normalizeCpf(raw);
    if (!isValidCpf(cpf)) {
      return {
        status: "error",
        message: "Informe um e-mail ou um CPF válido (11 números).",
        identifier: raw,
      };
    }
    const found = await emailForCpf(cpf);
    if (found === "unavailable") {
      return {
        status: "error",
        message: "A recuperação por CPF está indisponível no momento. Use o e-mail da conta.",
        identifier: raw,
      };
    }
    if (!found) {
      return {
        status: "error",
        message:
          "Não encontramos uma conta ativa com esse CPF. Tente com o e-mail da conta; o CPF só funciona se tiver sido salvo em Configurações.",
        identifier: raw,
      };
    }
    email = found;
    kind = "cpf";
    identifier = cpf;
  }

  // A dica do celular só pode ser lida pelo servidor (chave de serviço).
  const admin = createSupabaseAdminClient();
  const { data } = admin
    ? await admin.rpc("recovery_phone_hint", { lookup_email: email })
    : { data: null };
  return {
    status: "options",
    identifier,
    kind,
    maskedEmail: maskEmail(email),
    phoneHint: typeof data === "string" && data ? data : null,
  };
}

// Passo 2: envia pelo canal escolhido. O SMS depende de um provedor de envio
// configurado no Supabase; até lá, só o e-mail está disponível.
export async function recoveryAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured()) return setupMessage;
  // O e-mail é sempre resolvido aqui no servidor: pelo próprio e-mail ou
  // buscando de novo pelo CPF (o navegador nunca recebe o e-mail completo).
  const identifier = String(formData.get("identifier") ?? "").trim();
  let email: string | null = null;
  if (formData.get("kind") === "cpf") {
    const cpf = normalizeCpf(identifier);
    const found = isValidCpf(cpf) ? await emailForCpf(cpf) : null;
    email = found && found !== "unavailable" ? found : null;
  } else {
    const parsed = recoverySchema.safeParse({ email: identifier });
    email = parsed.success ? parsed.data.email : null;
  }
  if (!email) return invalidForm;
  const parsed = { data: { email } };

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
      formData.get("kind") === "cpf"
        ? `Enviamos as instruções para ${maskEmail(email)}. Confira a caixa de entrada e o spam.`
        : "Se houver uma conta com esse e-mail, enviamos as instruções de recuperação. Confira também o spam.",
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
