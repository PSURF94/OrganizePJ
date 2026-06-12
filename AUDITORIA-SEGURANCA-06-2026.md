# Auditoria de segurança pré-lançamento — 12/06/2026

Escopo: middleware, RLS (8 tabelas), rotas de API sensíveis (webhook, checkout,
payment-link, cron, admin, reset-password, setup-company), gestão de segredos,
histórico do git, configs (Vercel, Next, Sentry).

Severidade: 🔴 explorável por qualquer usuário / perda direta de receita ·
🟠 explorável em condições específicas · 🟡 endurecimento recomendado

---

## 🔴 S1. Middleware inteiro desativado — `'/'` em PUBLIC_PATHS

`proxy.ts:5-6` + `proxy.ts:50`: a checagem usa `pathname.startsWith(p)` e a lista
contém `'/'`. **Todo pathname começa com `/`**, então a função retorna na linha 50
para qualquer rota. Consequências em produção AGORA:

- Redirect de não-autenticado para `/login`: nunca executa;
- Redirect de licença expirada para `/assinar`: nunca executa;
- O **402 nas APIs para licença expirada (implementado hoje) nunca executa**;
- Trial expirado continua usando o app inteiro normalmente.

O app só não está aberto ao público porque cada rota de API valida a própria sessão
e o RLS segura os dados. Mas **monetização não está sendo enforced de forma alguma**.

**Fix (1 linha):**
```ts
if (PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))) return res
```
**Teste obrigatório pós-deploy:** logado com company `status='expired'`, GET
`/api/dashboard` deve retornar 402 e `/dashboard` deve redirecionar para `/assinar`;
deslogado, `/dashboard` deve redirecionar para `/login`.

---

## 🔴 S2. Qualquer usuário pode se dar Pro vitalício grátis via REST do Supabase

A policy de `companies` (`supabase-schema.sql:73-74`) é `FOR ALL USING (owner_id = auth.uid())`
— o dono pode fazer **UPDATE em qualquer coluna**, incluindo `status`, `plan`,
`license_expires_at` e `trial_ends_at`. A anon key é pública (está no bundle do browser,
por design), então qualquer usuário logado pode rodar no console do navegador:

```
PATCH https://ylasrgswpybznngjhrmc.supabase.co/rest/v1/companies?owner_id=eq.<uid>
{ "status": "active", "plan": "pro", "license_expires_at": "2099-01-01" }
```

…e ganhar Pro para sempre, sem pagar. O RLS isola tenants entre si, mas **não protege
os campos de negócio contra o próprio dono**.

O mesmo vale para INSERT: o usuário pode criar uma segunda company com
`trial_ends_at` novo (reset infinito de trial). Bônus: com 2 companies, o
`.single()` do proxy e das APIs erra → `company = null` → o license check é pulado.

**Fix — migration v7 (os dois passos precisam ir juntos):**

1. Trocar `app/api/setup-company/route.ts` para usar o **service role client**
   (como era originalmente) com **whitelist de campos** — hoje ele faz
   `insert([{ owner_id, ...body }])` com o token do usuário, ou seja, o cliente
   controla `status`/`trial_ends_at`/`license_expires_at` no cadastro (mesma
   vulnerabilidade por outro caminho). `trial_ends_at` deve ser calculado no
   servidor (`now() + 7 dias`), nunca aceito do body.

2. Revogar escrita direta e conceder só as colunas editáveis:
```sql
REVOKE INSERT, UPDATE ON companies FROM authenticated, anon;
GRANT UPDATE (name, cnpj, tax_regime, simples_rate, das_fixo_mensal, saldo_inicial,
  service_category, folha_mensal, faturamento_mensal, num_funcionarios,
  prolabore_mensal, retirada_desejada_mensal, profissao, tem_funcionarios,
  faturamento_esperado_12m, emite_nf, tem_contador, controle_atual, diagnostico_feito)
  ON companies TO authenticated;
```
(Ajustar a lista às colunas reais; o essencial: `status`, `plan`,
`license_expires_at`, `trial_ends_at` e `owner_id` FORA do GRANT.)
O PUT de `/api/configuracoes` já usa whitelist de campos seguros — continua funcionando.

**Teste:** com um usuário comum, tentar o PATCH acima → deve falhar com permission denied.

---

## 🟠 S3. Sessão não verificada criptograficamente + usuário sem company passa

- `proxy.ts:67` e todas as rotas usam `auth.getSession()`, que só **decodifica o
  cookie sem validar o JWT no servidor**. A recomendação do Supabase para middleware
  é `auth.getUser()` (valida o token). Hoje um cookie forjado passa do gate de
  sessão (os dados ficam protegidos pelo RLS, mas o perímetro fica de papel).
- `proxy.ts:78-95`: se a query de company retorna null (usuário sem company,
  cadastro incompleto, ou o caso das 2 companies do S2), `isExpired` avalia como
  false → **acesso liberado sem nenhuma checagem de licença**. Null deve bloquear
  ou redirecionar para completar o cadastro.

**Fix:** `getUser()` no proxy; `if (!company) → redirect /cadastro` (páginas) ou 403 (APIs).

---

## 🟠 S4. Webhook Asaas: dois fluxos de pagamento colidem no mesmo campo

`externalReference` é usado com **dois significados**: `company.id` no checkout de
licença (`app/api/checkout/route.ts`) e `receivable.id` no link de pagamento Pro
(`app/api/payment-link/route.ts:57`). O webhook (`app/api/webhook/route.ts:23`)
assume que é sempre company.id:

- Cliente de um usuário Pro paga uma fatura de exatamente R$ 197 ou R$ 497 →
  webhook tenta ativar licença em `companies.id = <receivable.id>` — não acha
  nada por sorte (UUIDs não colidem), mas é fragilidade estrutural;
- Pagamentos de payment-link **nunca marcam o receivable como recebido** — o Pro
  gera o link, o cliente paga, e o app não fica sabendo (bug de produto, não só
  de segurança).

**Fix:** prefixar — `license:<companyId>` no checkout, `recv:<receivableId>` no
payment-link — e o webhook trata cada caso (ativa licença / marca recebido com
`received_date`). Validar valor do payment contra o esperado em ambos.

---

## 🟠 S5. Senha temporária gerada com `Math.random()`

`app/api/auth/reset-password/route.ts:11-14` — `Math.random()` não é
criptograficamente seguro (estado interno previsível). Senha temporária é
credencial de acesso à conta.

**Fix:**
```ts
import { randomInt } from 'crypto'
const chars = '...'
return Array.from({ length: 12 }, () => chars[randomInt(chars.length)]).join('')
```
Aproveitar e: invalidar a senha temporária após X horas ou no primeiro login
(hoje vira senha permanente até o usuário trocar).

Relacionado: `listUsers({ perPage: 1000 })` para de achar usuários a partir do
1001º; `app/api/admin/activate/route.ts:24` usa o default (**50**) — para de
funcionar no 51º usuário. Trocar busca por email por paginação ou query direta.

---

## 🟡 S6. Endurecimentos recomendados (baratos, fazer antes do lançamento)

1. **ADMIN_TOKEN:** o valor antigo `organizepj-dev-2024` está público no histórico
   do GitHub (confirmado na varredura). Garantir que o env no Vercel **não é esse
   valor** — se for, trocar agora.
2. **Comparação de tokens não constant-time** (webhook:11, admin:11, cron:11) —
   usar `crypto.timingSafeEqual`. Risco real baixo, custo de correção mínimo.
3. **Erros do Asaas vazam para o cliente:** checkout:50 e payment-link:62-64
   retornam `e.message` cru (que inclui `JSON.stringify` da resposta do Asaas).
   Logar no servidor/Sentry, responder mensagem genérica.
4. **Rate limiter** é in-memory por instância Edge (zera em cold start, não
   compartilhado entre regiões). Suficiente hoje; migrar para `@upstash/ratelimit`
   quando tiver tração. Adicionar regra para `/api/payment-link` (cria recursos
   reais no Asaas a cada chamada).
5. **Security headers ausentes** — `next.config.ts` não define nenhum. Adicionar
   `headers()` com `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
   `Referrer-Policy: strict-origin-when-cross-origin` e
   `Strict-Transport-Security`. CSP pode ficar para depois (inline styles em todo lugar).
6. **Cross-tenant no Asaas:** `createOrFindCustomer` (lib/asaas.ts:13-42) busca
   customer por email na conta inteira — um usuário Pro pode sobrescrever
   (PUT name/cpfCnpj) o customer Asaas de cliente de OUTRO tenant que use o mesmo
   email. Aceitável por ora; resolver guardando `asaas_customer_id` por client no banco.
7. **Anon key/URL hardcoded remanescentes** em `app/api/auth/callback/route.ts:14-15`,
   `webhook/route.ts:27`, `admin/activate/route.ts:16`, `auth/reset-password/route.ts:5`.
   A anon key é pública por design (sem risco direto), mas a migração para env vars
   de 06/06 ficou incompleta — consolidar.
8. **Cron sem dedup:** se `/api/cron/trial-reminder` rodar 2× no dia (retry/manual),
   manda email duplicado. Gravar `trial_reminder_sent_at` na company.

---

## ✅ O que está bem (verificado)

- **RLS ativo nas 8 tabelas** com policies de isolamento por tenant corretas
  (`FOR ALL USING` sem `WITH CHECK` explícito → Postgres aplica USING também no
  INSERT — coberto);
- **Histórico do git limpo**: nenhuma chave Asaas (`aact_`), service role
  (`c2VydmljZV9yb2xl`) ou Resend (`re_...`) em 98 commits;
- `.gitignore` cobre `.env*`; service role key só em env var no Vercel;
- Webhook valida token + valor do pagamento; admin/cron exigem secret e
  desligam (503) se o env não existe;
- Reset de senha não permite enumeração de email (sempre retorna ok);
- `payment-link` valida ownership do receivable (`eq company_id`) além do RLS;
- Rate limiting nos 3 endpoints de abuso óbvio;
- Sentry sem source maps públicos; cota protegida (20% traces).

## Ordem de execução

| # | Item | Esforço | Urgência |
|---|------|---------|----------|
| 1 | S1 — fix do `'/'` no proxy | 1 linha + teste | AGORA — monetização desligada |
| 2 | S2 — migration v7 + setup-company whitelist/service-role | 1-2h | Antes do 1º pagante |
| 3 | S6.1 — conferir ADMIN_TOKEN no Vercel | minutos | Junto com o deploy do #1 |
| 4 | S3 — getUser() + company null | pequeno | Antes do lançamento |
| 5 | S4 — prefixo no externalReference + conciliação | médio | Antes de divulgar o Pro |
| 6 | S5 — crypto random + expiração da senha temp | pequeno | Antes do lançamento |
| 7 | S6.2-8 — endurecimentos | pequeno cada | Semana do lançamento |

Itens 1, 3, 6 e 7 são mecânicos — Sonnet executa direto deste doc.
Itens 2, 4 e 5 mexem em autenticação/licença — revisar o diff com atenção
(testes do S1 e S2 descritos acima são obrigatórios).
