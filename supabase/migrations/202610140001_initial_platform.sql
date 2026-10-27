create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text check (phone is null or char_length(phone) <= 32),
  terms_version text,
  privacy_version text,
  consented_at timestamptz,
  is_active boolean not null default true,
  deactivated_at timestamptz,
  deactivated_by uuid references public.profiles (id) on delete set null,
  deactivation_reason text check (deactivation_reason is null or char_length(deactivation_reason) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.roles (
  id smallint generated always as identity primary key,
  key text not null unique check (key in ('admin', 'recruiter', 'relationship_manager', 'validator', 'influencer')),
  label text not null
);

insert into public.roles (key, label) values
  ('admin', 'Administrador'),
  ('recruiter', 'Recrutador'),
  ('relationship_manager', 'Gestor de relacionamento'),
  ('validator', 'Analista de validação'),
  ('influencer', 'Influenciador');

create table public.permissions (
  key text primary key,
  description text not null
);

insert into public.permissions (key, description) values
  ('creators.view_all', 'Consultar todos os cadastros'),
  ('creators.view_assigned', 'Consultar cadastros atribuídos'),
  ('creators.view_validation_queue', 'Consultar cadastros encaminhados para validação'),
  ('creators.assign', 'Atribuir responsáveis'),
  ('creators.manage_roles', 'Administrar funções internas'),
  ('creators.configure_eligibility', 'Configurar critérios de elegibilidade'),
  ('creators.audit.read', 'Consultar registros de auditoria'),
  ('creators.recruitment.write', 'Registrar triagem e observações de recrutamento'),
  ('creators.recruitment.forward', 'Encaminhar cadastro para validação'),
  ('creators.relationship.write', 'Registrar contatos e mensagens'),
  ('creators.relationship.corrections', 'Solicitar correções ao influenciador'),
  ('creators.validation.review', 'Analisar evidências individualmente'),
  ('creators.validation.decide', 'Aprovar, rejeitar ou solicitar correções'),
  ('creators.profile.own', 'Gerenciar o próprio perfil de criador'),
  ('creators.evidence.own', 'Enviar e corrigir as próprias evidências');

create table public.role_permissions (
  role_id smallint not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  primary key (role_id, permission_key)
);

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where r.key = 'admin'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key in (
  'creators.view_assigned', 'creators.recruitment.write', 'creators.recruitment.forward'
)
where r.key = 'recruiter'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key in (
  'creators.view_assigned', 'creators.relationship.write', 'creators.relationship.corrections'
)
where r.key = 'relationship_manager'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key in (
  'creators.view_validation_queue', 'creators.validation.review', 'creators.validation.decide'
)
where r.key = 'validator'
on conflict do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
join public.permissions p on p.key in ('creators.profile.own', 'creators.evidence.own')
where r.key = 'influencer'
on conflict do nothing;

create table public.user_roles (
  user_id uuid not null references public.profiles (id) on delete cascade,
  role_id smallint not null references public.roles (id) on delete restrict,
  assigned_by uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz not null default now(),
  revoked_at timestamptz,
  primary key (user_id, role_id, assigned_at)
);

create unique index user_roles_one_active_role
  on public.user_roles (user_id, role_id) where revoked_at is null;
create index user_roles_active_by_role on public.user_roles (role_id, user_id) where revoked_at is null;

create table public.creator_profiles (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  public_name text not null default '' check (char_length(public_name) <= 100),
  city text check (city is null or char_length(city) <= 100),
  region char(2) check (region is null or region ~ '^[A-Z]{2}$'),
  biography text check (biography is null or char_length(biography) <= 1000),
  categories text[] not null default '{}',
  status text not null default 'incomplete' check (status in (
    'incomplete', 'submitted', 'under_review', 'changes_requested', 'approved', 'rejected', 'suspended'
  )),
  submitted_at timestamptz,
  decided_at timestamptz,
  decided_by uuid references public.profiles (id) on delete set null,
  decision_reason text check (decision_reason is null or char_length(decision_reason) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index creator_profiles_status_idx on public.creator_profiles (status, submitted_at);

create table public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  platform text not null check (platform in ('instagram', 'tiktok', 'youtube', 'other')),
  handle text not null check (char_length(handle) between 1 and 100),
  profile_url text not null check (char_length(profile_url) <= 2048),
  followers_reported integer not null check (followers_reported >= 0),
  followers_reported_at timestamptz not null default now(),
  verification_status text not null default 'unverified' check (verification_status in ('unverified', 'verified', 'rejected')),
  verified_at timestamptz,
  verified_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, creator_id)
);
create unique index social_accounts_creator_platform_handle_idx
  on public.social_accounts (creator_id, platform, lower(handle));
create index social_accounts_creator_idx on public.social_accounts (creator_id);

create table public.eligibility_settings (
  singleton boolean primary key default true check (singleton),
  minimum_followers integer not null default 0 check (minimum_followers >= 0),
  required_story_evidence smallint not null default 5 check (required_story_evidence = 5),
  minimum_story_views integer not null default 1000 check (minimum_story_views >= 0),
  max_story_age_days integer default 7 check (max_story_age_days is null or max_story_age_days between 1 and 365),
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);
insert into public.eligibility_settings (singleton) values (true);

create table public.metric_evidence (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  social_account_id uuid not null references public.social_accounts (id) on delete restrict,
  position smallint not null check (position between 1 and 20),
  storage_path text not null unique check (char_length(storage_path) <= 300),
  content_type text not null check (content_type in ('image/jpeg', 'image/png', 'image/webp')),
  size_bytes integer not null check (size_bytes between 1 and 8388608),
  story_published_on date not null check (story_published_on <= current_date),
  views_reported integer not null check (views_reported >= 0),
  creator_notes text check (creator_notes is null or char_length(creator_notes) <= 500),
  review_status text not null default 'pending' check (review_status in ('pending', 'approved', 'rejected', 'changes_requested')),
  review_reason text check (review_reason is null or char_length(review_reason) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (creator_id, position),
  unique (id, creator_id),
  foreign key (social_account_id, creator_id)
    references public.social_accounts (id, creator_id) on delete restrict
);
create index metric_evidence_creator_idx on public.metric_evidence (creator_id, position);
create index metric_evidence_review_queue_idx on public.metric_evidence (review_status, created_at);

create table public.recruiter_assignments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  recruiter_id uuid not null references public.profiles (id) on delete restrict,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or ended_at >= assigned_at)
);
create unique index recruiter_assignments_current_idx
  on public.recruiter_assignments (creator_id) where ended_at is null;
create index recruiter_assignments_user_idx
  on public.recruiter_assignments (recruiter_id, creator_id) where ended_at is null;

create table public.relationship_assignments (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  manager_id uuid not null references public.profiles (id) on delete restrict,
  assigned_by uuid not null references public.profiles (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  ended_at timestamptz,
  check (ended_at is null or ended_at >= assigned_at)
);
create unique index relationship_assignments_current_idx
  on public.relationship_assignments (creator_id) where ended_at is null;
create index relationship_assignments_user_idx
  on public.relationship_assignments (manager_id, creator_id) where ended_at is null;

create table public.review_history (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  evidence_id uuid,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  action text not null check (action in (
    'submitted', 'forwarded', 'review_started', 'evidence_approved', 'evidence_rejected',
    'evidence_changes_requested', 'social_account_verified', 'social_account_rejected',
    'approved', 'rejected', 'changes_requested', 'suspended', 'reinstated'
  )),
  outcome text check (outcome is null or outcome in ('approved', 'rejected', 'changes_requested', 'under_review', 'suspended')),
  reason text check (reason is null or char_length(reason) <= 2000),
  created_at timestamptz not null default now(),
  foreign key (evidence_id, creator_id) references public.metric_evidence (id, creator_id) on delete restrict
);
create index review_history_creator_idx on public.review_history (creator_id, created_at desc);

create table public.contact_history (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  actor_id uuid not null references public.profiles (id) on delete restrict,
  channel text not null check (channel in ('email', 'phone', 'whatsapp', 'platform', 'other')),
  summary text not null check (char_length(summary) between 1 and 3000),
  visible_to_creator boolean not null default false,
  created_at timestamptz not null default now()
);
create index contact_history_creator_idx on public.contact_history (creator_id, created_at desc);

create table public.team_messages (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete restrict,
  body text not null check (char_length(body) between 1 and 3000),
  visible_to_creator boolean not null default true,
  created_at timestamptz not null default now()
);
create index team_messages_creator_idx on public.team_messages (creator_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('status', 'message', 'correction', 'system')),
  title text not null check (char_length(title) <= 150),
  body text not null check (char_length(body) <= 1000),
  created_at timestamptz not null default now(),
  read_at timestamptz
);
create index notifications_user_unread_idx on public.notifications (user_id, created_at desc) where read_at is null;

create table public.audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id, created_at desc);
create index audit_logs_actor_idx on public.audit_logs (actor_id, created_at desc);

create table public.evidence_upload_events (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  uploaded_at timestamptz not null default now()
);
create index evidence_upload_events_window_idx on public.evidence_upload_events (user_id, uploaded_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();
create trigger creator_profiles_set_updated_at before update on public.creator_profiles
for each row execute function public.set_updated_at();
create trigger social_accounts_set_updated_at before update on public.social_accounts
for each row execute function public.set_updated_at();
create trigger metric_evidence_set_updated_at before update on public.metric_evidence
for each row execute function public.set_updated_at();

create or replace function public.reset_evidence_review_on_creator_edit()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.review_status := 'pending';
  new.review_reason := null;
  new.reviewed_by := null;
  new.reviewed_at := null;
  return new;
end;
$$;

create trigger metric_evidence_reset_review before update of
  social_account_id, position, storage_path, content_type, size_bytes,
  story_published_on, views_reported, creator_notes
on public.metric_evidence
for each row execute function public.reset_evidence_review_on_creator_edit();

create or replace function public.account_is_active()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles p
    where p.id = auth.uid() and p.is_active
  );
$$;

create or replace function public.has_permission(permission_name text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.user_roles ur
    join public.role_permissions rp on rp.role_id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where ur.user_id = auth.uid()
      and ur.revoked_at is null
      and p.is_active
      and rp.permission_key = permission_name
  );
$$;

create or replace function public.can_access_creator(target_creator uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(
    public.has_permission('creators.view_all')
    or (
      public.has_permission('creators.view_assigned')
      and (
        exists (
          select 1 from public.recruiter_assignments a
          where a.creator_id = target_creator and a.recruiter_id = auth.uid() and a.ended_at is null
        )
        or exists (
          select 1 from public.relationship_assignments a
          where a.creator_id = target_creator and a.manager_id = auth.uid() and a.ended_at is null
        )
      )
    )
    or (
      public.has_permission('creators.view_validation_queue')
      and exists (
        select 1 from public.creator_profiles cp
        where cp.user_id = target_creator and cp.status in ('submitted', 'under_review', 'changes_requested')
      )
    ), false
  );
$$;

create or replace function public.consume_evidence_upload_quota()
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  recent_uploads integer;
begin
  if actor is null or not public.has_permission('creators.evidence.own') then return false; end if;

  perform pg_advisory_xact_lock(hashtextextended(actor::text || ':story-evidence', 0));
  delete from public.evidence_upload_events
  where user_id = actor and uploaded_at < now() - interval '10 minutes';
  select count(*) into recent_uploads
  from public.evidence_upload_events
  where user_id = actor and uploaded_at >= now() - interval '10 minutes';

  if recent_uploads >= 10 then return false; end if;
  insert into public.evidence_upload_events (user_id) values (actor);
  return true;
end;
$$;

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  influencer_role smallint;
begin
  insert into public.profiles (id, full_name, terms_version, privacy_version, consented_at)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Criador'),
    new.raw_user_meta_data ->> 'terms_version',
    new.raw_user_meta_data ->> 'privacy_version',
    case when new.raw_user_meta_data ? 'terms_version' then now() else null end
  );

  insert into public.creator_profiles (user_id) values (new.id);
  select id into influencer_role from public.roles where key = 'influencer';
  insert into public.user_roles (user_id, role_id) values (new.id, influencer_role);
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_auth_user();

create or replace function public.write_audit_log(
  event_action text,
  event_entity_type text,
  event_entity_id text,
  event_details jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public, pg_temp
as $$
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, details)
  values (auth.uid(), event_action, event_entity_type, event_entity_id, coalesce(event_details, '{}'::jsonb));
$$;

create or replace function public.audit_eligibility_settings_update()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_by := auth.uid();
  new.updated_at := now();
  perform public.write_audit_log('eligibility.settings.changed', 'eligibility_settings', 'singleton',
    jsonb_build_object(
      'minimum_followers', new.minimum_followers,
      'required_story_evidence', new.required_story_evidence,
      'minimum_story_views', new.minimum_story_views,
      'max_story_age_days', new.max_story_age_days
    ));
  return new;
end;
$$;

create trigger eligibility_settings_audit_update before update on public.eligibility_settings
for each row execute function public.audit_eligibility_settings_update();

create or replace function public.submit_creator_application()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  settings public.eligibility_settings%rowtype;
  evidence_count integer;
  valid_evidence_count integer;
  first_position smallint;
  last_position smallint;
begin
  if actor is null or not public.has_permission('creators.profile.own') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into settings from public.eligibility_settings where singleton;

  if not exists (
    select 1 from public.social_accounts sa
    where sa.creator_id = actor and sa.followers_reported >= settings.minimum_followers
  ) then
    raise exception 'at least one social account must meet the follower threshold';
  end if;

  select count(*), count(*) filter (where
    me.views_reported >= settings.minimum_story_views
    and exists (select 1 from storage.objects o where o.bucket_id = 'story-evidence' and o.name = me.storage_path)
  ), min(me.position), max(me.position)
  into evidence_count, valid_evidence_count, first_position, last_position
  from public.metric_evidence me
  where me.creator_id = actor;

  if evidence_count <> settings.required_story_evidence or valid_evidence_count <> settings.required_story_evidence then
    raise exception 'exactly the required number of valid story evidence items must be provided';
  end if;

  if first_position <> 1 or last_position <> settings.required_story_evidence then
    raise exception 'story evidence positions must be consecutive from 1 to 5';
  end if;

  if exists (
    select 1
    from public.metric_evidence newer
    join public.metric_evidence older
      on older.creator_id = newer.creator_id
      and older.position = newer.position + 1
    where newer.creator_id = actor
      and older.story_published_on > newer.story_published_on
  ) then
    raise exception 'story evidence must be ordered from newest to oldest';
  end if;

  if exists (
    select 1 from public.metric_evidence me
    where me.creator_id = actor and me.story_published_on < current_date - settings.max_story_age_days
  ) then
    raise exception 'story evidence is outside the configured age limit';
  end if;

  update public.creator_profiles
  set status = 'submitted', submitted_at = now(), decided_at = null, decided_by = null, decision_reason = null
  where user_id = actor and status in ('incomplete', 'changes_requested');

  if not found then
    raise exception 'application cannot be submitted in its current state';
  end if;

  insert into public.review_history (creator_id, actor_id, action, outcome)
  values (actor, actor, 'submitted', 'under_review');
  perform public.write_audit_log('creator.application.submitted', 'creator_profile', actor::text, '{}'::jsonb);
end;
$$;

create or replace function public.review_story_evidence(
  evidence_id uuid,
  decision text,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  evidence public.metric_evidence%rowtype;
  next_status text;
begin
  if actor is null or not public.has_permission('creators.validation.review') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if decision not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'invalid evidence decision';
  end if;
  if decision <> 'approved' and nullif(btrim(reason), '') is null then
    raise exception 'a reason is required';
  end if;

  select * into evidence from public.metric_evidence where id = evidence_id for update;
  if not found or not public.can_access_creator(evidence.creator_id) then
    raise exception 'evidence not found or not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.creator_profiles cp where cp.user_id = evidence.creator_id and cp.status in ('submitted', 'under_review')) then
    raise exception 'creator is not in the validation queue';
  end if;

  update public.metric_evidence
  set review_status = decision, review_reason = nullif(btrim(reason), ''), reviewed_by = actor, reviewed_at = now()
  where id = evidence_id;

  next_status := case decision
    when 'approved' then 'evidence_approved'
    when 'rejected' then 'evidence_rejected'
    else 'evidence_changes_requested'
  end;
  insert into public.review_history (creator_id, evidence_id, actor_id, action, outcome, reason)
  values (evidence.creator_id, evidence_id, actor, next_status, decision, nullif(btrim(reason), ''));
  perform public.write_audit_log('creator.evidence.reviewed', 'metric_evidence', evidence_id::text,
    jsonb_build_object('decision', decision, 'creator_id', evidence.creator_id));
end;
$$;

create or replace function public.record_review_decision(
  target_creator uuid,
  decision text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  settings public.eligibility_settings%rowtype;
  required_count integer;
  approved_count integer;
  next_status text;
begin
  if actor is null or not public.has_permission('creators.validation.decide') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if decision not in ('approved', 'rejected', 'changes_requested') then
    raise exception 'invalid creator decision';
  end if;
  if nullif(btrim(reason), '') is null then
    raise exception 'a decision reason is required';
  end if;

  perform 1 from public.creator_profiles where user_id = target_creator for update;
  if not found or not public.can_access_creator(target_creator) then
    raise exception 'creator not found or not authorized' using errcode = '42501';
  end if;

  select * into settings from public.eligibility_settings where singleton;
  if decision = 'approved' then
    select count(*), count(*) filter (where me.review_status = 'approved')
    into required_count, approved_count
    from public.metric_evidence me
    join public.social_accounts sa on sa.id = me.social_account_id
    where me.creator_id = target_creator
      and me.views_reported >= settings.minimum_story_views
      and sa.followers_reported >= settings.minimum_followers
      and sa.verification_status = 'verified';

    if required_count < settings.required_story_evidence or approved_count < settings.required_story_evidence then
      raise exception 'all required evidence must be manually approved and account metrics verified';
    end if;
  end if;

  next_status := decision;
  update public.creator_profiles
  set status = next_status, decided_at = now(), decided_by = actor, decision_reason = btrim(reason)
  where user_id = target_creator and status in ('submitted', 'under_review', 'changes_requested');
  if not found then
    raise exception 'creator is not awaiting a decision';
  end if;

  insert into public.review_history (creator_id, actor_id, action, outcome, reason)
  values (target_creator, actor, decision, decision, btrim(reason));
  insert into public.notifications (user_id, kind, title, body)
  values (target_creator, 'status', 'Atualização do cadastro', btrim(reason));
  perform public.write_audit_log('creator.decision.recorded', 'creator_profile', target_creator::text,
    jsonb_build_object('decision', decision, 'reason', btrim(reason)));
end;
$$;

create or replace function public.assign_creator_responsibles(
  target_creator uuid,
  new_recruiter uuid,
  new_manager uuid
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not public.has_permission('creators.assign') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.creator_profiles where user_id = target_creator) then
    raise exception 'creator not found';
  end if;
  if new_recruiter is not null and not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = new_recruiter and ur.revoked_at is null and r.key = 'recruiter'
  ) then raise exception 'selected user is not an active recruiter'; end if;
  if new_manager is not null and not exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = new_manager and ur.revoked_at is null and r.key = 'relationship_manager'
  ) then raise exception 'selected user is not an active relationship manager'; end if;

  update public.recruiter_assignments set ended_at = now()
  where creator_id = target_creator and ended_at is null;
  update public.relationship_assignments set ended_at = now()
  where creator_id = target_creator and ended_at is null;

  if new_recruiter is not null then
    insert into public.recruiter_assignments (creator_id, recruiter_id, assigned_by)
    values (target_creator, new_recruiter, actor);
  end if;
  if new_manager is not null then
    insert into public.relationship_assignments (creator_id, manager_id, assigned_by)
    values (target_creator, new_manager, actor);
  end if;

  perform public.write_audit_log('creator.responsibles.changed', 'creator_profile', target_creator::text,
    jsonb_build_object('recruiter_id', new_recruiter, 'manager_id', new_manager));
end;
$$;

create or replace function public.set_user_role(target_user uuid, role_key text, enabled boolean)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  target_role smallint;
begin
  if actor is null or not public.has_permission('creators.manage_roles') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  select id into target_role from public.roles where key = role_key;
  if target_role is null or role_key = 'influencer' then raise exception 'invalid internal role'; end if;
  if target_user = actor and role_key = 'admin' and not enabled then raise exception 'cannot remove your own admin role'; end if;
  if not enabled and role_key = 'admin' and (
    select count(*)
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where r.key = 'admin' and ur.revoked_at is null and p.is_active
  ) <= 1 then
    raise exception 'cannot remove the last active administrator';
  end if;

  if enabled then
    insert into public.user_roles (user_id, role_id, assigned_by)
    values (target_user, target_role, actor)
    on conflict (user_id, role_id) where revoked_at is null do nothing;
  else
    update public.user_roles set revoked_at = now()
    where user_id = target_user and role_id = target_role and revoked_at is null;
  end if;

  perform public.write_audit_log('user.role.changed', 'user_role', target_user::text,
    jsonb_build_object('role', role_key, 'enabled', enabled));
end;
$$;

create or replace function public.set_user_active(
  target_user uuid,
  enabled boolean,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not public.has_permission('creators.manage_roles') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if target_user = actor and not enabled then raise exception 'cannot deactivate your own account'; end if;
  if not enabled and nullif(btrim(reason), '') is null then raise exception 'a deactivation reason is required'; end if;
  if not enabled and exists (
    select 1 from public.user_roles ur join public.roles r on r.id = ur.role_id
    where ur.user_id = target_user and ur.revoked_at is null and r.key = 'admin'
  ) and (
    select count(*)
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    join public.profiles p on p.id = ur.user_id
    where r.key = 'admin' and ur.revoked_at is null and p.is_active
  ) <= 1 then
    raise exception 'cannot deactivate the last active administrator';
  end if;

  update public.profiles
  set is_active = enabled,
      deactivated_at = case when enabled then null else now() end,
      deactivated_by = case when enabled then null else actor end,
      deactivation_reason = case when enabled then null else btrim(reason) end
  where id = target_user;
  if not found then raise exception 'user not found'; end if;

  perform public.write_audit_log('user.account.status.changed', 'profile', target_user::text,
    jsonb_build_object('is_active', enabled, 'reason', nullif(btrim(reason), '')));
end;
$$;

create or replace function public.write_staff_message(target_creator uuid, message_body text)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  message_id uuid;
begin
  if actor is null or not public.has_permission('creators.relationship.write') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not public.can_access_creator(target_creator) then raise exception 'not authorized' using errcode = '42501'; end if;
  if nullif(btrim(message_body), '') is null or char_length(message_body) > 3000 then raise exception 'invalid message'; end if;

  insert into public.team_messages (creator_id, sender_id, body)
  values (target_creator, actor, btrim(message_body)) returning id into message_id;
  insert into public.notifications (user_id, kind, title, body)
  values (target_creator, 'message', 'Nova mensagem da equipe', btrim(message_body));
  perform public.write_audit_log('creator.message.sent', 'team_message', message_id::text,
    jsonb_build_object('creator_id', target_creator));
  return message_id;
end;
$$;

create or replace function public.request_creator_corrections(target_creator uuid, correction_reason text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or (not public.has_permission('creators.relationship.corrections')
    and not public.has_permission('creators.validation.decide')) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not public.can_access_creator(target_creator) then raise exception 'not authorized' using errcode = '42501'; end if;
  if nullif(btrim(correction_reason), '') is null or char_length(correction_reason) > 2000 then
    raise exception 'a correction reason is required';
  end if;
  update public.creator_profiles
  set status = 'changes_requested', decided_at = now(), decided_by = actor, decision_reason = btrim(correction_reason)
  where user_id = target_creator and status in ('submitted', 'under_review');
  if not found then raise exception 'creator is not in a state that allows corrections'; end if;

  insert into public.review_history (creator_id, actor_id, action, outcome, reason)
  values (target_creator, actor, 'changes_requested', 'changes_requested', btrim(correction_reason));
  insert into public.notifications (user_id, kind, title, body)
  values (target_creator, 'correction', 'Correção solicitada', btrim(correction_reason));
  perform public.write_audit_log('creator.corrections.requested', 'creator_profile', target_creator::text,
    jsonb_build_object('reason', btrim(correction_reason)));
end;
$$;

create or replace function public.review_social_account(
  target_account uuid,
  decision text,
  reason text default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  account public.social_accounts%rowtype;
begin
  if actor is null or not public.has_permission('creators.validation.review') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if decision not in ('verified', 'rejected') then raise exception 'invalid account decision'; end if;
  if decision = 'rejected' and nullif(btrim(reason), '') is null then raise exception 'a reason is required'; end if;

  select * into account from public.social_accounts where id = target_account for update;
  if not found or not public.can_access_creator(account.creator_id) then
    raise exception 'social account not found or not authorized' using errcode = '42501';
  end if;
  if not exists (select 1 from public.creator_profiles cp where cp.user_id = account.creator_id and cp.status in ('submitted', 'under_review')) then
    raise exception 'creator is not in the validation queue';
  end if;

  update public.social_accounts
  set verification_status = decision,
      verified_at = case when decision = 'verified' then now() else null end,
      verified_by = actor
  where id = target_account;

  insert into public.review_history (creator_id, actor_id, action, outcome, reason)
  values (
    account.creator_id,
    actor,
    case when decision = 'verified' then 'social_account_verified' else 'social_account_rejected' end,
    case when decision = 'verified' then 'approved' else 'rejected' end,
    nullif(btrim(reason), '')
  );
  perform public.write_audit_log('creator.social_account.reviewed', 'social_account', target_account::text,
    jsonb_build_object('decision', decision, 'reason', nullif(btrim(reason), '')));
end;
$$;

create or replace function public.forward_creator_to_validation(target_creator uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null or not public.has_permission('creators.recruitment.forward') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not public.can_access_creator(target_creator) then raise exception 'not authorized' using errcode = '42501'; end if;
  update public.creator_profiles set status = 'under_review'
  where user_id = target_creator and status = 'submitted';
  if not found then raise exception 'creator is not awaiting recruiter triage'; end if;
  insert into public.review_history (creator_id, actor_id, action, outcome)
  values (target_creator, actor, 'forwarded', 'under_review');
  perform public.write_audit_log('creator.forwarded_to_validation', 'creator_profile', target_creator::text, '{}'::jsonb);
end;
$$;

create or replace function public.record_contact_event(
  target_creator uuid,
  contact_channel text,
  contact_summary text,
  visible_to_creator boolean default false
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  event_id uuid;
begin
  if actor is null or (not public.has_permission('creators.recruitment.write')
    and not public.has_permission('creators.relationship.write')) then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not public.can_access_creator(target_creator) then raise exception 'not authorized' using errcode = '42501'; end if;
  if visible_to_creator and not public.has_permission('creators.relationship.write') then
    raise exception 'only relationship managers may share contact notes';
  end if;
  if contact_channel not in ('email', 'phone', 'whatsapp', 'platform', 'other')
    or nullif(btrim(contact_summary), '') is null or char_length(contact_summary) > 3000 then
    raise exception 'invalid contact entry';
  end if;
  insert into public.contact_history (creator_id, actor_id, channel, summary, visible_to_creator)
  values (target_creator, actor, contact_channel, btrim(contact_summary), visible_to_creator)
  returning id into event_id;
  perform public.write_audit_log('creator.contact.recorded', 'contact_history', event_id::text,
    jsonb_build_object('creator_id', target_creator));
  return event_id;
end;
$$;

create or replace function public.update_eligibility_settings(
  new_minimum_followers integer,
  new_required_evidence smallint,
  new_minimum_views integer,
  new_max_story_age_days integer default null
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null or not public.has_permission('creators.configure_eligibility') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if new_required_evidence <> 5 then
    raise exception 'the first-version workflow requires exactly five story evidence items';
  end if;
  update public.eligibility_settings
  set minimum_followers = new_minimum_followers,
      required_story_evidence = new_required_evidence,
      minimum_story_views = new_minimum_views,
      max_story_age_days = new_max_story_age_days
  where singleton;
end;
$$;

alter table public.profiles enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.user_roles enable row level security;
alter table public.creator_profiles enable row level security;
alter table public.social_accounts enable row level security;
alter table public.eligibility_settings enable row level security;
alter table public.metric_evidence enable row level security;
alter table public.recruiter_assignments enable row level security;
alter table public.relationship_assignments enable row level security;
alter table public.review_history enable row level security;
alter table public.contact_history enable row level security;
alter table public.team_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.evidence_upload_events enable row level security;

create policy "profiles read self or authorized staff" on public.profiles for select to authenticated
using ((id = auth.uid() and public.account_is_active()) or public.can_access_creator(id));
create policy "profiles update self" on public.profiles for update to authenticated
using (id = auth.uid() and public.account_is_active())
with check (id = auth.uid() and public.account_is_active());

create policy "roles visible to signed in users" on public.roles for select to authenticated using (true);
create policy "permissions visible to signed in users" on public.permissions for select to authenticated using (true);
create policy "role permissions visible to signed in users" on public.role_permissions for select to authenticated using (true);

create policy "users read own role or admins read all" on public.user_roles for select to authenticated
using ((user_id = auth.uid() and public.account_is_active()) or public.has_permission('creators.manage_roles'));

create policy "creator profile visible to self or authorized staff" on public.creator_profiles for select to authenticated
using ((user_id = auth.uid() and public.account_is_active()) or public.can_access_creator(user_id));
create policy "creator edits own profile" on public.creator_profiles for update to authenticated
using (
  user_id = auth.uid() and public.has_permission('creators.profile.own')
  and status in ('incomplete', 'changes_requested')
)
with check (user_id = auth.uid() and status in ('incomplete', 'changes_requested'));

create policy "social accounts visible to authorized users" on public.social_accounts for select to authenticated
using ((creator_id = auth.uid() and public.account_is_active()) or public.can_access_creator(creator_id));
create policy "creator creates own social accounts" on public.social_accounts for insert to authenticated
with check (
  creator_id = auth.uid() and public.has_permission('creators.profile.own')
  and exists (select 1 from public.creator_profiles cp where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested'))
);
create policy "creator updates own social accounts" on public.social_accounts for update to authenticated
using (
  creator_id = auth.uid() and public.has_permission('creators.profile.own')
  and exists (select 1 from public.creator_profiles cp where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested'))
)
with check (creator_id = auth.uid() and verification_status = 'unverified' and verified_by is null and verified_at is null);

create policy "evidence visible to authorized users" on public.metric_evidence for select to authenticated
using ((creator_id = auth.uid() and public.account_is_active()) or public.can_access_creator(creator_id));
create policy "creator submits own evidence" on public.metric_evidence for insert to authenticated
with check (
  creator_id = auth.uid() and public.has_permission('creators.evidence.own')
  and review_status = 'pending' and reviewed_by is null and reviewed_at is null and review_reason is null
  and storage_path like auth.uid()::text || '/%'
  and exists (select 1 from public.creator_profiles cp where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested'))
);
create policy "creator updates own evidence while correcting" on public.metric_evidence for update to authenticated
using (
  creator_id = auth.uid() and public.has_permission('creators.evidence.own')
  and exists (select 1 from public.creator_profiles cp where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested'))
)
with check (
  creator_id = auth.uid()
  and storage_path like auth.uid()::text || '/%'
);

create policy "eligibility settings readable by signed in users" on public.eligibility_settings for select to authenticated using (true);
create policy "eligibility settings editable by admins" on public.eligibility_settings for update to authenticated
using (public.has_permission('creators.configure_eligibility'))
with check (public.has_permission('creators.configure_eligibility'));

create policy "recruiter assignments readable by related staff" on public.recruiter_assignments for select to authenticated
using (recruiter_id = auth.uid() or public.can_access_creator(creator_id));
create policy "relationship assignments readable by related staff" on public.relationship_assignments for select to authenticated
using (manager_id = auth.uid() or public.can_access_creator(creator_id));

create policy "review history visible to owner or authorized staff" on public.review_history for select to authenticated
using ((creator_id = auth.uid() and public.account_is_active()) or public.can_access_creator(creator_id));

create policy "contact history visible to assigned staff or creator when shared" on public.contact_history for select to authenticated
using ((creator_id = auth.uid() and visible_to_creator and public.account_is_active()) or public.can_access_creator(creator_id));
create policy "team messages visible to recipient or assigned staff" on public.team_messages for select to authenticated
using ((creator_id = auth.uid() and visible_to_creator and public.account_is_active()) or public.can_access_creator(creator_id));

create policy "notifications visible to recipient" on public.notifications for select to authenticated
using (user_id = auth.uid() and public.account_is_active());
create policy "recipient marks own notifications read" on public.notifications for update to authenticated
using (user_id = auth.uid() and public.account_is_active())
with check (user_id = auth.uid() and public.account_is_active());

create policy "audit logs readable by authorized admins" on public.audit_logs for select to authenticated
using (public.has_permission('creators.audit.read'));

revoke all on public.profiles, public.roles, public.permissions, public.role_permissions, public.user_roles,
  public.creator_profiles, public.social_accounts, public.eligibility_settings, public.metric_evidence,
  public.recruiter_assignments, public.relationship_assignments, public.review_history,
  public.contact_history, public.team_messages, public.notifications, public.audit_logs
from anon, authenticated;

grant select on public.profiles, public.roles, public.permissions, public.role_permissions, public.user_roles,
  public.creator_profiles, public.social_accounts, public.eligibility_settings, public.metric_evidence,
  public.recruiter_assignments, public.relationship_assignments, public.review_history,
  public.contact_history, public.team_messages, public.notifications, public.audit_logs to authenticated;

grant update (full_name, phone) on public.profiles to authenticated;
grant update (public_name, city, region, biography, categories) on public.creator_profiles to authenticated;
grant insert (creator_id, platform, handle, profile_url, followers_reported, followers_reported_at)
  on public.social_accounts to authenticated;
grant update (platform, handle, profile_url, followers_reported, followers_reported_at)
  on public.social_accounts to authenticated;
grant insert (creator_id, social_account_id, position, storage_path, content_type, size_bytes,
  story_published_on, views_reported, creator_notes) on public.metric_evidence to authenticated;
grant update (social_account_id, position, storage_path, content_type, size_bytes,
  story_published_on, views_reported, creator_notes) on public.metric_evidence to authenticated;
grant update (read_at) on public.notifications to authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;
revoke all on function public.handle_new_auth_user() from public, anon, authenticated;
revoke all on function public.reset_evidence_review_on_creator_edit() from public, anon, authenticated;
revoke all on function public.write_audit_log(text, text, text, jsonb) from public, anon, authenticated;
revoke all on function public.has_permission(text) from public, anon;
revoke all on function public.account_is_active() from public, anon;
revoke all on function public.can_access_creator(uuid) from public, anon;
revoke all on function public.consume_evidence_upload_quota() from public, anon;
revoke all on function public.submit_creator_application() from public, anon;
revoke all on function public.review_story_evidence(uuid, text, text) from public, anon;
revoke all on function public.record_review_decision(uuid, text, text) from public, anon;
revoke all on function public.assign_creator_responsibles(uuid, uuid, uuid) from public, anon;
revoke all on function public.set_user_role(uuid, text, boolean) from public, anon;
revoke all on function public.set_user_active(uuid, boolean, text) from public, anon;
revoke all on function public.write_staff_message(uuid, text) from public, anon;
revoke all on function public.request_creator_corrections(uuid, text) from public, anon;
revoke all on function public.review_social_account(uuid, text, text) from public, anon;
revoke all on function public.forward_creator_to_validation(uuid) from public, anon;
revoke all on function public.record_contact_event(uuid, text, text, boolean) from public, anon;
revoke all on function public.update_eligibility_settings(integer, smallint, integer, integer) from public, anon;
grant execute on function public.has_permission(text), public.can_access_creator(uuid) to authenticated;
grant execute on function public.account_is_active() to authenticated;
grant execute on function public.consume_evidence_upload_quota() to authenticated;
grant execute on function public.submit_creator_application() to authenticated;
grant execute on function public.review_story_evidence(uuid, text, text) to authenticated;
grant execute on function public.record_review_decision(uuid, text, text) to authenticated;
grant execute on function public.assign_creator_responsibles(uuid, uuid, uuid) to authenticated;
grant execute on function public.set_user_role(uuid, text, boolean) to authenticated;
grant execute on function public.set_user_active(uuid, boolean, text) to authenticated;
grant execute on function public.write_staff_message(uuid, text) to authenticated;
grant execute on function public.request_creator_corrections(uuid, text) to authenticated;
grant execute on function public.review_social_account(uuid, text, text) to authenticated;
grant execute on function public.forward_creator_to_validation(uuid) to authenticated;
grant execute on function public.record_contact_event(uuid, text, text, boolean) to authenticated;
grant execute on function public.update_eligibility_settings(integer, smallint, integer, integer) to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('story-evidence', 'story-evidence', false, 8388608, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "creator uploads evidence into own folder" on storage.objects for insert to authenticated
with check (
  bucket_id = 'story-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('creators.evidence.own')
  and public.consume_evidence_upload_quota()
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
);
create policy "authorized users read private evidence" on storage.objects for select to authenticated
using (
  bucket_id = 'story-evidence'
  and (
    ((storage.foldername(name))[1] = auth.uid()::text and public.account_is_active())
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and public.can_access_creator(((storage.foldername(name))[1])::uuid)
    )
  )
);
create policy "creator removes own evidence while correcting" on storage.objects for delete to authenticated
using (
  bucket_id = 'story-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('creators.evidence.own')
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
);
create policy "creator replaces own evidence while correcting" on storage.objects for update to authenticated
using (
  bucket_id = 'story-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('creators.evidence.own')
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
)
with check (
  bucket_id = 'story-evidence'
  and (storage.foldername(name))[1] = auth.uid()::text
);