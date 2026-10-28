-- Criador: desfazer o envio e apagar evidência no rascunho.
-- Migration aditiva: amplia a lista de ações do histórico e cria duas funções.
-- Regra do produto (decisão do usuário em 2026-10-28): depois que a equipe
-- começa a análise, o criador não altera mais nada por conta própria.

alter table public.review_history drop constraint if exists review_history_action_check;
alter table public.review_history add constraint review_history_action_check check (action in (
  'submitted', 'forwarded', 'review_started', 'evidence_approved', 'evidence_rejected',
  'evidence_changes_requested', 'social_account_verified', 'social_account_rejected',
  'approved', 'rejected', 'changes_requested', 'suspended', 'reinstated', 'withdrawn'
));

-- Retira o cadastro enviado e volta ao rascunho, só enquanto ninguém da
-- equipe agiu sobre ele desde o envio (nenhum encaminhamento, conferência de
-- evidência ou de rede).
create or replace function public.withdraw_creator_application()
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  sent_at timestamptz;
begin
  if actor is null or not public.has_permission('creators.profile.own')
    or not public.account_is_active() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  select submitted_at into sent_at
  from public.creator_profiles
  where user_id = actor and status = 'submitted'
  for update;
  if not found then
    raise exception 'application can only be withdrawn while awaiting review';
  end if;

  if exists (
    select 1 from public.review_history rh
    where rh.creator_id = actor and rh.action <> 'submitted'
      and rh.created_at >= coalesce(sent_at, '-infinity'::timestamptz)
  ) or exists (
    select 1 from public.metric_evidence me
    where me.creator_id = actor and me.reviewed_at >= coalesce(sent_at, '-infinity'::timestamptz)
  ) or exists (
    select 1 from public.social_accounts sa
    where sa.creator_id = actor and sa.verified_at >= coalesce(sent_at, '-infinity'::timestamptz)
  ) then
    raise exception 'review has already started';
  end if;

  update public.creator_profiles
  set status = 'incomplete', submitted_at = null
  where user_id = actor;

  insert into public.review_history (creator_id, actor_id, action)
  values (actor, actor, 'withdrawn');
  perform public.write_audit_log('creator.application.withdrawn', 'creator_profile', actor::text, '{}'::jsonb);
end;
$$;

-- Apaga uma evidência do próprio criador, só no rascunho (antes do envio).
-- Devolve o caminho do arquivo para o servidor removê-lo do Storage.
create or replace function public.delete_own_draft_evidence(target_position smallint)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  removed_path text;
begin
  if actor is null or not public.has_permission('creators.evidence.own')
    or not public.account_is_active() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.creator_profiles
    where user_id = actor and status = 'incomplete'
  ) then
    raise exception 'evidence can only be removed before the application is sent';
  end if;

  delete from public.metric_evidence
  where creator_id = actor and position = target_position
  returning storage_path into removed_path;
  if removed_path is null then
    raise exception 'evidence not found';
  end if;

  perform public.write_audit_log('creator.evidence.removed', 'metric_evidence', actor::text,
    jsonb_build_object('position', target_position));
  return removed_path;
end;
$$;

revoke all on function public.withdraw_creator_application() from public, anon;
revoke all on function public.delete_own_draft_evidence(smallint) from public, anon;
grant execute on function public.withdraw_creator_application() to authenticated;
grant execute on function public.delete_own_draft_evidence(smallint) to authenticated;
