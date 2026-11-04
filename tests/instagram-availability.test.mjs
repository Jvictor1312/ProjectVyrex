import assert from "node:assert/strict";
import { register } from "node:module";
import { afterEach, test } from "node:test";

// Carregador das telas de verificação (src/lib/instagram/view-data.ts) com um
// Supabase simulado: banco sem a migration 202610310001 (PGRST205), falha
// inesperada e banco com a estrutura.
register("./alias-hooks.mjs", import.meta.url);
const { loadMetricVerification } = await import("../src/lib/instagram/view-data.ts");
const availability = await import("../src/lib/instagram/availability.ts");

const creator = "40000000-0000-4000-8000-000000000001";
const missingTable = (table) => ({
  data: null,
  error: {
    code: "PGRST205",
    message: `Could not find the table 'public.${table}' in the schema cache`,
  },
});

function fakeSupabase(resultFor) {
  const calls = [];
  const client = {
    from(table) {
      calls.push(table);
      const result = resultFor(table);
      const chain = {
        select: () => chain,
        eq: () => chain,
        order: () => chain,
        limit: () => chain,
        maybeSingle: async () => result,
      };
      return chain;
    },
    storage: {
      from: () => ({
        createSignedUrl: async () => ({ data: { signedUrl: "https://assinada.test/video" }, error: null }),
      }),
    },
  };
  return { client, calls };
}

function captureConsole() {
  const lines = { warn: [], error: [] };
  const original = { warn: console.warn, error: console.error };
  console.warn = (line) => lines.warn.push(String(line));
  console.error = (line) => lines.error.push(String(line));
  return { lines, restore: () => Object.assign(console, original) };
}

afterEach(() => availability.forgetStructureMissing());

test("only 'table not found' codes count as missing structure", () => {
  assert.equal(availability.isMissingStructureError({ code: "PGRST205" }), true);
  assert.equal(availability.isMissingStructureError({ code: "42P01" }), true);
  assert.equal(availability.isMissingStructureError({ code: "42501" }), false);
  assert.equal(availability.isMissingStructureError({ code: "PGRST116" }), false);
  assert.equal(availability.isMissingStructureError(null), false);
});

test("without the migration the page gets a controlled 'unavailable' state and a clear warning", async () => {
  const { client, calls } = fakeSupabase(missingTable);
  const output = captureConsole();
  let data;
  try {
    data = await loadMetricVerification(client, creator);
  } finally {
    output.restore();
  }
  assert.deepEqual(data, {
    connection: null,
    snapshot: null,
    recording: null,
    available: false,
    loadError: false,
  });
  assert.equal(calls.length, 3);
  assert.equal(output.lines.warn.length, 1);
  assert.match(output.lines.warn[0], /202610310001_instagram_metric_verification/);
  assert.match(output.lines.warn[0], /"nivel":"aviso"/);

  // Nos 60 s seguintes, as telas não consultam tabelas que não existem.
  const again = fakeSupabase(missingTable);
  assert.equal((await loadMetricVerification(again.client, creator)).available, false);
  assert.equal(again.calls.length, 0);

  // Passado o intervalo, confere de novo (a migration pode ter sido aplicada).
  assert.equal(availability.isStructureKnownMissing(Date.now() + availability.missingStructureRecheckMs + 1), false);
});

test("an unexpected database failure stays an error and is not treated as missing structure", async () => {
  const failure = { data: null, error: { code: "XX000", message: "falha interna" } };
  const { client } = fakeSupabase((table) =>
    table === "instagram_connections" ? failure : { data: null, error: null },
  );
  const output = captureConsole();
  let data;
  try {
    data = await loadMetricVerification(client, creator);
  } finally {
    output.restore();
  }
  assert.equal(data.available, true);
  assert.equal(data.loadError, true);
  // Não silencia nem reclassifica: nenhum aviso de migration pendente, e a
  // próxima tela consulta de novo.
  assert.equal(output.lines.warn.length, 0);
  assert.equal(availability.isStructureKnownMissing(), false);
});

test("with the structure in place, real rows are returned as they are", async () => {
  const { client } = fakeSupabase((table) => {
    if (table === "metric_recordings") {
      return {
        data: {
          id: "r1",
          storage_path: `${creator}/11111111-1111-4111-8111-111111111111.mp4`,
          content_type: "video/mp4",
          size_bytes: 1000,
          duration_seconds: "45.0",
          review_status: "pending",
          review_reason: null,
          created_at: "2026-10-31T10:00:00Z",
          reviewed_at: null,
        },
        error: null,
      };
    }
    return { data: null, error: null };
  });
  const data = await loadMetricVerification(client, creator);
  assert.equal(data.available, true);
  assert.equal(data.loadError, false);
  assert.equal(data.connection, null);
  assert.equal(data.snapshot, null);
  assert.equal(data.recording?.durationSeconds, 45);
  assert.equal(data.recording?.url, "https://assinada.test/video");
});
