import assert from "node:assert/strict";
import { test } from "node:test";
import sharp from "sharp";
import {
  passwordUpdateSchema,
  signupSchema,
} from "../src/lib/validation/auth.ts";
import {
  categoriesList,
  creatorProfileDraftSchema,
  creatorProfileSchema,
  evidenceMetadataSchema,
  socialAccountSchema,
} from "../src/lib/validation/creator.ts";
import { normalizeEvidenceImage } from "../src/lib/evidence/normalize.ts";
import { safeLocalRedirectPath } from "../src/lib/security/redirect.ts";
import { dashboardPathForRoles } from "../src/lib/auth-routing.ts";
import { isLoopbackSupabaseUrl } from "../scripts/seed-local-test-users.mjs";

const validSignup = {
  fullName: "Criadora de Teste",
  email: "creator@example.test",
  password: "Abcdefgh1!x",
  passwordConfirmation: "Abcdefgh1!x",
  termsAccepted: true,
};

test("signup requires matching passwords and explicit terms acceptance", () => {
  assert.equal(signupSchema.safeParse(validSignup).success, true);
  assert.equal(
    signupSchema.safeParse({
      ...validSignup,
      passwordConfirmation: "a-different-password-value",
    }).success,
    false,
  );
  assert.equal(
    signupSchema.safeParse({ ...validSignup, termsAccepted: false }).success,
    false,
  );
});

test("new passwords require 11 characters, uppercase, lowercase, and a special character", () => {
  assert.equal(
    signupSchema.safeParse({
      ...validSignup,
      password: "Abcdefgh1!x",
      passwordConfirmation: "Abcdefgh1!x",
    }).success,
    true,
  );
  for (const password of [
    "Abcde1!xy",
    "abcdefgh1!x",
    "ABCDEFGH1!X",
    "Abcdefgh12X",
  ]) {
    assert.equal(
      signupSchema.safeParse({
        ...validSignup,
        password,
        passwordConfirmation: password,
      }).success,
      false,
    );
  }
});

test("login destination follows internal roles while preserving creator access", () => {
  assert.equal(dashboardPathForRoles(["influencer"]), "/dashboard");
  assert.equal(dashboardPathForRoles([]), "/dashboard");
  for (const role of [
    "admin",
    "recruiter",
    "relationship_manager",
    "validator",
  ]) {
    assert.equal(dashboardPathForRoles([role]), "/interno");
  }
  assert.equal(
    dashboardPathForRoles(["influencer", "relationship_manager"]),
    "/interno",
  );
});

test("local test-account seed rejects remote Supabase URLs", () => {
  assert.equal(isLoopbackSupabaseUrl("http://localhost:54321"), true);
  assert.equal(isLoopbackSupabaseUrl("http://127.0.0.1:54321"), true);
  assert.equal(isLoopbackSupabaseUrl("http://[::1]:54321"), true);
  assert.equal(isLoopbackSupabaseUrl("https://project.supabase.co"), false);
  assert.equal(isLoopbackSupabaseUrl("https://localhost.attacker.test"), false);
  assert.equal(isLoopbackSupabaseUrl("not-a-url"), false);
});

test("password recovery requires the same strong password policy as signup", () => {
  assert.equal(
    passwordUpdateSchema.safeParse({
      password: "Abcdefgh1!x",
      passwordConfirmation: "Abcdefgh1!x",
    }).success,
    true,
  );
  assert.equal(
    passwordUpdateSchema.safeParse({
      password: "short",
      passwordConfirmation: "short",
    }).success,
    false,
  );
});

test("social accounts reject insecure and deceptive profile URLs", () => {
  const validAccount = {
    platform: "instagram",
    handle: "@criador",
    profileUrl: "https://www.instagram.com/criador",
    followersReported: 3000,
  };
  const validResult = socialAccountSchema.safeParse(validAccount);

  assert.equal(validResult.success, true);
  assert.equal(validResult.data.handle, "criador");
  assert.equal(
    socialAccountSchema.safeParse({
      ...validAccount,
      profileUrl: "http://instagram.com/criador",
    }).success,
    false,
  );
  assert.equal(
    socialAccountSchema.safeParse({
      ...validAccount,
      profileUrl: "https://instagram.com.attacker.test/criador",
    }).success,
    false,
  );
});

test("creator profile accepts the complete product category list", () => {
  assert.deepEqual(categoriesList, [
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
  ]);
  assert.equal(
    creatorProfileSchema.safeParse({
      publicName: "Criador de Teste",
      categories: categoriesList,
    }).success,
    true,
  );
  assert.equal(
    creatorProfileSchema.safeParse({
      publicName: "Criador de Teste",
      categories: ["categoria-invalida"],
    }).success,
    false,
  );
});

test("creator profile drafts allow incomplete fields but validate supplied values", () => {
  assert.deepEqual(creatorProfileDraftSchema.parse({}), {
    publicName: "",
    categories: [],
  });
  assert.equal(
    creatorProfileDraftSchema.safeParse({
      publicName: "",
      region: "sp",
      categories: ["tecnologia"],
    }).success,
    true,
  );
  assert.equal(
    creatorProfileDraftSchema.safeParse({ region: "São Paulo" }).success,
    false,
  );
});

test("evidence metadata is limited to the five supported positions and valid dates", () => {
  const validEvidence = {
    socialAccountId: "10000000-0000-4000-8000-000000000001",
    position: 5,
    storyPublishedOn: "2026-10-10",
    viewsReported: 2000,
  };

  assert.equal(evidenceMetadataSchema.safeParse(validEvidence).success, true);
  assert.equal(
    evidenceMetadataSchema.safeParse({ ...validEvidence, position: 6 }).success,
    false,
  );
  assert.equal(
    evidenceMetadataSchema.safeParse({
      ...validEvidence,
      storyPublishedOn: "2026-02-31",
    }).success,
    false,
  );
});

test("image normalization decodes real input and strips metadata into WebP", async () => {
  const png = await sharp({
    create: {
      width: 8,
      height: 6,
      channels: 3,
      background: { r: 24, g: 24, b: 24 },
    },
  })
    .png()
    .toBuffer();
  const normalized = await normalizeEvidenceImage(png);
  const metadata = await sharp(normalized).metadata();

  assert.equal(metadata.format, "webp");
  assert.equal(metadata.exif, undefined);
});

test("image normalization rejects spoofed and oversized file contents", async () => {
  await assert.rejects(
    normalizeEvidenceImage(Buffer.from("<script>alert(1)</script>")),
    /unsupported|input/i,
  );
  await assert.rejects(
    normalizeEvidenceImage(Buffer.alloc(8 * 1024 * 1024 + 1)),
    /invalid image size/i,
  );
});

test("callback redirect accepts only a normalized local destination", () => {
  assert.equal(
    safeLocalRedirectPath("/dashboard?tab=profile"),
    "/dashboard?tab=profile",
  );
  for (const destination of [
    "//attacker.example/path",
    "https://attacker.example/path",
    "/\\attacker.example/path",
    "javascript:alert(1)",
  ]) {
    assert.equal(safeLocalRedirectPath(destination), "/dashboard");
  }
});
