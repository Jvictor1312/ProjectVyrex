-- Busca sem acento e resumo do painel calculado no banco. Migration aditiva.
--
-- 1. Busca: "joao" encontra "João". Cada nome ganha uma cópia em minúsculas
--    e sem acento (coluna gerada, mantida pelo próprio banco). O servidor
--    normaliza o texto buscado do mesmo jeito (src/lib/search.ts).
-- 2. Painel: as contagens por recrutador, gestor e rede e o tempo médio de
--    análise passam a ser somados no banco, em vez de o servidor baixar todas
--    as atribuições, redes e decisões a cada abertura do painel.

create or replace function public.search_text(value text)
returns text
language sql
immutable
parallel safe
set search_path = pg_catalog
as $$
  select lower(translate(
    coalesce(value, ''),
    'ÁÀÂÃÄÅáàâãäåÉÈÊËéèêëÍÌÎÏíìîïÓÒÔÕÖóòôõöÚÙÛÜúùûüÇçÑñÝýÿ',
    'AAAAAAaaaaaaEEEEeeeeIIIIiiiiOOOOOoooooUUUUuuuuCcNnYyy'
  ))
$$;

alter table public.profiles
  add column if not exists full_name_search text
  generated always as (public.search_text(full_name)) stored;

alter table public.creator_profiles
  add column if not exists public_name_search text
  generated always as (public.search_text(public_name)) stored;

-- Resumo do painel da equipe. Roda com as permissões de quem chama
-- (security invoker): as regras de acesso (RLS) continuam valendo, então cada
-- pessoa só soma o que já poderia ver. A tela só mostra o resumo ao
-- administrador.
create or replace function public.internal_dashboard_report()
returns jsonb
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  with staff as (
    select distinct ur.user_id
    from public.user_roles ur
    join public.roles r on r.id = ur.role_id
    where ur.revoked_at is null
      and r.key in ('admin', 'recruiter', 'relationship_manager', 'validator')
  ),
  recruiters as (
    select a.recruiter_id as id, max(p.full_name) as name, count(*)::int as count
    from public.recruiter_assignments a
    left join public.profiles p on p.id = a.recruiter_id
    where a.ended_at is null
    group by a.recruiter_id
  ),
  managers as (
    select a.manager_id as id, max(p.full_name) as name, count(*)::int as count
    from public.relationship_assignments a
    left join public.profiles p on p.id = a.manager_id
    where a.ended_at is null
    group by a.manager_id
  ),
  platforms as (
    select s.platform as key, count(*)::int as count
    from public.social_accounts s
    where s.creator_id not in (select user_id from staff)
    group by s.platform
  ),
  decisions as (
    select extract(epoch from (c.decided_at - c.submitted_at)) / 86400.0 as days
    from public.creator_profiles c
    where c.submitted_at is not null
      and c.decided_at is not null
      and c.user_id not in (select user_id from staff)
  )
  select jsonb_build_object(
    'recruiters', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'count', count)) from recruiters), '[]'::jsonb),
    'managers', coalesce((select jsonb_agg(jsonb_build_object('id', id, 'name', name, 'count', count)) from managers), '[]'::jsonb),
    'platforms', coalesce((select jsonb_agg(jsonb_build_object('key', key, 'count', count)) from platforms), '[]'::jsonb),
    'decisions', (select count(*)::int from decisions),
    'average_days', (select avg(days)::float8 from decisions)
  )
$$;

revoke all on function public.internal_dashboard_report() from public, anon;
grant execute on function public.internal_dashboard_report() to authenticated;
grant execute on function public.search_text(text) to authenticated;
