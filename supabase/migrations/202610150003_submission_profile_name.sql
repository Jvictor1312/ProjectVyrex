create or replace function public.require_creator_public_name_for_submission()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  if new.status = 'submitted'
    and char_length(btrim(coalesce(new.public_name, ''))) < 2 then
    raise exception 'public name is required before submission'
      using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger creator_profile_name_required_for_submission
before update of status on public.creator_profiles
for each row execute function public.require_creator_public_name_for_submission();

revoke all on function public.require_creator_public_name_for_submission()
from public, anon, authenticated;