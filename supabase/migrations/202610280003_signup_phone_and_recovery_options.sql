-- Telefone opcional no cadastro e opções de recuperação de senha.
-- Migration aditiva: o perfil passa a receber o telefone informado no cadastro
-- (já validado pelo site, no formato internacional), e uma função devolve só
-- os 4 últimos dígitos do telefone para a tela de recuperação mostrar o número
-- mascarado. O número completo nunca sai do banco por essa função.

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  influencer_role smallint;
  signup_phone text := btrim(new.raw_user_meta_data ->> 'phone');
begin
  insert into public.profiles (id, full_name, phone, terms_version, privacy_version, consented_at)
  values (
    new.id,
    coalesce(nullif(btrim(new.raw_user_meta_data ->> 'full_name'), ''), 'Criador'),
    case when signup_phone ~ '^\+[1-9][0-9]{7,14}$' then signup_phone else null end,
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

create or replace function public.recovery_phone_hint(lookup_email text)
returns text
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  return (
    select right(regexp_replace(p.phone, '\D', '', 'g'), 4)
    from auth.users u
    join public.profiles p on p.id = u.id
    where lower(u.email) = lower(btrim(lookup_email))
      and p.is_active
      and p.phone is not null
    limit 1
  );
end;
$$;

revoke all on function public.recovery_phone_hint(text) from public;
grant execute on function public.recovery_phone_hint(text) to anon, authenticated;
