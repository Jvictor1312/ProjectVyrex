-- Solicitações de privacidade e dados pessoais (acesso, correção, portabilidade,
-- eliminação, oposição). Criadas pelo próprio titular e tratadas por administradores.
-- A plataforma apenas REGISTRA e acompanha a solicitação; o atendimento efetivo é um
-- procedimento humano definido pela empresa (ver docs/SECURITY.md).

insert into public.permissions (key, description) values
  ('privacy.requests.manage', 'Tratar solicitações de privacidade e dados pessoais')
on conflict (key) do nothing;

insert into public.role_permissions (role_id, permission_key)
select r.id, 'privacy.requests.manage'
from public.roles r
where r.key = 'admin'
on conflict do nothing;

create table public.data_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null check (kind in ('access', 'correction', 'portability', 'deletion', 'objection')),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open' check (status in ('open', 'in_progress', 'resolved', 'rejected')),
  resolution_note text check (resolution_note is null or char_length(resolution_note) <= 2000),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint data_requests_resolution_consistent check (
    (status in ('resolved', 'rejected') and resolved_at is not null and resolution_note is not null)
    or (status in ('open', 'in_progress') and resolved_at is null)
  )
);

create index data_requests_user_idx on public.data_requests (user_id, created_at desc);
create index data_requests_pending_idx on public.data_requests (created_at) where status in ('open', 'in_progress');
-- Evita enchente de pedidos repetidos: no máximo um pedido ativo por tipo e titular.
create unique index data_requests_one_active_per_kind
  on public.data_requests (user_id, kind) where status in ('open', 'in_progress');

create trigger data_requests_set_updated_at before update on public.data_requests
for each row execute function public.set_updated_at();

alter table public.data_requests enable row level security;

create policy "data requests visible to owner or privacy managers" on public.data_requests
for select to authenticated
using (
  (user_id = auth.uid() and public.account_is_active())
  or public.has_permission('privacy.requests.manage')
);

revoke all on public.data_requests from anon, authenticated;
grant select on public.data_requests to authenticated;

create or replace function public.create_data_request(request_kind text, request_details text default null)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  request_id uuid;
  clean_details text := nullif(btrim(coalesce(request_details, '')), '');
begin
  if actor is null or not public.account_is_active() then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if request_kind is null or request_kind not in ('access', 'correction', 'portability', 'deletion', 'objection') then
    raise exception 'invalid request kind' using errcode = '22023';
  end if;
  if clean_details is not null and char_length(clean_details) > 2000 then
    raise exception 'details too long' using errcode = '22001';
  end if;

  insert into public.data_requests (user_id, kind, details)
  values (actor, request_kind, clean_details)
  returning id into request_id;

  insert into public.notifications (user_id, kind, title, body)
  values (actor, 'system', 'Solicitação de privacidade registrada',
    'Recebemos sua solicitação. A equipe responsável irá analisá-la e registrar o resultado nesta área.');
  perform public.write_audit_log('privacy.request.created', 'data_request', request_id::text,
    jsonb_build_object('kind', request_kind));
  return request_id;
end;
$$;

create or replace function public.resolve_data_request(request_id uuid, new_status text, note text default null)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  actor uuid := auth.uid();
  current_row public.data_requests%rowtype;
  clean_note text := nullif(btrim(coalesce(note, '')), '');
begin
  if actor is null or not public.has_permission('privacy.requests.manage') then
    raise exception 'not authorized' using errcode = '42501';
  end if;
  if new_status is null or new_status not in ('in_progress', 'resolved', 'rejected') then
    raise exception 'invalid status' using errcode = '22023';
  end if;
  if new_status in ('resolved', 'rejected') and clean_note is null then
    raise exception 'a note is required to close a request' using errcode = '22023';
  end if;
  if clean_note is not null and char_length(clean_note) > 2000 then
    raise exception 'note too long' using errcode = '22001';
  end if;

  select * into current_row from public.data_requests where id = request_id for update;
  if not found then raise exception 'request not found' using errcode = 'P0002'; end if;
  if current_row.status in ('resolved', 'rejected') then
    raise exception 'request already closed' using errcode = '55000';
  end if;

  update public.data_requests
  set status = new_status,
      resolution_note = case when new_status = 'in_progress' then resolution_note else clean_note end,
      resolved_by = case when new_status = 'in_progress' then null else actor end,
      resolved_at = case when new_status = 'in_progress' then null else now() end
  where id = request_id;

  insert into public.notifications (user_id, kind, title, body)
  values (
    current_row.user_id, 'system',
    case new_status
      when 'in_progress' then 'Solicitação de privacidade em andamento'
      when 'resolved' then 'Solicitação de privacidade concluída'
      else 'Solicitação de privacidade não atendida'
    end,
    case when new_status = 'in_progress'
      then 'A equipe começou a analisar sua solicitação.'
      else 'Consulte a resposta registrada na área de privacidade.'
    end
  );
  perform public.write_audit_log('privacy.request.' || new_status, 'data_request', request_id::text,
    jsonb_build_object('kind', current_row.kind, 'user_id', current_row.user_id));
end;
$$;

revoke all on function public.create_data_request(text, text) from public, anon;
revoke all on function public.resolve_data_request(uuid, text, text) from public, anon;
grant execute on function public.create_data_request(text, text) to authenticated;
grant execute on function public.resolve_data_request(uuid, text, text) to authenticated;
