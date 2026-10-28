-- Apenas as 3 primeiras evidências são obrigatórias; a 4ª e a 5ª são opcionais.
-- Migration aditiva: troca a restrição fixa de 5, ajusta o envio do cadastro e
-- a função de critérios, e define o mínimo atual como 3.

alter table public.eligibility_settings
  drop constraint if exists eligibility_settings_required_story_evidence_check;
alter table public.eligibility_settings
  add constraint eligibility_settings_required_story_evidence_check
  check (required_story_evidence between 1 and 5);

update public.eligibility_settings set required_story_evidence = 3 where singleton;

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
  required_present integer;
  first_position smallint;
  last_position smallint;
begin
  if actor is null or not public.has_permission('creators.profile.own') then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select * into settings from public.eligibility_settings where singleton;

  if not exists (select 1 from public.social_accounts where creator_id = actor) then
    raise exception 'at least one social account must be provided';
  end if;

  select count(*), count(*) filter (where
    me.position <= settings.required_story_evidence
    and me.views_reported >= settings.minimum_story_views
    and exists (select 1 from storage.objects o where o.bucket_id = 'story-evidence' and o.name = me.storage_path)
  ), count(*) filter (where me.position <= settings.required_story_evidence),
  min(me.position), max(me.position)
  into evidence_count, valid_evidence_count, required_present, first_position, last_position
  from public.metric_evidence me
  where me.creator_id = actor;

  -- As primeiras posições (1 até o mínimo configurado) são obrigatórias e
  -- precisam ser válidas; as posições seguintes, até 5, são opcionais.
  if valid_evidence_count < settings.required_story_evidence
    or required_present < settings.required_story_evidence then
    raise exception 'the first required story evidence items must be provided and valid';
  end if;
  if evidence_count > 5 or last_position > 5 then
    raise exception 'at most five story evidence items are accepted';
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
  if settings.max_story_age_days is not null and exists (
    select 1 from public.metric_evidence me
    where me.creator_id = actor
      and me.story_published_on < current_date - settings.max_story_age_days
  ) then
    raise exception 'story evidence is outside the configured age limit';
  end if;

  update public.creator_profiles
  set status = 'submitted', submitted_at = now(), decided_at = null,
      decided_by = null, decision_reason = null
  where user_id = actor and status in ('incomplete', 'changes_requested');
  if not found then
    raise exception 'application cannot be submitted in its current state';
  end if;

  insert into public.review_history (creator_id, actor_id, action, outcome)
  values (actor, actor, 'submitted', 'under_review');
  perform public.write_audit_log('creator.application.submitted', 'creator_profile', actor::text, '{}'::jsonb);
end;
$$;

-- A aprovação exige que as posições obrigatórias estejam aprovadas.
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
      and me.position <= settings.required_story_evidence
      and me.views_reported >= settings.minimum_story_views
      and sa.verification_status = 'verified';

    if required_count < settings.required_story_evidence
      or approved_count < settings.required_story_evidence then
      raise exception 'all required evidence must be manually approved and account metrics verified';
    end if;
  end if;

  update public.creator_profiles
  set status = decision, decided_at = now(), decided_by = actor,
      decision_reason = btrim(reason)
  where user_id = target_creator
    and status in ('submitted', 'under_review', 'changes_requested');
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
  if new_required_evidence < 1 or new_required_evidence > 5 then
    raise exception 'required story evidence must be between 1 and 5';
  end if;
  update public.eligibility_settings
  set minimum_followers = new_minimum_followers,
      required_story_evidence = new_required_evidence,
      minimum_story_views = new_minimum_views,
      max_story_age_days = new_max_story_age_days
  where singleton;
end;
$$;
