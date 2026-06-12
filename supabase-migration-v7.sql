-- v7: campos de licença não podem ser escritos pelo dono (auditoria S2)
--
-- ⚠️ ORDEM IMPORTA: aplicar SOMENTE DEPOIS do deploy do código que troca o
-- setup-company para service role. Se aplicar antes, novos cadastros quebram
-- (o insert ainda usa o role authenticated na versão antiga).
--
-- O RLS isola tenants entre si, mas a policy "owner access" (FOR ALL) deixava
-- o dono dar UPDATE em status/plan/license_expires_at/trial_ends_at via REST
-- do Supabase com a anon key — ou seja, Pro grátis pelo console do navegador.
-- Grants por coluna fecham isso sem mexer nas policies.

-- Remove toda escrita direta na tabela pelos roles públicos
REVOKE INSERT, UPDATE, DELETE ON companies FROM anon, authenticated;

-- Devolve UPDATE só nas colunas que o dono pode legitimamente editar.
-- FORA da lista (somente service role escreve): status, plan,
-- license_expires_at, trial_ends_at, owner_id, id, created_at.
GRANT UPDATE (
  name, cnpj, tax_regime, simples_rate, das_fixo_mensal, saldo_inicial,
  service_category, folha_mensal, faturamento_mensal, num_funcionarios,
  tem_funcionarios, faturamento_esperado_12m, emite_nf, tem_contador,
  controle_atual, diagnostico_feito, profissao,
  prolabore_mensal, retirada_desejada_mensal
) ON companies TO authenticated;

-- INSERT e DELETE ficam exclusivos do service role:
-- INSERT → /api/setup-company (valida 1 empresa por conta, trial calculado no servidor)
-- DELETE → sem feature de exclusão hoje; quando existir, via rota de API

-- ── Teste de verificação (rodar como usuário comum, via console do navegador) ──
-- PATCH .../rest/v1/companies?owner_id=eq.<uid>  body: {"status":"active"}
-- → deve falhar com "permission denied for table companies"
-- E o PUT de /api/configuracoes deve continuar funcionando normalmente.
