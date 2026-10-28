import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { after, before, test } from "node:test";
import { PGlite } from "@electric-sql/pglite";

const creatorOne = "10000000-0000-4000-8000-000000000001";
const creatorTwo = "10000000-0000-4000-8000-000000000002";
const creatorThree = "10000000-0000-4000-8000-000000000003";
const administrator = "10000000-0000-4000-8000-000000000010";
const assignedRecruiter = "10000000-0000-4000-8000-000000000011";
const unassignedRecruiter = "10000000-0000-4000-8000-000000000012";
const relationshipManager = "10000000-0000-4000-8000-000000000013";
const validator = "10000000-0000-4000-8000-000000000014";
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

before(async () => {
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

  const migration = await readFile(
    new URL("../migrations/202610140001_initial_platform.sql", import.meta.url),
    "utf8",
  );
  await database.exec(migration);
  const socialAccountUpdates = await readFile(
    new URL(
      "../migrations/202610150002_social_account_updates.sql",
      import.meta.url,
    ),
    "utf8",
  );
  await database.exec(socialAccountUpdates);
  await database.exec(
    await readFile(
      new URL(
        "../migrations/202610150003_submission_profile_name.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await database.exec(
    await readFile(
      new URL(
        "../migrations/202610150004_creator_growth_criteria.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await database.exec(
    await readFile(
      new URL(
        "../migrations/202610280002_three_required_evidence.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await database.query(
    "insert into auth.users (id, raw_user_meta_data) values ($1, '{}'::jsonb), ($2, '{}'::jsonb), ($3, '{}'::jsonb)",
    [creatorOne, creatorTwo, creatorThree],
  );
  await database.query(
    `insert into auth.users (id, raw_user_meta_data)
     values ($1, '{}'::jsonb), ($2, '{}'::jsonb), ($3, '{}'::jsonb), ($4, '{}'::jsonb), ($5, '{}'::jsonb)`,
    [
      administrator,
      assignedRecruiter,
      unassignedRecruiter,
      relationshipManager,
      validator,
    ],
  );
  for (const [userId, role] of [
    [administrator, "admin"],
    [assignedRecruiter, "recruiter"],
    [unassignedRecruiter, "recruiter"],
    [relationshipManager, "relationship_manager"],
    [validator, "validator"],
  ]) {
    await database.query(
      "insert into public.user_roles (user_id, role_id) select $1, id from public.roles where key = $2",
      [userId, role],
    );
  }
  await database.query(
    "insert into public.recruiter_assignments (creator_id, recruiter_id, assigned_by) values ($1, $2, $3)",
    [creatorOne, assignedRecruiter, administrator],
  );
  await database.query(
    "insert into public.relationship_assignments (creator_id, manager_id, assigned_by) values ($1, $2, $3)",
    [creatorOne, relationshipManager, administrator],
  );
  await database.query(
    "update public.creator_profiles set public_name = 'Creator Two', status = 'submitted' where user_id = $1",
    [creatorTwo],
  );
  await database.query(
    "insert into storage.objects (bucket_id, name) values ('story-evidence', $1), ('story-evidence', $2)",
    [`${creatorOne}/private.webp`, `${creatorTwo}/private.webp`],
  );
});

after(async () => {
  await database.close();
});

test("migration creates five distinct roles and default eligibility criteria", async () => {
  const roles = await database.query(
    "select key from public.roles order by key",
  );
  const settings = await database.query(
    "select minimum_followers, required_story_evidence, minimum_story_views, max_story_age_days from public.eligibility_settings where singleton",
  );

  assert.deepEqual(
    roles.rows.map((row) => row.key),
    ["admin", "influencer", "recruiter", "relationship_manager", "validator"],
  );
  assert.deepEqual(settings.rows[0], {
    minimum_followers: 0,
    required_story_evidence: 3,
    minimum_story_views: 1000,
    max_story_age_days: 7,
  });
});

test("signup trigger creates an incomplete creator with only influencer permissions", async () => {
  await database.query(
    "select set_config('request.jwt.claim.sub', $1, false)",
    [creatorOne],
  );
  const creator = await database.query(
    "select cp.status, public.has_permission('creators.profile.own') as can_edit, public.has_permission('creators.manage_roles') as can_manage_roles from public.creator_profiles cp where cp.user_id = $1",
    [creatorOne],
  );

  assert.deepEqual(creator.rows[0], {
    status: "incomplete",
    can_edit: true,
    can_manage_roles: false,
  });
});

test("database blocks submitting a creator profile without a public name", async () => {
  await assert.rejects(
    database.query(
      "update public.creator_profiles set status = 'submitted' where user_id = $1",
      [creatorOne],
    ),
    /public name is required before submission/i,
  );

  const profile = await database.query(
    "select status, public_name from public.creator_profiles where user_id = $1",
    [creatorOne],
  );
  assert.deepEqual(profile.rows[0], {
    status: "incomplete",
    public_name: "",
  });
});

test("authenticated creators cannot read another creator's profile or private evidence", async () => {
  await database.exec("set role authenticated");
  try {
    await database.query(
      "select set_config('request.jwt.claim.sub', $1, false)",
      [creatorOne],
    );
    const profiles = await database.query(
      "select user_id from public.creator_profiles order by user_id",
    );
    const files = await database.query(
      "select name from storage.objects where bucket_id = 'story-evidence'",
    );

    assert.deepEqual(
      profiles.rows.map((row) => row.user_id),
      [creatorOne],
    );
    assert.deepEqual(
      files.rows.map((row) => row.name),
      [`${creatorOne}/private.webp`],
    );
  } finally {
    await database.exec("reset role");
  }
});

test("creators can mark only their own notifications as read", async () => {
  const ownNotification = await database.query(
    `insert into public.notifications (user_id, kind, title, body)
     values ($1, 'system', 'Own notification', 'Visible to its recipient')
     returning id`,
    [creatorOne],
  );
  const otherNotification = await database.query(
    `insert into public.notifications (user_id, kind, title, body)
     values ($1, 'system', 'Private notification', 'Not visible to another user')
     returning id`,
    [creatorTwo],
  );

  const result = await asUser(creatorOne, async () => {
    const visible = await database.query(
      "select id from public.notifications order by id",
    );
    const updated = await database.query(
      "update public.notifications set read_at = now() where id = $1 returning id",
      [ownNotification.rows[0].id],
    );
    const crossAccountUpdate = await database.query(
      "update public.notifications set read_at = now() where id = $1 returning id",
      [otherNotification.rows[0].id],
    );

    await assert.rejects(
      database.query(
        "update public.notifications set title = 'Changed' where id = $1",
        [ownNotification.rows[0].id],
      ),
      /permission denied/i,
    );

    return { visible, updated, crossAccountUpdate };
  });

  assert.deepEqual(result.visible.rows, [{ id: ownNotification.rows[0].id }]);
  assert.equal(result.updated.rows[0].id, ownNotification.rows[0].id);
  assert.deepEqual(result.crossAccountUpdate.rows, []);

  const otherReadState = await database.query(
    "select read_at from public.notifications where id = $1",
    [otherNotification.rows[0].id],
  );
  assert.equal(otherReadState.rows[0].read_at, null);
});

test("creators see only their own messages marked visible to them", async () => {
  await database.query(
    `insert into public.team_messages
       (creator_id, sender_id, body, visible_to_creator)
     values ($1, $2, 'Visible message', true),
            ($1, $2, 'Internal note', false),
            ($3, $2, 'Another creator message', true)`,
    [creatorOne, administrator, creatorTwo],
  );

  const visibleMessages = await asUser(creatorOne, async () => {
    const result = await database.query(
      "select body from public.team_messages order by body",
    );
    return result.rows.map((row) => row.body);
  });

  assert.deepEqual(visibleMessages, ["Visible message"]);
});

test("creator cannot alter protected status or grant an internal role", async () => {
  await database.exec("set role authenticated");
  try {
    await database.query(
      "select set_config('request.jwt.claim.sub', $1, false)",
      [creatorOne],
    );
    await assert.rejects(
      database.query(
        "update public.creator_profiles set status = 'approved' where user_id = $1",
        [creatorOne],
      ),
      /permission denied/i,
    );
    await assert.rejects(
      database.query(
        "insert into public.user_roles (user_id, role_id) select $1, id from public.roles where key = 'admin'",
        [creatorOne],
      ),
      /permission denied/i,
    );
  } finally {
    await database.exec("reset role");
  }
});

test("staff only see creators allowed by their role and assignments", async () => {
  const visibleCreatorIds = async (userId) =>
    asUser(userId, async () => {
      const result = await database.query(
        "select user_id from public.creator_profiles where user_id in ($1, $2) order by user_id",
        [creatorOne, creatorTwo],
      );
      return result.rows.map((row) => row.user_id);
    });

  assert.deepEqual(await visibleCreatorIds(assignedRecruiter), [creatorOne]);
  assert.deepEqual(await visibleCreatorIds(unassignedRecruiter), []);
  assert.deepEqual(await visibleCreatorIds(relationshipManager), [creatorOne]);
  assert.deepEqual(await visibleCreatorIds(validator), [creatorTwo]);
  assert.deepEqual(await visibleCreatorIds(administrator), [
    creatorOne,
    creatorTwo,
  ]);
});

test("only assigned staff and validation staff can read their permitted evidence", async () => {
  const visibleFiles = async (userId) =>
    asUser(userId, async () => {
      const result = await database.query(
        "select name from storage.objects where bucket_id = 'story-evidence' order by name",
      );
      return result.rows.map((row) => row.name);
    });

  assert.deepEqual(await visibleFiles(assignedRecruiter), [
    `${creatorOne}/private.webp`,
  ]);
  assert.deepEqual(await visibleFiles(unassignedRecruiter), []);
  assert.deepEqual(await visibleFiles(validator), [
    `${creatorTwo}/private.webp`,
  ]);
  assert.deepEqual(await visibleFiles(administrator), [
    `${creatorOne}/private.webp`,
    `${creatorTwo}/private.webp`,
  ]);
});

test("influencer cannot make a validation decision through the RPC", async () => {
  await assert.rejects(
    asUser(creatorOne, () =>
      database.query(
        "select public.record_review_decision($1, 'approved', 'test attempt')",
        [creatorOne],
      ),
    ),
    /not authorized/i,
  );
});

test("creator can edit a verified social account and resets its verification", async () => {
  const inserted = await database.query(
    `insert into public.social_accounts (
       creator_id, platform, handle, profile_url, followers_reported,
       verification_status, verified_at, verified_by
     ) values ($1, 'instagram', 'verified-creator', 'https://www.instagram.com/verified-creator', 3000,
       'verified', now(), $2)
     returning id`,
    [creatorOne, validator],
  );

  const updated = await asUser(creatorOne, () =>
    database.query(
      `update public.social_accounts
       set handle = 'corrected-creator', profile_url = 'https://www.instagram.com/corrected-creator'
       where id = $1
       returning verification_status, verified_at, verified_by`,
      [inserted.rows[0].id],
    ),
  );

  assert.deepEqual(updated.rows[0], {
    verification_status: "unverified",
    verified_at: null,
    verified_by: null,
  });
  const audit = await database.query(
    "select actor_id, action from public.audit_logs where entity_id = $1 and action = 'creator.social_account.verification_reset'",
    [inserted.rows[0].id],
  );
  assert.deepEqual(audit.rows, [
    {
      actor_id: creatorOne,
      action: "creator.social_account.verification_reset",
    },
  ]);
});

test("upload quota blocks the eleventh direct Storage upload", async () => {
  await asUser(creatorOne, async () => {
    for (let index = 1; index <= 10; index += 1) {
      await database.query(
        "insert into storage.objects (bucket_id, name) values ('story-evidence', $1)",
        [`${creatorOne}/quota-${index}.webp`],
      );
    }
    await assert.rejects(
      database.query(
        "insert into storage.objects (bucket_id, name) values ('story-evidence', $1)",
        [`${creatorOne}/quota-11.webp`],
      ),
      /row-level security policy/i,
    );
  });
});

test("assigned relationship manager can request corrections with an audit trail", async () => {
  await database.query(
    "update public.creator_profiles set public_name = 'Creator One', status = 'submitted' where user_id = $1",
    [creatorOne],
  );
  await asUser(relationshipManager, () =>
    database.query(
      "select public.request_creator_corrections($1, 'Atualize a URL do perfil')",
      [creatorOne],
    ),
  );

  const profile = await database.query(
    "select status, decided_by, decision_reason from public.creator_profiles where user_id = $1",
    [creatorOne],
  );
  const history = await database.query(
    "select actor_id, action, reason from public.review_history where creator_id = $1 order by created_at desc limit 1",
    [creatorOne],
  );

  assert.deepEqual(profile.rows[0], {
    status: "changes_requested",
    decided_by: relationshipManager,
    decision_reason: "Atualize a URL do perfil",
  });
  assert.deepEqual(history.rows[0], {
    actor_id: relationshipManager,
    action: "changes_requested",
    reason: "Atualize a URL do perfil",
  });
});

test("rejection records the authorized reviewer, date, and reason", async () => {
  await asUser(validator, () =>
    database.query(
      "select public.record_review_decision($1, 'rejected', 'As métricas não conferem')",
      [creatorTwo],
    ),
  );

  const profile = await database.query(
    "select status, decided_by, decided_at, decision_reason from public.creator_profiles where user_id = $1",
    [creatorTwo],
  );
  const history = await database.query(
    "select actor_id, action, reason from public.review_history where creator_id = $1 order by created_at desc limit 1",
    [creatorTwo],
  );

  assert.equal(profile.rows[0].status, "rejected");
  assert.equal(profile.rows[0].decided_by, validator);
  assert.ok(profile.rows[0].decided_at);
  assert.equal(profile.rows[0].decision_reason, "As métricas não conferem");
  assert.deepEqual(history.rows[0], {
    actor_id: validator,
    action: "rejected",
    reason: "As métricas não conferem",
  });
});

test("approval is blocked until the three required evidence items are manually approved", async () => {
  await database.query(
    "update public.creator_profiles set status = 'under_review' where user_id = $1",
    [creatorOne],
  );
  const { rows } = await database.query(
    `insert into public.social_accounts (
       creator_id, platform, handle, profile_url, followers_reported,
       verification_status, verified_at, verified_by
    ) values ($1, 'instagram', 'vyrex-test', 'https://www.instagram.com/vyrex-test', 100,
       'verified', now(), $2)
     returning id`,
    [creatorOne, validator],
  );
  const socialAccountId = rows[0].id;

  for (let position = 1; position <= 2; position += 1) {
    const storagePath = `${creatorOne}/review-${position}.webp`;
    await database.query(
      "insert into storage.objects (bucket_id, name) values ('story-evidence', $1)",
      [storagePath],
    );
    await database.query(
      `insert into public.metric_evidence (
         creator_id, social_account_id, position, storage_path, content_type,
         size_bytes, story_published_on, views_reported, review_status, reviewed_by, reviewed_at
      ) values ($1, $2, $3, $4, 'image/webp', 100, current_date, 1000, 'approved', $5, now())`,
      [creatorOne, socialAccountId, position, storagePath, validator],
    );
  }

  await assert.rejects(
    asUser(validator, () =>
      database.query(
        "select public.record_review_decision($1, 'approved', 'Critérios atendidos')",
        [creatorOne],
      ),
    ),
    /all required evidence must be manually approved/i,
  );

  const finalStoragePath = `${creatorOne}/review-3.webp`;
  await database.query(
    "insert into storage.objects (bucket_id, name) values ('story-evidence', $1)",
    [finalStoragePath],
  );
  const finalEvidence = await database.query(
    `insert into public.metric_evidence (
       creator_id, social_account_id, position, storage_path, content_type,
       size_bytes, story_published_on, views_reported, review_status, reviewed_by, reviewed_at
     ) values ($1, $2, 3, $3, 'image/webp', 100, current_date, 999, 'approved', $4, now())
     returning id`,
    [creatorOne, socialAccountId, finalStoragePath, validator],
  );
  await assert.rejects(
    asUser(validator, () =>
      database.query(
        "select public.record_review_decision($1, 'approved', 'Views abaixo do mínimo')",
        [creatorOne],
      ),
    ),
    /all required evidence must be manually approved/i,
  );
  await database.query(
    "update public.metric_evidence set views_reported = 1000 where id = $1",
    [finalEvidence.rows[0].id],
  );
  await asUser(validator, () =>
    database.query(
      "select public.review_story_evidence($1, 'approved', null)",
      [finalEvidence.rows[0].id],
    ),
  );
  await asUser(validator, () =>
    database.query(
      "select public.record_review_decision($1, 'approved', 'Três evidências conferidas manualmente')",
      [creatorOne],
    ),
  );

  const decision = await database.query(
    "select status, decided_by, decision_reason from public.creator_profiles where user_id = $1",
    [creatorOne],
  );
  assert.deepEqual(decision.rows[0], {
    status: "approved",
    decided_by: validator,
    decision_reason: "Três evidências conferidas manualmente",
  });
});

test("submission requires the first three Stories, in order and within the age window", async () => {
  const account = await database.query(
    `insert into public.social_accounts (
       creator_id, platform, handle, profile_url, followers_reported
    ) values ($1, 'instagram', 'creator-three', 'https://www.instagram.com/creator-three', 25)
     returning id`,
    [creatorThree],
  );
  const accountId = account.rows[0].id;

  for (let position = 1; position <= 5; position += 1) {
    const storagePath = `${creatorThree}/submission-${position}.webp`;
    await database.query(
      "insert into storage.objects (bucket_id, name) values ('story-evidence', $1)",
      [storagePath],
    );
    await database.query(
      `insert into public.metric_evidence (
         creator_id, social_account_id, position, storage_path, content_type,
         size_bytes, story_published_on, views_reported
      ) values ($1, $2, $3, $4, 'image/webp', 100, current_date - ($5::integer), 1000)`,
      [creatorThree, accountId, position, storagePath, position - 1],
    );
  }

  await database.query(
    "update public.metric_evidence set story_published_on = current_date - 8 where creator_id = $1 and position = 5",
    [creatorThree],
  );
  await assert.rejects(
    asUser(creatorThree, () =>
      database.query("select public.submit_creator_application()"),
    ),
    /outside the configured age limit/i,
  );

  await database.query(
    `update public.metric_evidence
     set story_published_on = case position
       when 1 then current_date - 1
       when 2 then current_date
       when 3 then current_date - 2
       when 4 then current_date - 3
       else current_date - 4
     end
     where creator_id = $1`,
    [creatorThree],
  );
  await assert.rejects(
    asUser(creatorThree, () =>
      database.query("select public.submit_creator_application()"),
    ),
    /ordered from newest to oldest/i,
  );

  await database.query(
    `update public.metric_evidence
     set story_published_on = current_date - (position - 1)
     where creator_id = $1`,
    [creatorThree],
  );
  await database.query(
    "update public.creator_profiles set public_name = 'Creator Three' where user_id = $1",
    [creatorThree],
  );
  await database.query(
    "update public.metric_evidence set views_reported = 999 where creator_id = $1 and position = 2",
    [creatorThree],
  );
  await assert.rejects(
    asUser(creatorThree, () =>
      database.query("select public.submit_creator_application()"),
    ),
    /first required story evidence items must be provided and valid/i,
  );
  await database.query(
    "update public.metric_evidence set views_reported = 1000 where creator_id = $1 and position = 2",
    [creatorThree],
  );
  await asUser(creatorThree, () =>
    database.query("select public.submit_creator_application()"),
  );

  const submitted = await database.query(
    "select status, submitted_at from public.creator_profiles where user_id = $1",
    [creatorThree],
  );
  assert.equal(submitted.rows[0].status, "submitted");
  assert.ok(submitted.rows[0].submitted_at);
});

test("deactivated accounts lose RLS access until an active admin reactivates them", async () => {
  await asUser(administrator, () =>
    database.query(
      "select public.set_user_active($1, false, 'Acesso encerrado para teste')",
      [creatorOne],
    ),
  );

  const inactiveProfile = await database.query(
    "select is_active, deactivated_by, deactivation_reason from public.profiles where id = $1",
    [creatorOne],
  );
  assert.deepEqual(inactiveProfile.rows[0], {
    is_active: false,
    deactivated_by: administrator,
    deactivation_reason: "Acesso encerrado para teste",
  });

  const ownRecords = await asUser(creatorOne, async () => {
    const [profiles, files] = await Promise.all([
      database.query("select user_id from public.creator_profiles"),
      database.query(
        "select name from storage.objects where bucket_id = 'story-evidence'",
      ),
    ]);
    return { profiles: profiles.rows, files: files.rows };
  });
  assert.deepEqual(ownRecords, { profiles: [], files: [] });

  await asUser(administrator, () =>
    database.query("select public.set_user_active($1, true, null)", [
      creatorOne,
    ]),
  );
  const reactivated = await database.query(
    "select is_active, deactivated_at from public.profiles where id = $1",
    [creatorOne],
  );
  assert.deepEqual(reactivated.rows[0], {
    is_active: true,
    deactivated_at: null,
  });
});

test("only administrators can grant internal roles and each change is audited", async () => {
  await assert.rejects(
    asUser(assignedRecruiter, () =>
      database.query("select public.set_user_role($1, 'validator', true)", [
        unassignedRecruiter,
      ]),
    ),
    /not authorized/i,
  );

  await asUser(administrator, () =>
    database.query("select public.set_user_role($1, 'validator', true)", [
      unassignedRecruiter,
    ]),
  );
  const enabledPermission = await asUser(unassignedRecruiter, () =>
    database.query(
      "select public.has_permission('creators.view_validation_queue') as allowed",
    ),
  );
  assert.equal(enabledPermission.rows[0].allowed, true);

  await asUser(administrator, () =>
    database.query("select public.set_user_role($1, 'validator', false)", [
      unassignedRecruiter,
    ]),
  );
  const disabledPermission = await asUser(unassignedRecruiter, () =>
    database.query(
      "select public.has_permission('creators.view_validation_queue') as allowed",
    ),
  );
  assert.equal(disabledPermission.rows[0].allowed, false);

  const audit = await database.query(
    "select actor_id, action, details->>'role' as role from public.audit_logs where entity_id = $1 and action = 'user.role.changed' order by created_at desc limit 2",
    [unassignedRecruiter],
  );
  assert.deepEqual(audit.rows, [
    { actor_id: administrator, action: "user.role.changed", role: "validator" },
    { actor_id: administrator, action: "user.role.changed", role: "validator" },
  ]);
});

test("eligibility changes require admin and record the resulting criteria", async () => {
  await assert.rejects(
    asUser(assignedRecruiter, () =>
      database.query(
        "select public.update_eligibility_settings(3500, 5::smallint, 2200, 60)",
      ),
    ),
    /not authorized/i,
  );

  await asUser(administrator, () =>
    database.query(
      "select public.update_eligibility_settings(4500, 5::smallint, 2500, 90)",
    ),
  );

  const settings = await database.query(
    "select minimum_followers, required_story_evidence, minimum_story_views, max_story_age_days, updated_by from public.eligibility_settings where singleton",
  );
  assert.deepEqual(settings.rows[0], {
    minimum_followers: 4500,
    required_story_evidence: 5,
    minimum_story_views: 2500,
    max_story_age_days: 90,
    updated_by: administrator,
  });

  const audit = await database.query(
    "select actor_id, action, entity_type, entity_id from public.audit_logs where action = 'eligibility.settings.changed' order by created_at desc limit 1",
  );
  assert.deepEqual(audit.rows[0], {
    actor_id: administrator,
    action: "eligibility.settings.changed",
    entity_type: "eligibility_settings",
    entity_id: "singleton",
  });
});
