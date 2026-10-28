import { z } from "zod";

export const dataRequestKinds = [
  "access",
  "correction",
  "portability",
  "deletion",
  "objection",
] as const;

export const dataRequestKindLabels: Record<
  (typeof dataRequestKinds)[number],
  string
> = {
  access: "Acesso aos meus dados",
  correction: "Correção de dados",
  portability: "Cópia / portabilidade dos dados",
  deletion: "Eliminação dos dados",
  objection: "Oposição ao tratamento",
};

export const dataRequestStatusLabels: Record<string, string> = {
  open: "Aberta",
  in_progress: "Em andamento",
  resolved: "Concluída",
  rejected: "Não atendida",
};

export const dataRequestSchema = z.object({
  kind: z.enum(dataRequestKinds),
  details: z.string().trim().max(2000).optional(),
});

export const resolveDataRequestSchema = z.object({
  requestId: z.uuid(),
  status: z.enum(["in_progress", "resolved", "rejected"]),
  note: z.string().trim().max(2000).optional(),
});

export const accountSettingsSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  phone: z
    .string()
    .trim()
    .max(32)
    .optional(),
});
