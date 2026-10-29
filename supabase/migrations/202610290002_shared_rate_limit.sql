-- Limite de tentativas compartilhado entre servidores. Migration aditiva.
-- Antes o contador ficava só na memória de cada servidor: numa hospedagem com
-- várias instâncias, cada uma contava separado. Agora o contador fica no banco.
--
-- Cada chave guarda uma janela fixa (início + quantidade). Ao vencer, a mesma
-- linha recomeça do zero: nada é apagado. A chave chega já resumida (SHA-256)
-- pelo servidor, então e-mails e endereços de rede não ficam gravados.
-- Só o servidor (service_role) usa: o navegador não lê nem altera contadores.

create table if not exists public.rate_limit_counters (
  key text primary key check (key ~ '^[0-9a-f]{64}$'),
  window_started_at timestamptz not null,
  hits integer not null check (hits >= 0)
);

alter table public.rate_limit_counters enable row level security;
revoke all on public.rate_limit_counters from public, anon, authenticated;

create or replace function public.consume_rate_limit(
  counter_key text,
  max_hits integer,
  window_seconds integer
)
returns boolean
language plpgsql
volatile
security definer
set search_path = public, pg_temp
as $$
declare
  current_hits integer;
begin
  if max_hits < 1 or window_seconds < 1 then
    raise exception 'invalid rate limit';
  end if;

  insert into public.rate_limit_counters as c (key, window_started_at, hits)
  values (counter_key, now(), 1)
  on conflict (key) do update
    set window_started_at = case
          when c.window_started_at <= now() - make_interval(secs => window_seconds) then now()
          else c.window_started_at
        end,
        hits = case
          when c.window_started_at <= now() - make_interval(secs => window_seconds) then 1
          -- Ao atingir o limite, para de contar (não estende o bloqueio).
          else least(c.hits + 1, max_hits + 1)
        end
  returning hits into current_hits;

  return current_hits <= max_hits;
end;
$$;

revoke all on function public.consume_rate_limit(text, integer, integer) from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.consume_rate_limit(text, integer, integer) to service_role;
  end if;
end;
$$;
