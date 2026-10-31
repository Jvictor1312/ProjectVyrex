-- Verificação das métricas do Instagram por dois caminhos, ambos opcionais:
--   1. conexão oficial pela API da Meta (Instagram API com login do Instagram);
--   2. gravação de tela enviada pelo criador e conferida pela equipe.
-- Migration aditiva: só cria tabelas, funções, bucket e políticas novas e
-- amplia a lista de ações do histórico. Não altera nem apaga dados.
--
-- Regras de segurança:
-- - O token de acesso do Instagram fica em `instagram_tokens`, sem nenhuma
--   permissão para anon/authenticated (só o servidor, com a chave de serviço)
--   e ainda cifrado pelo servidor (AES-256-GCM) antes de chegar ao banco.
-- - Conexões e métricas consultadas pela API são gravadas só pelo servidor;
--   o criador e a equipe autorizada apenas leem.
-- - A gravação de tela fica num bucket privado; só o dono e a equipe com
--   acesso ao criador leem.

alter table public.review_history drop constraint if exists review_history_action_check;
alter table public.review_history add constraint review_history_action_check check (action in (
  'submitted', 'forwarded', 'review_started', 'evidence_approved', 'evidence_rejected',
  'evidence_changes_requested', 'social_account_verified', 'social_account_rejected',
  'approved', 'rejected', 'changes_requested', 'suspended', 'reinstated', 'withdrawn',
  'recording_approved', 'recording_rejected'
));

-- 1. Conexão com o Instagram (sem o token).
create table if not exists public.instagram_connections (
  creator_id uuid primary key references public.creator_profiles (user_id) on delete cascade,
  -- Identificador da conta profissional (campo user_id de /me) e o
  -- identificador por aplicativo (campo id), usado nos avisos da Meta.
  instagram_user_id text not null check (instagram_user_id ~ '^[0-9]{1,40}$'),
  app_scoped_id text check (app_scoped_id is null or app_scoped_id ~ '^[0-9]{1,40}$'),
  username text not null check (char_length(username) between 1 and 100),
  account_type text check (account_type is null or char_length(account_type) <= 40),
  granted_scopes text[] not null default '{}'::text[],
  status text not null default 'active'
    check (status in ('active', 'reconnect_required', 'revoked', 'disconnected')),
  status_reason text check (status_reason is null or char_length(status_reason) <= 300),
  connected_at timestamptz not null default now(),
  token_expires_at timestamptz,
  last_synced_at timestamptz,
  last_sync_error text check (last_sync_error is null or char_length(last_sync_error) <= 300),
  updated_at timestamptz not null default now()
);
-- Uma conta do Instagram só pode estar ligada a um criador por vez.
create unique index if not exists instagram_connections_live_account_idx
  on public.instagram_connections (instagram_user_id)
  where status in ('active', 'reconnect_required');
create index if not exists instagram_connections_app_scoped_idx
  on public.instagram_connections (app_scoped_id);

drop trigger if exists instagram_connections_set_updated_at on public.instagram_connections;
create trigger instagram_connections_set_updated_at
before update on public.instagram_connections
for each row execute function public.set_updated_at();

-- 2. Token cifrado. Nenhuma política: só a chave de serviço chega aqui.
create table if not exists public.instagram_tokens (
  creator_id uuid primary key references public.instagram_connections (creator_id) on delete cascade,
  -- Nulo depois de desconectar ou de a pessoa revogar o acesso na Meta.
  access_token_ciphertext text check (
    access_token_ciphertext is null or char_length(access_token_ciphertext) <= 4000
  ),
  issued_at timestamptz,
  expires_at timestamptz,
  updated_at timestamptz not null default now()
);

drop trigger if exists instagram_tokens_set_updated_at on public.instagram_tokens;
create trigger instagram_tokens_set_updated_at
before update on public.instagram_tokens
for each row execute function public.set_updated_at();

-- 3. Métricas consultadas pela API. Cada consulta é um registro novo
-- (histórico preservado). Métrica que a API não entregou fica nula, com o
-- motivo em `unavailable`; nunca é gravada como zero.
create table if not exists public.instagram_metric_snapshots (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null references public.creator_profiles (user_id) on delete cascade,
  instagram_user_id text not null check (instagram_user_id ~ '^[0-9]{1,40}$'),
  username text not null check (char_length(username) between 1 and 100),
  fetched_at timestamptz not null default now(),
  followers_count integer check (followers_count is null or followers_count >= 0),
  media_count integer check (media_count is null or media_count >= 0),
  account_views bigint check (account_views is null or account_views >= 0),
  account_reach bigint check (account_reach is null or account_reach >= 0),
  insights_since timestamptz,
  insights_until timestamptz,
  stories jsonb not null default '[]'::jsonb check (
    jsonb_typeof(stories) = 'array' and jsonb_array_length(stories) <= 50
  ),
  unavailable jsonb not null default '{}'::jsonb check (jsonb_typeof(unavailable) = 'object')
);
create index if not exists instagram_metric_snapshots_creator_idx
  on public.instagram_metric_snapshots (creator_id, fetched_at desc);

-- 4. Gravação de tela (uma por criador; enviar outra substitui a anterior).
create table if not exists public.metric_recordings (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid not null unique references public.creator_profiles (user_id) on delete cascade,
  storage_path text not null unique check (char_length(storage_path) <= 300),
  content_type text not null check (content_type in ('video/mp4', 'video/quicktime')),
  size_bytes integer not null check (size_bytes between 1 and 52428800),
  duration_seconds numeric(6, 1) not null check (duration_seconds between 10 and 180),
  review_status text not null default 'pending'
    check (review_status in ('pending', 'approved', 'rejected')),
  review_reason text check (review_reason is null or char_length(review_reason) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists metric_recordings_set_updated_at on public.metric_recordings;
create trigger metric_recordings_set_updated_at
before update on public.metric_recordings
for each row execute function public.set_updated_at();

alter table public.instagram_connections enable row level security;
alter table public.instagram_tokens enable row level security;
alter table public.instagram_metric_snapshots enable row level security;
alter table public.metric_recordings enable row level security;

revoke all on public.instagram_connections, public.instagram_tokens,
  public.instagram_metric_snapshots, public.metric_recordings
from public, anon, authenticated;

grant select on public.instagram_connections, public.instagram_metric_snapshots,
  public.metric_recordings to authenticated;

-- O servidor grava conexões, tokens e métricas com a chave de serviço.
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant select, insert, update on public.instagram_connections, public.instagram_tokens,
      public.instagram_metric_snapshots to service_role;
    grant select on public.metric_recordings to service_role;
  end if;
end;
$$;

drop policy if exists "instagram connection visible to owner or authorized staff" on public.instagram_connections;
create policy "instagram connection visible to owner or authorized staff"
on public.instagram_connections for select to authenticated
using (
  (creator_id = auth.uid() and public.account_is_active())
  or public.can_access_creator(creator_id)
);

drop policy if exists "instagram metrics visible to owner or authorized staff" on public.instagram_metric_snapshots;
create policy "instagram metrics visible to owner or authorized staff"
on public.instagram_metric_snapshots for select to authenticated
using (
  (creator_id = auth.uid() and public.account_is_active())
  or public.can_access_creator(creator_id)
);

drop policy if exists "metric recording visible to owner or authorized staff" on public.metric_recordings;
create policy "metric recording visible to owner or authorized staff"
on public.metric_recordings for select to authenticated
using (
  (creator_id = auth.uid() and public.account_is_active())
  or public.can_access_creator(creator_id)
);

-- 5. Bucket privado das gravações (50 MB, o limite por arquivo do plano
-- gratuito do Supabase). MP4 e MOV (gravação de tela do iPhone e do Android).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('metric-recordings', 'metric-recordings', false, 52428800, array['video/mp4', 'video/quicktime'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "creator uploads metric recording into own folder" on storage.objects;
create policy "creator uploads metric recording into own folder" on storage.objects for insert to authenticated
with check (
  bucket_id = 'metric-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('creators.evidence.own')
  and public.consume_evidence_upload_quota()
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
);

drop policy if exists "authorized users read metric recordings" on storage.objects;
create policy "authorized users read metric recordings" on storage.objects for select to authenticated
using (
  bucket_id = 'metric-recordings'
  and (
    ((storage.foldername(name))[1] = auth.uid()::text and public.account_is_active())
    or (
      (storage.foldername(name))[1] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$'
      and public.can_access_creator(((storage.foldername(name))[1])::uuid)
    )
  )
);

drop policy if exists "creator removes own metric recording while editing" on storage.objects;
create policy "creator removes own metric recording while editing" on storage.objects for delete to authenticated
using (
  bucket_id = 'metric-recordings'
  and (storage.foldername(name))[1] = auth.uid()::text
  and public.has_permission('creators.evidence.own')
  and exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = auth.uid() and cp.status in ('incomplete', 'changes_requested')
  )
);

-- 6. O criador registra a gravação que já enviou ao Storage. Devolve o
-- caminho da gravação anterior (o servidor remove o arquivo antigo).
create or replace function public.save_own_metric_recording(
  recording_path text,
  recording_content_type text,
  recording_size integer,
  recording_duration numeric
)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  previous_path text;
begin
  if actor is null or not public.has_permission('creators.evidence.own')
    or not public.account_is_active() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  perform 1 from public.creator_profiles
  where user_id = actor and status in ('incomplete', 'changes_requested')
  for update;
  if not found then
    raise exception 'application is not editable';
  end if;
  if recording_path is null
    or recording_path !~ ('^' || actor::text || '/[0-9a-f-]{36}\.(mp4|mov)$')
    or not exists (
      select 1 from storage.objects o
      where o.bucket_id = 'metric-recordings' and o.name = recording_path
    ) then
    raise exception 'recording file not found';
  end if;

  select storage_path into previous_path from public.metric_recordings where creator_id = actor;

  insert into public.metric_recordings (creator_id, storage_path, content_type, size_bytes, duration_seconds)
  values (actor, recording_path, recording_content_type, recording_size, round(recording_duration, 1))
  on conflict (creator_id) do update set
    storage_path = excluded.storage_path,
    content_type = excluded.content_type,
    size_bytes = excluded.size_bytes,
    duration_seconds = excluded.duration_seconds,
    review_status = 'pending',
    review_reason = null,
    reviewed_by = null,
    reviewed_at = null;

  perform public.write_audit_log('creator.metric_recording.saved', 'metric_recording', actor::text,
    jsonb_build_object('replaced', previous_path is not null));
  return case when previous_path is distinct from recording_path then previous_path end;
end;
$$;

-- 7. A equipe de validação aprova ou recusa a gravação (motivo obrigatório
-- para recusar), com histórico e auditoria na mesma transação.
create or replace function public.review_metric_recording(
  target_recording uuid,
  decision text,
  reason text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  recording public.metric_recordings%rowtype;
begin
  if actor is null or not public.has_permission('creators.validation.review') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if decision not in ('approved', 'rejected') then
    raise exception 'invalid recording decision';
  end if;
  if decision = 'rejected' and nullif(btrim(reason), '') is null then
    raise exception 'a reason is required';
  end if;

  select * into recording from public.metric_recordings where id = target_recording for update;
  if not found or not public.can_access_creator(recording.creator_id) then
    raise exception 'recording not found or not authorized' using errcode = '42501';
  end if;
  if not exists (
    select 1 from public.creator_profiles cp
    where cp.user_id = recording.creator_id and cp.status in ('submitted', 'under_review')
  ) then
    raise exception 'creator is not in the validation queue';
  end if;

  update public.metric_recordings
  set review_status = decision, review_reason = nullif(btrim(reason), ''),
      reviewed_by = actor, reviewed_at = now()
  where id = target_recording;

  insert into public.review_history (creator_id, actor_id, action, outcome, reason)
  values (
    recording.creator_id, actor,
    case decision when 'approved' then 'recording_approved' else 'recording_rejected' end,
    decision, nullif(btrim(reason), '')
  );
  perform public.write_audit_log('creator.metric_recording.reviewed', 'metric_recording', target_recording::text,
    jsonb_build_object('decision', decision, 'creator_id', recording.creator_id));
end;
$$;

revoke all on function public.save_own_metric_recording(text, text, integer, numeric) from public, anon;
revoke all on function public.review_metric_recording(uuid, text, text) from public, anon;
grant execute on function public.save_own_metric_recording(text, text, integer, numeric) to authenticated;
grant execute on function public.review_metric_recording(uuid, text, text) to authenticated;
