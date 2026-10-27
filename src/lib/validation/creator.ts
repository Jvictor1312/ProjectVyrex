import { z } from "zod";

const categories = [
  "games",
  "beleza",
  "tecnologia",
  "humor",
  "lifestyle",
  "esportes",
  "alimentacao",
  "moda",
  "viagens",
  "educacao",
  "musica",
  "outros",
] as const;
const platforms = ["instagram", "tiktok", "youtube", "other"] as const;

export const creatorProfileSchema = z.object({
  publicName: z.string().trim().min(2).max(100),
  city: z.string().trim().max(100).optional(),
  region: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .or(z.literal("")),
  biography: z.string().trim().max(1000).optional(),
  categories: z.array(z.enum(categories)).max(categories.length),
});

export const creatorProfileDraftSchema = z.object({
  publicName: z.string().trim().max(100).default(""),
  city: z.string().trim().max(100).optional(),
  region: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{2}$/)
    .optional()
    .or(z.literal("")),
  biography: z.string().trim().max(1000).optional(),
  categories: z.array(z.enum(categories)).max(categories.length).default([]),
});

export const socialAccountSchema = z
  .object({
    accountId: z.uuid().optional(),
    platform: z.enum(platforms),
    handle: z
      .string()
      .trim()
      .min(1)
      .max(101)
      .transform((value) => value.replace(/^@/, ""))
      .pipe(z.string().min(1).max(100)),
    profileUrl: z.url().max(2048),
    followersReported: z.number().int().min(0).max(2_147_483_647),
  })
  .superRefine((account, context) => {
    let url: URL;
    try {
      url = new URL(account.profileUrl);
    } catch {
      context.addIssue({
        code: "custom",
        path: ["profileUrl"],
        message: "Informe uma URL válida.",
      });
      return;
    }

    if (url.protocol !== "https:") {
      context.addIssue({
        code: "custom",
        path: ["profileUrl"],
        message: "Use uma URL pública HTTPS.",
      });
      return;
    }

    const host = url.hostname.toLowerCase();
    const allowedDomains: Partial<
      Record<(typeof platforms)[number], string[]>
    > = {
      instagram: ["instagram.com"],
      tiktok: ["tiktok.com"],
      youtube: ["youtube.com", "youtu.be"],
    };
    const domains = allowedDomains[account.platform];
    if (
      domains &&
      !domains.some((domain) => host === domain || host.endsWith(`.${domain}`))
    ) {
      context.addIssue({
        code: "custom",
        path: ["profileUrl"],
        message: "A URL não corresponde à rede social selecionada.",
      });
    }
  });

export const evidenceMetadataSchema = z.object({
  socialAccountId: z.uuid(),
  position: z.number().int().min(1).max(5),
  storyPublishedOn: z.iso.date(),
  viewsReported: z.number().int().min(0).max(2_147_483_647),
  creatorNotes: z.string().trim().max(500).optional(),
});

export const categoriesList = categories;
export const socialPlatforms = platforms;
