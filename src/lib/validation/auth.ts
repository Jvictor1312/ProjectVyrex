import { z } from "zod";

const strongPasswordSchema = z
  .string()
  .min(11, "Use pelo menos 11 caracteres.")
  .max(128, "Use no máximo 128 caracteres.")
  .regex(/\p{Lu}/u, "Inclua pelo menos uma letra maiúscula.")
  .regex(/\p{Ll}/u, "Inclua pelo menos uma letra minúscula.")
  .regex(/\p{N}/u, "Inclua pelo menos um número.")
  .regex(/[^\p{L}\p{N}\s]/u, "Inclua pelo menos um caractere especial.");

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(128),
});

export const signupSchema = z
  .object({
    fullName: z.string().trim().min(2).max(120),
    email: z.email().max(254),
    password: strongPasswordSchema,
    passwordConfirmation: z.string(),
    phone: z.string().trim().max(32).optional(),
    termsAccepted: z.boolean().refine((accepted) => accepted, {
      message: "É necessário aceitar os termos e a política de privacidade.",
    }),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não coincidem.",
  });

export const recoverySchema = z.object({
  email: z.email().max(254),
});

export const passwordUpdateSchema = z
  .object({
    password: strongPasswordSchema,
    passwordConfirmation: z.string(),
  })
  .refine((values) => values.password === values.passwordConfirmation, {
    path: ["passwordConfirmation"],
    message: "As senhas não coincidem.",
  });

export type FormState = {
  message: string;
  success: boolean;
  // Nome do campo (atributo name) com problema. A tela marca esse campo como
  // inválido, liga-o à mensagem e leva o foco até ele (FieldErrorLink).
  field?: string;
};

// Resposta padrão quando o Zod recusa o formulário: a mensagem do primeiro
// problema e o campo a que ela se refere.
export function validationFailure(error: z.ZodError, fallback: string): FormState {
  const issue = error.issues[0];
  const field = issue?.path[0];
  return {
    message: issue?.message ?? fallback,
    success: false,
    ...(typeof field === "string" ? { field } : {}),
  };
}
