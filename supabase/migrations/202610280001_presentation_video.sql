-- Vídeo de apresentação da Vyrex, exibido na tela de cadastro.
-- Migration aditiva: cria uma configuração única do site e um bucket público
-- de mídia. Somente administradores (permissão de configurar critérios)
-- podem trocar o vídeo; qualquer visitante pode assisti-lo.

create table if not exists public.site_settings (
  singleton boolean primary key default true check (singleton),
  presentation_video_path text,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now()
);

insert into public.site_settings (singleton) values (true)
on conflict (singleton) do nothing;

alter table public.site_settings enable row level security;

revoke all on public.site_settings from public, anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (presentation_video_path, updated_by, updated_at)
  on public.site_settings to authenticated;

drop policy if exists "site settings readable by everyone" on public.site_settings;
create policy "site settings readable by everyone" on public.site_settings
for select to anon, authenticated using (true);

drop policy if exists "site settings editable by admins" on public.site_settings;
create policy "site settings editable by admins" on public.site_settings
for update to authenticated
using (public.has_permission('creators.configure_eligibility'))
with check (public.has_permission('creators.configure_eligibility'));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('site-media', 'site-media', true, 52428800, array['video/mp4', 'video/webm'])
on conflict (id) do update set
  public = true,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admins upload site media" on storage.objects;
create policy "admins upload site media" on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and public.has_permission('creators.configure_eligibility')
);

drop policy if exists "admins remove site media" on storage.objects;
create policy "admins remove site media" on storage.objects for delete to authenticated
using (
  bucket_id = 'site-media'
  and public.has_permission('creators.configure_eligibility')
);
