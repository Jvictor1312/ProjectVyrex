-- Suspender e reativar cadastros. Migration aditiva.
--
-- A situação 'suspended' existia no esquema sem nenhuma função que a
-- aplicasse. Regra (decidida em 2026-10-29):
--   - só quem tem 'creators.suspend' (padrão: administrador);
--   - só cadastros aprovados podem ser suspensos (tira o criador da base sem
--     apagar nada); reativar volta para aprovado;
--   - motivo obrigatório nos dois sentidos; o criador recebe um aviso com ele;
--   - histórico (review_history) e auditoria na mesma transação.
-- Com o cadastro suspenso o criador não edita nada (a RLS só libera edição
-- em 'incomplete' e 'changes_requested') e ele sai da fila de validação.

insert into public.permissions (key, description)
values ('creators.suspend', 'Suspender e reativar cadastros aprovados')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_key)
select id, 'creators.suspend' from public.roles where key = 'admin'
on conflict do nothing;

create or replace function public.set_creator_suspension(
  target_creator uuid,
  suspend boolean,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  clean_reason text := nullif(btrim(reason), '');
begin
  if actor is null or not public.has_permission('creators.suspend') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if clean_reason is null then
    raise exception 'a suspension reason is required' using errcode = '22023';
  end if;

  perform 1 from public.creator_profiles where user_id = target_creator for update;
  if not found or not public.can_access_creator(target_creator) then
    raise exception 'creator not found or not authorized' using errcode = '42501';
  end if;

  update public.creator_profiles
  set status = case when suspend then 'suspended' else 'approved' end,
      decided_at = now(),
      decided_by = actor,
      decision_reason = clean_reason
  where user_id = target_creator
    and status = case when suspend then 'approved' else 'suspended' end;
  if not found then
    raise exception 'only approved creators can be suspended, and only suspended ones reinstated'
      using errcode = '55000';
  end if;

  insert into public.review_history (creator_id, actor_id, action, outcome, reason)
  values (
    target_creator, actor,
    case when suspend then 'suspended' else 'reinstated' end,
    case when suspend then 'suspended' else 'approved' end,
    clean_reason
  );
  insert into public.notifications (user_id, kind, title, body)
  values (
    target_creator, 'status',
    case when suspend then 'Cadastro suspenso' else 'Cadastro reativado' end,
    clean_reason
  );
  perform public.write_audit_log(
    case when suspend then 'creator.suspended' else 'creator.reinstated' end,
    'creator_profile', target_creator::text,
    jsonb_build_object('reason', clean_reason)
  );
end;
$$;

revoke all on function public.set_creator_suspension(uuid, boolean, text) from public, anon;
grant execute on function public.set_creator_suspension(uuid, boolean, text) to authenticated;
