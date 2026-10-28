-- Endurecimento de segurança (revisão de 2026-10-28). Só remove permissões.
--
-- 1. A tabela interna de cota de upload só é usada por funções do próprio
--    banco; visitantes e usuários não precisam de acesso direto. O TRUNCATE
--    não respeita RLS, por isso as permissões são removidas por completo.
revoke all on table public.evidence_upload_events from public, anon, authenticated;

-- 2. Funções de gatilho (triggers) não devem ser chamadas pela API.
--    O gatilho continua funcionando: a permissão só é conferida na criação.
revoke execute on function public.audit_eligibility_settings_update()
  from public, anon, authenticated;
revoke execute on function public.reset_social_verification_on_creator_edit()
  from public, anon, authenticated;

-- 3. A dica do celular na recuperação de senha passa a ser consultada só pelo
--    servidor do site (que limita tentativas), nunca direto pela API pública.
revoke execute on function public.recovery_phone_hint(text)
  from public, anon, authenticated;
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'service_role') then
    grant execute on function public.recovery_phone_hint(text) to service_role;
  end if;
end;
$$;
