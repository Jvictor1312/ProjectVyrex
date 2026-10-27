create or replace function public.reset_social_verification_on_creator_edit()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.platform is distinct from old.platform
    or new.handle is distinct from old.handle
    or new.profile_url is distinct from old.profile_url
    or new.followers_reported is distinct from old.followers_reported then
    new.verification_status := 'unverified';
    new.verified_at := null;
    new.verified_by := null;
    perform public.write_audit_log(
      'creator.social_account.verification_reset',
      'social_account',
      new.id::text,
      jsonb_build_object('creator_id', new.creator_id)
    );
  end if;
  return new;
end;
$$;

create trigger social_account_reset_verification_on_edit
before update of platform, handle, profile_url, followers_reported
on public.social_accounts
for each row execute function public.reset_social_verification_on_creator_edit();

drop policy "creator updates own social accounts" on public.social_accounts;
create policy "creator updates own social accounts" on public.social_accounts
for update to authenticated
using (
  creator_id = auth.uid()
  and public.has_permission('creators.profile.own')
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
)
with check (
  creator_id = auth.uid()
  and public.has_permission('creators.profile.own')
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
);