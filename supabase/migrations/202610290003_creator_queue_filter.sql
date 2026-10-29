-- Filtro "Responsável" do painel da equipe feito no banco. Migration aditiva.
--
-- Antes, o servidor baixava os ids de todos os cadastros atribuídos e os
-- mandava de volta dentro da consulta (in.(id1,id2,...)). Com muitos
-- cadastros, a consulta crescia sem limite. Agora a lista do painel sai desta
-- função, que filtra por responsável aqui dentro; o site continua aplicando
-- situação, busca, período, ordem e paginação por cima dela.
--
-- Roda com as permissões de quem chama (security invoker): a RLS continua
-- valendo, então cada pessoa só recebe os cadastros que já poderia ver.
--
--   responsible  null  e unassigned false -> todos os cadastros visíveis
--   responsible  <id>                     -> recrutador OU gestor atual = <id>
--   unassigned   true                     -> sem recrutador e sem gestor atuais

create or replace function public.creator_queue(
  responsible uuid default null,
  unassigned boolean default false
)
returns setof public.creator_profiles
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select c.*
  from public.creator_profiles c
  where
    case
      when unassigned then
        not exists (
          select 1 from public.recruiter_assignments a
          where a.creator_id = c.user_id and a.ended_at is null
        )
        and not exists (
          select 1 from public.relationship_assignments a
          where a.creator_id = c.user_id and a.ended_at is null
        )
      when responsible is not null then
        exists (
          select 1 from public.recruiter_assignments a
          where a.creator_id = c.user_id and a.ended_at is null and a.recruiter_id = responsible
        )
        or exists (
          select 1 from public.relationship_assignments a
          where a.creator_id = c.user_id and a.ended_at is null and a.manager_id = responsible
        )
      else true
    end
$$;

revoke all on function public.creator_queue(uuid, boolean) from public, anon;
grant execute on function public.creator_queue(uuid, boolean) to authenticated;
