# Arquitetura da Vyrex

## Visão geral

Aplicação Next.js (App Router) + Supabase (Auth, PostgreSQL, Storage). A regra de negócio e a autorização ficam no banco (RLS + funções RPC `security definer`); o servidor Next.js valida entradas com Zod, exige sessão e chama o banco com a sessão do usuário. O navegador nunca recebe a chave `service_role`.

```
Navegador ──► Next.js (Server Components / Server Actions)
                 │  valida com Zod, exige sessão (requireUser)
                 ▼
             Supabase (sessão do usuário)
                 ├─ Auth
                 ├─ PostgreSQL: tabelas + RLS + RPCs
                 └─ Storage: bucket privado story-evidence
```

## Estrutura de pastas

| Caminho                     | Responsabilidade                                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `src/app/(auth)`, `(legal)` | Páginas públicas de autenticação e termos                                                                                             |
| `src/app/dashboard`         | Área do criador (visão geral, cadastro, mensagens, notificações, privacidade, configurações)                                          |
| `src/app/interno`           | Área da equipe (painel por função, detalhe do cadastro, equipe, critérios, privacidade)                                               |
| `src/app/actions`           | Server Actions: `auth`, `creator`, `internal`, `privacy`                                                                              |
| `src/app/components`        | Formulários e componentes de cliente                                                                                                  |
| `src/lib/validation`        | Schemas Zod (`auth`, `creator`, `privacy`)                                                                                            |
| `src/lib/supabase`          | Clientes server-side; `admin.ts` isolado (somente servidor)                                                                           |
| `src/lib/evidence`          | Normalização de imagem (decodifica, limita e reencoda em WebP sem metadados)                                                          |
| `supabase/migrations`       | Esquema versionado, RLS e ajustes de autorização (`202610140001_initial_platform.sql` até `202610150003_submission_profile_name.sql`) |
| `supabase/tests`, `tests`   | Testes de banco (PGlite) e de validação                                                                                               |

## Modelo de dados (resumo)

- Identidade: `profiles`, `roles`, `permissions`, `role_permissions`, `user_roles` (múltiplos papéis, revogação com histórico).
- Criador: `creator_profiles` (estado do cadastro), `social_accounts` (edições pelo titular invalidam a verificação anterior), `metric_evidence` (um registro por evidência, posição 1–5).
- Operação: `recruiter_assignments`, `relationship_assignments` (histórico com `ended_at`), `review_history`, `contact_history`, `team_messages`, `notifications`.
- Administração: `eligibility_settings` (critérios configuráveis), `audit_logs`, `evidence_upload_events` (cota de upload).
- Privacidade: `data_requests` (solicitações do titular; migration 2).

## Estados do cadastro

`incomplete → submitted → under_review → approved | rejected | changes_requested → (reenvio) → submitted`; `suspended` por ação interna. Transições ocorrem somente por RPCs que verificam permissão e gravam histórico/auditoria na mesma transação.

## Evolução prevista (não implementada)

Marcas, campanhas, propostas, contratos, entregas, comissões e pagamentos. O esquema atual não os simula; novas tabelas devem referenciar `profiles` e reutilizar RBAC/auditoria.
