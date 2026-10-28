-- CPF opcional da conta e recuperação de senha por CPF.
-- Migration aditiva. O CPF fica numa tabela separada que só o próprio usuário
-- lê (a equipe não vê). Gravação só pela função set_own_cpf, que confere os
-- dígitos verificadores e impede CPF repetido. A busca CPF -> e-mail da
-- recuperação de senha só pode ser feita pelo servidor (service_role).

create or replace function public.is_valid_cpf(value text)
returns boolean
language plpgsql
immutable
set search_path = public, pg_temp
as $$
declare
  digits text := regexp_replace(coalesce(value, ''), '\D', '', 'g');
  total integer;
  check_digit integer;
begin
  if length(digits) <> 11 or digits ~ '^(\d)\1{10}$' then
    return false;
  end if;
  for position_count in 9..10 loop
    total := 0;
    for i in 1..position_count loop
      total := total + substr(digits, i, 1)::integer * (position_count + 2 - i);
    end loop;
    check_digit := (total * 10) % 11;
    if check_digit = 10 then check_digit := 0; end if;
    if check_digit <> substr(digits, position_count + 1, 1)::integer then
      return false;
    end if;
  end loop;
  return true;
end;
$$;

create table if not exists public.user_documents (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  cpf text not null unique check (public.is_valid_cpf(cpf) and cpf ~ '^\d{11}$'),
  updated_at timestamptz not null default now()
);

alter table public.user_documents enable row level security;

drop policy if exists "user reads own documents" on public.user_documents;
create policy "user reads own documents" on public.user_documents for select to authenticated
using (user_id = auth.uid() and public.account_is_active());

revoke all on public.user_documents from public, anon, authenticated;
grant select on public.user_documents to authenticated;

-- Grava, troca ou remove (valor vazio) o CPF da própria conta.
create or replace function public.set_own_cpf(new_cpf text)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  digits text := regexp_replace(coalesce(new_cpf, ''), '\D', '', 'g');
begin
  if actor is null or not public.account_is_active() then
    raise exception 'not authorized' using errcode = '42501';
  end if;

  if digits = '' then
    delete from public.user_documents where user_id = actor;
    return;
  end if;
  if not public.is_valid_cpf(digits) then
    raise exception 'invalid cpf';
  end if;
  if exists (select 1 from public.user_documents where cpf = digits and user_id <> actor) then
    raise exception 'cpf already registered';
  end if;

  insert into public.user_documents (user_id, cpf)
  values (actor, digits)
  on conflict (user_id) do update set cpf = excluded.cpf, updated_at = now();
  perform public.write_audit_log('user.cpf.changed', 'profile', actor::text, '{}'::jsonb);
end;
$$;

-- Recuperação de senha: devolve o e-mail da conta ativa com esse CPF.
-- Só o servidor (service_role) executa; o site mostra o e-mail mascarado.
create or replace function public.recovery_email_for_cpf(lookup_cpf text)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return (
    select u.email
    from public.user_documents d
    join public.profiles p on p.id = d.user_id
    join auth.users u on u.id = d.user_id
    where d.cpf = regexp_replace(coalesce(lookup_cpf, ''), '\D', '', 'g')
      and p.is_active
    limit 1
  );
end;
$$;

revoke all on function public.set_own_cpf(text) from public, anon;
grant execute on function public.set_own_cpf(text) to authenticated;
revoke all on function public.recovery_email_for_cpf(text) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.recovery_email_for_cpf(text) to service_role;
    grant select, insert, update, delete on public.user_documents to service_role;
  end if;
end;
$$;
