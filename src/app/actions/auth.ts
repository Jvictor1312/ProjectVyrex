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
  validationFailure,
  type FormState,
} from "@/lib/validation/auth";

const invalidForm: FormState = {
  message: "Confira os campos e tente novamente.",
  success: false,
};
const setupMessage: FormState = {
  message:
    "O acesso está temporariamente indisponível. Tente novamente em alguns minutos.",
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
        "Não conseguimos confirmar o seu acesso agora. Tente entrar novamente.",
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
    return validationFailure(parsed.error, invalidForm.message);
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
        "Não conseguimos concluir o cadastro agora. Confira os dados e tente novamente em alguns minutos.",
      success: false,
    };
  }

  // E-mail já cadastrado: o Supabase devolve um usuário sem identidades. A
  // resposta é a mesma de um cadastro novo (tela de confirmação), para que
  // ninguém descubra quais e-mails têm conta; a tela orienta quem já tem conta
  // a entrar ou recuperar a senha.
  if (data.user && data.user.identities?.length === 0) {
    redirect("/cadastro/confirmacao");
  }

  if (data.session) redirect("/dashboard");
  redirect("/cadastro/confirmacao");
}

export type RecoveryOptions =
  | { status: "idle" }
  | { status: "error"; message: string; identifier?: string }
  | {
      status: "options";
      // E-mail ou CPF (só dígitos), como a pessoa informou.
      identifier: string;
      kind: "email" | "cpf";
      // Só no caminho do e-mail (é o próprio e-mail digitado, mascarado). No
      // caminho do CPF nada da conta é mostrado antes do envio.
      maskedEmail: string | null;
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

// Respostas neutras: o passo 1 só confere o formato do que foi digitado e não
// consulta contas. Assim a tela é igual para quem tem e para quem não tem
// conta, e ninguém descobre se um e-mail ou CPF está cadastrado.
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

  if (looksLikeEmail(raw)) {
    const parsed = recoverySchema.safeParse({ email: raw });
    if (!parsed.success) {
      return { status: "error", message: "Informe um e-mail válido.", identifier: raw };
    }
    return {
      status: "options",
      identifier: parsed.data.email,
      kind: "email",
      maskedEmail: maskEmail(parsed.data.email),
    };
  }

  const cpf = normalizeCpf(raw);
  if (!isValidCpf(cpf)) {
    return {
      status: "error",
      message: "Informe um e-mail ou um CPF válido (11 números).",
      identifier: raw,
    };
  }
  return { status: "options", identifier: cpf, kind: "cpf", maskedEmail: null };
}

const neutralSent = {
  email:
    "Se houver uma conta com esse e-mail, enviamos as instruções de recuperação. Confira também o spam.",
  cpf: "Se houver uma conta ativa com esse CPF, enviamos as instruções para o e-mail cadastrado nela. Confira também o spam.",
};

// Passo 2: envia o link. A resposta é a mesma exista ou não a conta, e leva
// pelo menos o mesmo tempo nos dois casos (o tempo de resposta também não
// pode denunciar a conta).
export async function recoveryAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  if (!isSupabaseConfigured()) return setupMessage;
  const minimumTime = new Promise((resolve) => setTimeout(resolve, 1200));
  const kind = formData.get("kind") === "cpf" ? "cpf" : "email";
  const identifier = String(formData.get("identifier") ?? "").trim();

  // Limite por e-mail ou CPF informado, antes de consultar qualquer conta.
  if (!(await rateLimit("recovery-send", 3, 3600, `${kind}:${identifier}`)).allowed) {
    return tooManyAttempts;
  }

  // O e-mail é sempre resolvido aqui no servidor (o navegador nunca recebe o
  // e-mail completo da conta).
  let email: string | null = null;
  if (kind === "cpf") {
    const cpf = normalizeCpf(identifier);
    if (!isValidCpf(cpf)) return invalidForm;
    const found = await emailForCpf(cpf);
    if (found === "unavailable") {
      return {
        message: "A recuperação por CPF está indisponível no momento. Use o e-mail da conta.",
        success: false,
      };
    }
    email = found;
  } else {
    const parsed = recoverySchema.safeParse({ email: identifier });
    if (!parsed.success) return invalidForm;
    email = parsed.data.email;
  }

  if (email) {
    const supabase = await createSupabaseServerClient();
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/redefinir-senha`,
    });
  }
  await minimumTime;
  return { message: neutralSent[kind], success: true };
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
    return validationFailure(parsed.error, invalidForm.message);
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
