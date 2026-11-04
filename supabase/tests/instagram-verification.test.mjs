import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

// Verificação das métricas do Instagram (migration 202610310001): token
// inacessível pela API, leitura restrita e gravação de tela conferida pela
// equipe de validação.
const creatorOne = "30000000-0000-4000-8000-000000000001";
const creatorTwo = "30000000-0000-4000-8000-000000000002";
const administrator = "30000000-0000-4000-8000-000000000010";
const unassignedRecruiter = "30000000-0000-4000-8000-000000000011";
const validator = "30000000-0000-4000-8000-000000000014";
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

// Papel do servidor (chave de serviço): sem usuário logado.
async function asService(operation) {
  await database.exec("set role service_role");
  try {
    await database.query("select set_config('request.jwt.claim.sub', '', false)");
    return await operation();
  } finally {
    await database.exec("reset role");
  }
}

async function expectServiceFailure(sql, params, pattern) {
  await assert.rejects(asService(() => database.query(sql, params)), pattern);
}

const recordingPath = (userId, name = "11111111-1111-4111-8111-111111111111") =>
  `${userId}/${name}.mp4`;

before(async () => {
  // Substitutos mínimos de auth/storage, iguais aos de initial-platform.test.mjs.
  await database.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
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
    grant usage on schema public to service_role;
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

  // Todas as migrations, na ordem do nome (a mesma ordem da aplicação real).
  const files = (await readdir(new URL("../migrations/", import.meta.url)))
    .filter((file) => file.endsWith(".sql"))
    .sort();
  for (const file of files) {
    await database.exec(
      await readFile(new URL(`../migrations/${file}`, import.meta.url), "utf8"),
    );
  }

  await database.query(
    `insert into auth.users (id) values ($1), ($2), ($3), ($4), ($5)`,
    [creatorOne, creatorTwo, administrator, unassignedRecruiter, validator],
  );
  for (const [userId, role] of [
    [administrator, "admin"],
    [unassignedRecruiter, "recruiter"],
    [validator, "validator"],
  ]) {
    await database.query(
      "insert into public.user_roles (user_id, role_id) select $1, id from public.roles where key = $2",
      [userId, role],
    );
  }
  // O servidor (chave de serviço) grava a conexão, o token e uma consulta.
  await database.query(
    `insert into public.instagram_connections (creator_id, instagram_user_id, app_scoped_id, username, account_type, granted_scopes)
     values ($1, '17841400000000001', '9000000000001', 'criadora.um', 'MEDIA_CREATOR', array['instagram_business_basic'])`,
    [creatorOne],
  );
  await database.query(
    `insert into public.instagram_tokens (creator_id, access_token_ciphertext, issued_at, expires_at)
     values ($1, 'v1.cifrado', now(), now() + interval '60 days')`,
    [creatorOne],
  );
  await database.query(
    `insert into public.instagram_metric_snapshots (creator_id, instagram_user_id, username, followers_count, unavailable)
     values ($1, '17841400000000001', 'criadora.um', 4200, '{"account_views": "permission_missing"}'::jsonb)`,
    [creatorOne],
  );
});

after(async () => {
  await database.close();
});

test("a creator submits the application without connecting Instagram or sending a recording", async () => {
  const account = await database.query(
    `insert into public.social_accounts (creator_id, platform, handle, profile_url, followers_reported)
     values ($1, 'instagram', 'pessoal', 'https://www.instagram.com/pessoal', 300) returning id`,
    [creatorTwo],
  );
  for (let position = 1; position <= 3; position += 1) {
    const path = `${creatorTwo}/story-${position}.webp`;
    await database.query("insert into storage.objects (bucket_id, name) values ('story-evidence', $1)", [path]);
    await database.query(
      `insert into public.metric_evidence (creator_id, social_account_id, position, storage_path, content_type,
         size_bytes, story_published_on, views_reported)
       values ($1, $2, $3, $4, 'image/webp', 100, current_date - $5::integer, 1500)`,
      [creatorTwo, account.rows[0].id, position, path, position - 1],
    );
  }
  await database.query(
    "update public.creator_profiles set public_name = 'Criadora Dois' where user_id = $1",
    [creatorTwo],
  );
  await asUser(creatorTwo, () => database.query("select public.submit_creator_application()"));
  const result = await database.query(
    `select cp.status,
       (select count(*) from public.instagram_connections where creator_id = cp.user_id)::int as connections,
       (select count(*) from public.metric_recordings where creator_id = cp.user_id)::int as recordings
     from public.creator_profiles cp where cp.user_id = $1`,
    [creatorTwo],
  );
  assert.deepEqual(result.rows[0], { status: "submitted", connections: 0, recordings: 0 });
});

test("signed-in users cannot read or write Instagram tokens, not even their own", async () => {
  await expectFailure(
    creatorOne,
    "select access_token_ciphertext from public.instagram_tokens",
    [],
    /permission denied/,
  );
  await expectFailure(
    creatorOne,
    "insert into public.instagram_tokens (creator_id, access_token_ciphertext) values ($1, 'x')",
    [creatorOne],
    /permission denied/,
  );
  await expectFailure(
    administrator,
    "select access_token_ciphertext from public.instagram_tokens",
    [],
    /permission denied/,
  );
});

test("creators cannot write their own connection or fake API metrics", async () => {
  await expectFailure(
    creatorTwo,
    `insert into public.instagram_connections (creator_id, instagram_user_id, username)
     values ($1, '17841400000000002', 'falsa')`,
    [creatorTwo],
    /permission denied/,
  );
  await expectFailure(
    creatorOne,
    "update public.instagram_metric_snapshots set followers_count = 999999",
    [],
    /permission denied/,
  );
  await expectFailure(
    creatorOne,
    `insert into public.instagram_metric_snapshots (creator_id, instagram_user_id, username, followers_count)
     values ($1, '17841400000000001', 'criadora.um', 999999)`,
    [creatorOne],
    /permission denied/,
  );
});

test("connection and API metrics are visible to the owner and authorized staff only", async () => {
  const own = await asUser(creatorOne, () =>
    database.query("select username, status from public.instagram_connections"),
  );
  assert.deepEqual(own.rows, [{ username: "criadora.um", status: "active" }]);

  const other = await asUser(creatorTwo, () =>
    database.query(
      "select (select count(*) from public.instagram_connections)::int as connections, (select count(*) from public.instagram_metric_snapshots)::int as snapshots",
    ),
  );
  assert.deepEqual(other.rows[0], { connections: 0, snapshots: 0 });

  const recruiter = await asUser(unassignedRecruiter, () =>
    database.query("select count(*)::int as total from public.instagram_metric_snapshots"),
  );
  assert.equal(recruiter.rows[0].total, 0);

  const admin = await asUser(administrator, () =>
    database.query("select followers_count, unavailable from public.instagram_metric_snapshots"),
  );
  assert.deepEqual(admin.rows, [
    { followers_count: 4200, unavailable: { account_views: "permission_missing" } },
  ]);
});

test("one Instagram account cannot stay connected to two creators", async () => {
  await assert.rejects(
    database.query(
      `insert into public.instagram_connections (creator_id, instagram_user_id, username)
       values ($1, '17841400000000001', 'criadora.um')`,
      [creatorTwo],
    ),
    /duplicate key/,
  );
});

const saveRecording =
  "select public.save_creator_metric_recording($1, $2, 'video/mp4', $3, $4) as previous";

test("signed-in users and visitors cannot run the recording function directly", async () => {
  await database.query(
    "insert into storage.objects (bucket_id, name) values ('metric-recordings', $1)",
    [recordingPath(creatorOne, "44444444-4444-4444-8444-444444444444")],
  );
  // O próprio criador, com arquivo dele e dados plausíveis: recusado.
  await expectFailure(
    creatorOne,
    saveRecording,
    [creatorOne, recordingPath(creatorOne, "44444444-4444-4444-8444-444444444444"), 1000, 30],
    /permission denied for function/,
  );
  // A equipe também não registra gravações por essa função.
  await expectFailure(
    administrator,
    saveRecording,
    [creatorOne, recordingPath(creatorOne, "44444444-4444-4444-8444-444444444444"), 1000, 30],
    /permission denied for function/,
  );
  await database.exec("set role anon");
  try {
    await assert.rejects(
      database.query(saveRecording, [
        creatorOne,
        recordingPath(creatorOne, "44444444-4444-4444-8444-444444444444"),
        1000,
        30,
      ]),
      /permission denied for function/,
    );
  } finally {
    await database.exec("reset role");
  }
  const saved = await database.query(
    "select count(*)::int as total from public.metric_recordings",
  );
  assert.equal(saved.rows[0].total, 0);
});

test("the server registers a recording only for the creator's own uploaded file", async () => {
  // Arquivo que não existe no Storage.
  await expectServiceFailure(saveRecording, [creatorOne, recordingPath(creatorOne), 1000, 30], /recording file not found/);
  // Arquivo de outra pessoa: o criador da sessão não grava em nome de outro.
  await database.query(
    "insert into storage.objects (bucket_id, name) values ('metric-recordings', $1)",
    [recordingPath(creatorTwo)],
  );
  await expectServiceFailure(saveRecording, [creatorOne, recordingPath(creatorTwo), 1000, 30], /recording file not found/);
  // Cadastro já enviado (criador dois): não aceita gravação.
  await expectServiceFailure(saveRecording, [creatorTwo, recordingPath(creatorTwo), 1000, 30], /not editable/);
  // Criador inexistente: recusado.
  const nobody = "30000000-0000-4000-8000-000000000099";
  await expectServiceFailure(saveRecording, [nobody, `${nobody}/11111111-1111-4111-8111-111111111111.mp4`, 1000, 30], /not authorized/);

  // Envio pelo Storage passa pela política (pasta própria e cadastro editável).
  await asUser(creatorOne, () =>
    database.query(
      "insert into storage.objects (bucket_id, name) values ('metric-recordings', $1)",
      [recordingPath(creatorOne)],
    ),
  );
  // Conta desativada: recusada.
  await database.query("update public.profiles set is_active = false where id = $1", [creatorOne]);
  await expectServiceFailure(saveRecording, [creatorOne, recordingPath(creatorOne), 1000, 30], /not authorized/);
  await database.query("update public.profiles set is_active = true where id = $1", [creatorOne]);

  const first = await asService(() =>
    database.query(saveRecording, [creatorOne, recordingPath(creatorOne), 1000, 30]),
  );
  assert.equal(first.rows[0].previous, null);
  const audit = await database.query(
    "select actor_id from public.audit_logs where action = 'creator.metric_recording.saved' order by created_at desc limit 1",
  );
  assert.equal(audit.rows[0].actor_id, creatorOne);

  // Duração fora do limite (10 a 180 s) é recusada pelo banco.
  const second = recordingPath(creatorOne, "22222222-2222-4222-8222-222222222222");
  await asUser(creatorOne, () =>
    database.query("insert into storage.objects (bucket_id, name) values ('metric-recordings', $1)", [second]),
  );
  await expectServiceFailure(saveRecording, [creatorOne, second, 1000, 400], /check constraint/);
  // Substituir devolve o caminho anterior para o servidor remover o arquivo.
  const replaced = await asService(() =>
    database.query(saveRecording, [creatorOne, second, 2000, 45]),
  );
  assert.equal(replaced.rows[0].previous, recordingPath(creatorOne));
});

test("other creators and unassigned staff cannot see the recording or its file", async () => {
  const other = await asUser(creatorTwo, () =>
    database.query(
      "select (select count(*) from public.metric_recordings where creator_id = $1)::int as rows, (select count(*) from storage.objects where bucket_id = 'metric-recordings' and name like $2)::int as files",
      [creatorOne, `${creatorOne}/%`],
    ),
  );
  assert.deepEqual(other.rows[0], { rows: 0, files: 0 });

  const recruiter = await asUser(unassignedRecruiter, () =>
    database.query("select count(*)::int as total from public.metric_recordings"),
  );
  assert.equal(recruiter.rows[0].total, 0);

  // Ninguém escreve na tabela diretamente.
  await expectFailure(
    creatorOne,
    "update public.metric_recordings set review_status = 'approved'",
    [],
    /permission denied/,
  );
});

test("validator reviews the recording only while the application is in the queue", async () => {
  const { rows } = await database.query(
    "select id from public.metric_recordings where creator_id = $1",
    [creatorOne],
  );
  const recordingId = rows[0].id;

  // Cadastro ainda em rascunho: fora da fila de validação.
  await expectFailure(
    validator,
    "select public.review_metric_recording($1, 'approved', '')",
    [recordingId],
    /not found or not authorized|not in the validation queue/,
  );
  // O criador não aprova a própria gravação.
  await expectFailure(
    creatorOne,
    "select public.review_metric_recording($1, 'approved', '')",
    [recordingId],
    /not authorized/,
  );

  await database.query(
    "update public.creator_profiles set public_name = 'Criadora Um', status = 'submitted' where user_id = $1",
    [creatorOne],
  );
  await expectFailure(
    validator,
    "select public.review_metric_recording($1, 'rejected', ' ')",
    [recordingId],
    /reason is required/,
  );
  await asUser(validator, () =>
    database.query("select public.review_metric_recording($1, 'approved', '')", [recordingId]),
  );

  const result = await database.query(
    "select review_status, reviewed_by from public.metric_recordings where id = $1",
    [recordingId],
  );
  assert.deepEqual(result.rows[0], { review_status: "approved", reviewed_by: validator });
  const history = await database.query(
    "select action, actor_id from public.review_history where creator_id = $1 order by created_at desc limit 1",
    [creatorOne],
  );
  assert.deepEqual(history.rows[0], { action: "recording_approved", actor_id: validator });

  // Depois do envio, o criador não troca mais a gravação.
  await expectFailure(
    creatorOne,
    "insert into storage.objects (bucket_id, name) values ('metric-recordings', $1)",
    [recordingPath(creatorOne, "33333333-3333-4333-8333-333333333333")],
    /row-level security/,
  );
});
