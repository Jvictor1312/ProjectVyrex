import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const creatorOne = "20000000-0000-4000-8000-000000000001";
const creatorTwo = "20000000-0000-4000-8000-000000000002";
const administrator = "20000000-0000-4000-8000-000000000010";
const recruiter = "20000000-0000-4000-8000-000000000011";
const database = new PGlite();

async function asUser(userId, operation) {
  await database.exec("set role authenticated");
  try {
    await database.query(
      "select set_config('request.jwt.claim.sub', $1, false)",
      [userId],
    );
    return await operation();
  } finally {
    await database.exec("reset role");
  }
}

async function expectFailure(userId, sql, params, pattern) {
  await assert.rejects(
    asUser(userId, () => database.query(sql, params)),
    pattern,
  );
}

before(async () => {
  // Substitutos mínimos de auth/storage, iguais aos de initial-platform.test.mjs.
  await database.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create schema auth;
    create schema storage;
    create table auth.users (
      id uuid primary key,
      raw_user_meta_data jsonb not null default '{}'::jsonb
    );
    create function auth.uid() returns uuid
      language sql stable
      as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
    create table storage.buckets (
      id text primary key,
      name text not null,
      public boolean not null default false,
      file_size_limit bigint,
      allowed_mime_types text[]
    );
    create table storage.objects (
      bucket_id text not null,
      name text not null,
      primary key (bucket_id, name)
    );
    alter table storage.objects enable row level security;
    grant usage on schema auth, storage to authenticated;
    grant execute on function auth.uid() to authenticated;
    grant select, insert, update, delete on storage.objects to authenticated;
    grant select on storage.buckets to authenticated;
    create function storage.foldername(object_name text) returns text[]
      language sql immutable
      as $$
        select coalesce(array_agg(parts.part order by parts.ordinality), '{}'::text[])
        from unnest(string_to_array(object_name, '/')) with ordinality as parts(part, ordinality)
        where parts.ordinality < cardinality(string_to_array(object_name, '/'))
      $$;
  `);

  for (const file of [
    "202610140001_initial_platform.sql",
    "202610150001_data_requests.sql",
    "202610150002_social_account_updates.sql",
    "202610150003_submission_profile_name.sql",
    "202610150004_creator_growth_criteria.sql",
  ]) {
    await database.exec(
      await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
    );
  }

  await database.query(
    `insert into auth.users (id) values ($1), ($2), ($3), ($4)`,
    [creatorOne, creatorTwo, administrator, recruiter],
  );
  for (const [userId, role] of [
    [administrator, "admin"],
    [recruiter, "recruiter"],
  ]) {
    await database.query(
      "insert into public.user_roles (user_id, role_id) select $1, id from public.roles where key = $2",
      [userId, role],
    );
  }
});

after(async () => {
  await database.close();
});

test("criador registra solicitação de privacidade com notificação e auditoria", async () => {
  const created = await asUser(creatorOne, () =>
    database.query(
      "select public.create_data_request('access', '  Quero uma cópia dos meus dados  ') as id",
    ),
  );
  const requestId = created.rows[0].id;
  assert.ok(requestId);

  const stored = await database.query(
    "select kind, status, details from public.data_requests where id = $1",
    [requestId],
  );
  assert.deepEqual(stored.rows[0], {
    kind: "access",
    status: "open",
    details: "Quero uma cópia dos meus dados",
  });
  const notifications = await database.query(
    "select count(*)::int as total from public.notifications where user_id = $1 and title like 'Solicitação de privacidade%'",
    [creatorOne],
  );
  assert.equal(notifications.rows[0].total, 1);
  const audit = await database.query(
    "select count(*)::int as total from public.audit_logs where action = 'privacy.request.created' and entity_id = $1",
    [requestId],
  );
  assert.equal(audit.rows[0].total, 1);
});

test("não permite pedido ativo duplicado nem tipo inválido", async () => {
  await expectFailure(
    creatorOne,
    "select public.create_data_request('access')",
    [],
    /duplicate key|unique/i,
  );
  await expectFailure(
    creatorOne,
    "select public.create_data_request('hack')",
    [],
    /invalid request kind/i,
  );
});

test("criador não escreve diretamente nem lê pedidos de outra pessoa", async () => {
  await expectFailure(
    creatorOne,
    "update public.data_requests set status = 'resolved'",
    [],
    /permission denied/i,
  );
  await expectFailure(
    creatorOne,
    "insert into public.data_requests (user_id, kind) values ($1, 'other')",
    [creatorOne],
    /permission denied/i,
  );

  const own = await asUser(creatorOne, () =>
    database.query("select count(*)::int as total from public.data_requests"),
  );
  assert.equal(own.rows[0].total, 1);
  const other = await asUser(creatorTwo, () =>
    database.query("select count(*)::int as total from public.data_requests"),
  );
  assert.equal(other.rows[0].total, 0);
  const staff = await asUser(recruiter, () =>
    database.query("select count(*)::int as total from public.data_requests"),
  );
  assert.equal(staff.rows[0].total, 0);
});

test("somente administrador resolve; encerramento exige justificativa e é definitivo", async () => {
  const request = await database.query(
    "select id from public.data_requests where user_id = $1 and kind = 'access'",
    [creatorOne],
  );
  const requestId = request.rows[0].id;

  await expectFailure(
    creatorOne,
    "select public.resolve_data_request($1, 'resolved', 'eu mesmo')",
    [requestId],
    /not authorized/i,
  );
  await expectFailure(
    recruiter,
    "select public.resolve_data_request($1, 'resolved', 'não devo')",
    [requestId],
    /not authorized/i,
  );
  await expectFailure(
    administrator,
    "select public.resolve_data_request($1, 'resolved', null)",
    [requestId],
    /note is required/i,
  );

  await asUser(administrator, () =>
    database.query("select public.resolve_data_request($1, 'in_progress')", [
      requestId,
    ]),
  );
  await asUser(administrator, () =>
    database.query(
      "select public.resolve_data_request($1, 'resolved', 'Cópia enviada por canal seguro.')",
      [requestId],
    ),
  );
  const closed = await database.query(
    "select status, resolved_by, resolution_note from public.data_requests where id = $1",
    [requestId],
  );
  assert.equal(closed.rows[0].status, "resolved");
  assert.equal(closed.rows[0].resolved_by, administrator);
  assert.equal(
    closed.rows[0].resolution_note,
    "Cópia enviada por canal seguro.",
  );

  await expectFailure(
    administrator,
    "select public.resolve_data_request($1, 'in_progress')",
    [requestId],
    /already closed/i,
  );

  const again = await asUser(creatorOne, () =>
    database.query("select public.create_data_request('access') as id"),
  );
  assert.ok(again.rows[0].id);
});
