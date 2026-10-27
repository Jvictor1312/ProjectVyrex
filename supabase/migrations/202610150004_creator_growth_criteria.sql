update public.eligibility_settings
set minimum_followers = case
      when minimum_followers = 3000 then 0
      else minimum_followers
    end,
    minimum_story_views = case
      when minimum_story_views = 2000 then 1000
      else minimum_story_views
    end
where singleton
  and (minimum_followers = 3000 or minimum_story_views = 2000);

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

  if not exists (select 1 from public.social_accounts where creator_id = actor) then
    raise exception 'at least one social account must be provided';
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