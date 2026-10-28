-- Convite de colaborador para um e-mail que já tem conta (por exemplo, quem
-- se cadastrou antes como criador). O servidor descobre a conta pelo e-mail e
-- adiciona a função de equipe com set_user_role (que confere a permissão de
-- quem está convidando e registra no histórico). Migration aditiva.
-- Só o servidor (service_role) executa: o navegador não consegue usar esta
-- função para descobrir quais e-mails estão cadastrados.

create or replace function public.user_id_for_email(lookup_email text)
returns uuid
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return (
    select u.id
    from auth.users u
    where lower(u.email) = lower(trim(coalesce(lookup_email, '')))
    limit 1
  );
end;
$$;

revoke all on function public.user_id_for_email(text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.user_id_for_email(text) to service_role;
  end if;
end;
$$;
