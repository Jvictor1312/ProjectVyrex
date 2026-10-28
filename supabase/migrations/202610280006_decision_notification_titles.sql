-- Título do aviso conforme a decisão (antes: sempre "Atualização do cadastro").
-- Repete a função de 202610280002 sem outras mudanças. Avisos já enviados
-- não são alterados.

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
  values (target_creator, 'status',
    case decision
      when 'approved' then 'Cadastro aprovado'
      when 'rejected' then 'Cadastro não aprovado'
      else 'Correção solicitada'
    end,
    btrim(reason));
  perform public.write_audit_log('creator.decision.recorded', 'creator_profile', target_creator::text,
    jsonb_build_object('decision', decision, 'reason', btrim(reason)));
end;
$$;
