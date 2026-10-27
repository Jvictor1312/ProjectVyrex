"use server";

import { redirect } from "next/navigation";
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

  const { data: roleLinks, error: roleLinksError } = await supabase
    .from("user_roles")
    .select("role_id")
    .eq("user_id", signIn.user.id)
    .is("revoked_at", null);
  if (roleLinksError) {
    await supabase.auth.signOut();
    return {
      message:
        "Não foi possível identificar seu acesso. Tente entrar novamente.",
      success: false,
    };
  }

  const roleIds = (roleLinks ?? []).map((role) => role.role_id);
  const { data: roles, error: rolesError } = roleIds.length
    ? await supabase.from("roles").select("key").in("id", roleIds)
    : { data: [], error: null };
  if (rolesError) {
    await supabase.auth.signOut();
    return {
      message:
        "Não foi possível identificar seu acesso. Tente entrar novamente.",
      success: false,
    };
  }

  redirect(dashboardPathForRoles((roles ?? []).map((role) => role.key)));
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
    termsAccepted: formData.get("termsAccepted") === "on",
  });

  if (!parsed.success) {
    return {
      message: parsed.error.issues[0]?.message ?? invalidForm.message,
      success: false,
    };
  }
  if (!isSupabaseConfigured()) return setupMessage;

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: {
        full_name: parsed.data.fullName,
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

  if (data.session) redirect("/dashboard");
  redirect("/cadastro/confirmacao");
}

export async function recoveryAction(
  _previousState: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = recoverySchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return invalidForm;
  if (!isSupabaseConfigured()) return setupMessage;

  const supabase = await createSupabaseServerClient();
  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback?next=/redefinir-senha`,
  });

  return {
    message:
      "Se houver uma conta com esse e-mail, enviaremos as instruções de recuperação.",
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
