# Auditoria dos motores financeiros — 12/06/2026

Revisão de `lib/tax-engine.ts`, `lib/withdrawal-engine.ts`, `lib/health-engine.ts`,
`app/api/timeline/route.ts`, `app/api/dashboard/route.ts` e páginas consumidoras,
contra a legislação vigente em 2026 (verificada na web em 12/06/2026).

Severidade: 🔴 errado e visível ao cliente · 🟠 errado em cenários comuns · 🟡 melhoria/risco futuro

---

## A. Valores legais desatualizados (2026)

### A1. 🔴 DAS MEI: R$ 80,90 → R$ 86,05 (prestador de serviço)
Salário mínimo 2026 = **R$ 1.621,00** → INSS 5% = R$ 81,05 + ISS R$ 5,00 = **R$ 86,05**.
- `lib/tax-engine.ts:17` — `MEI_DAS_MENSAL = 80.90` → `86.05` (atualizar também o comentário da linha 16)
- `app/api/timeline/route.ts:25` — fallback `|| 80.90` → `|| 86.05`
- `app/receitas/[id]/receber/page.tsx:66` — fallback `|| 80.90` → `|| 86.05`
- **Dados existentes:** usuários MEI já cadastrados têm `das_fixo_mensal = 80.90` gravado em `companies`. Rodar update no Supabase: `update companies set das_fixo_mensal = 86.05 where tax_regime = 'mei' and das_fixo_mensal = 80.90;` (e recalcular `simples_rate` desses MEIs, que guarda a taxa efetiva derivada do DAS antigo).
- O texto em `tax-engine.ts:97` (`faixa_tributacao`) usa o valor dinamicamente — ok após a constante mudar.

### A2. 🔴 Salário mínimo no withdrawal-engine: R$ 1.518 → R$ 1.621
- `lib/withdrawal-engine.ts:3` — `SALARIO_MINIMO = 1518.00` → `1621.00`
- Afeta: pró-labore ótimo, INSS calculado, alerta de "pró-labore abaixo do mínimo".

### A3. 🟠 Teto INSS: R$ 7.786,02 → R$ 8.475,55
- `lib/withdrawal-engine.ts:4` — `INSS_TETO = 7786.02` → `8475.55` (o valor atual é o teto de 2024).

### A4. 🔴 Tabela IRPF obsoleta — mudança ESTRUTURAL, não só de valores
A Lei **15.270/2025** (sancionada 26/11/2025, vigente desde 01/01/2026) criou:
- **Isenção efetiva até R$ 5.000/mês** (redução igual ao imposto devido);
- **Redução parcial decrescente entre R$ 5.000,01 e R$ 7.350,00** (desconto linear que zera em R$ 7.350);
- Acima de R$ 7.350: tabela progressiva normal.

A tabela em `lib/withdrawal-engine.ts:7-14` é a de **2024** (cobra IR a partir de R$ 2.259,20).
Consequências visíveis hoje:
- `current_tax_cost` e `annual_waste` superestimados para qualquer pró-labore entre R$ 2.259 e R$ 5.000 — o app mostra "desperdício" que não existe;
- O texto em `withdrawal-engine.ts:89` ("Pró-labore até R$ 2.259/mês fica isento de IR") está errado — agora é até R$ 5.000;
- **A recomendação ótima para Lucro Presumido muda**: com IR zero até R$ 5.000, o trade-off é só o INSS de 11%.

**Implementação:** criar `calcIR2026(base)` = tabela progressiva mensal vigente + redução da Lei 15.270.
Confirmar os valores exatos da tabela e da fórmula de redução na fonte oficial no momento da implementação:
- https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/janeiro/receita-divulga-nova-tabela-do-irpf-com-as-mudancas-apos-isencao-para-quem-ganha-ate-r-5-mil
- Pontos de ancoragem para testes: IR(5000) = 0; IR(7350) = valor cheio da tabela; entre os dois, decrescimento linear do desconto.

### A5. ✅ Conferidos e ainda válidos (não mexer)
- Limite MEI: **R$ 81.000/ano** segue vigente (PLP 67/2025 e PLP 60/2025 ainda em tramitação — monitorar);
- Tabelas Anexo III e V do Simples (`tax-engine.ts:34-51`): fixas na LC 123/2006, corretas;
- Fator R ≥ 28% → Anexo III: correto;
- ISS fixo R$ 5 e ICMS R$ 1 do MEI: inalterados desde 2006.

---

## B. Bugs de cálculo

### B1. 🔴 Timeline conta despesas futuras DUAS vezes
`app/api/timeline/route.ts:40` — a query `allExpenses` não tem filtro de data, então o
`currentBalance` (linha 67-71) já desconta despesas com data futura. Essas mesmas despesas
entram de novo como eventos (`futureExpenses`, linhas 89-98) e são subtraídas do
`running_balance`. **Resultado: toda despesa futura é descontada 2× e a projeção de saldo
fica pessimista no valor exato das despesas futuras.**
- Fix: na query `allExpenses` da timeline, adicionar `.lte('date', todayStr)`.
- **Decisão de produto relacionada:** o `disponivel` do dashboard (`app/api/dashboard/route.ts:38,55`)
  também desconta despesas futuras do saldo de hoje. Não há dupla contagem lá (o dashboard não
  projeta), mas o "Disponível" de hoje fica menor do que o dinheiro em caixa. Recomendado aplicar
  o mesmo filtro `lte date today` para consistência com a timeline — decidir e aplicar nos dois.

### B2. 🟠 Abatimento de tributos pagos conta o mesmo pagamento em DOIS DAS
`app/api/timeline/route.ts:118` e `:144` — cada DAS abate pagamentos do mês de competência
**e** do mês de vencimento. Como o mês de vencimento de um DAS é o mês de competência do
seguinte, um pagamento feito em julho abate o DAS de junho (venc. 20/07) **e** o DAS de
julho (venc. 20/08). Timeline subestima impostos quando há pagamentos registrados.
- Fix: abater cada pagamento em um único DAS. Sugestão simples: consumir os pagamentos em
  ordem (fila) — cada R$ pago abate o DAS mais antigo ainda em aberto, e o que sobrar passa
  ao seguinte.

### B3. 🟠 Reserva de impostos do dashboard ignora MEI
`app/api/dashboard/route.ts:60` — `taxReserve = revenue × simples_rate%` sem checar
`tax_regime`. Para MEI, `simples_rate` guarda a taxa efetiva calculada no cadastro
(DAS ÷ faturamento declarado), então a reserva varia com a receita do mês — mas o DAS do
MEI é **fixo**. A timeline já trata isso certo (`isMei` na linha 23-25); o dashboard não.
- Fix: se `tax_regime === 'mei'`, `taxReserve = das_fixo_mensal` (adicionar o campo ao select da linha 13).

### B4. 🟡 Página Impostos lê campo que a API não retorna
`app/impostos/page.tsx:55` — `simples_rate: dash.simples_rate`, mas o JSON de
`app/api/dashboard/route.ts:110-131` não inclui `simples_rate`. Fica `undefined`.
- Fix: incluir `simples_rate: Number(company.simples_rate)` na resposta do dashboard
  (e conferir onde a página usa `summary.simples_rate`).

### B5. 🟡 Receitas do mês corrente sem limite superior
`app/api/timeline/route.ts:55-59` — `thisMonthReceived` usa só `.gte(received_date, mês-01)`,
sem `.lte`. Um `received_date` lançado em mês futuro (possível via edição manual) infla o
DAS do mês corrente.
- Fix: adicionar `.lte('received_date', último dia do mês)`.

### B6. 🟡 Timeline projeta DAS só para 2 meses numa janela de 90 dias (Simples)
Para Simples/Presumido só existem eventos de DAS do mês corrente e do próximo
(`timeline/route.ts:131-174`), mas a janela é de 90 dias — o terceiro mês aparece sem
imposto e o saldo final fica otimista. O ramo MEI cobre 3 meses (`offset 0..2`).
- Fix: estender o loop do Simples para o 3º mês usando a média ou as pendentes do período.

---

## C. Erros de domínio (recomendações erradas para o público-alvo)

### C1. 🔴 Tax-engine recomenda MEI para profissões que NÃO PODEM ser MEI
`lib/tax-engine.ts:77` — o gate do MEI é só faturamento ≤ 81k + ≤1 funcionário.
Mas atividades intelectuais/regulamentadas são **vedadas** no MEI — e são exatamente o
público-alvo do produto (engenheiros, arquitetos, advogados, médicos/psicólogos,
consultores, contadores, devs em geral). Hoje um engenheiro faturando R$ 6k/mês recebe
"MEI" como recomendação, o que é juridicamente impossível. O risco aparece só como
nota de rodapé nos `riscos`.
- Fix: adicionar `mei_permitido: boolean` em `SERVICE_CATEGORIES` (`tax-engine.ts:19-31`).
  Sugestão inicial (validar CNAE a CNAE na implementação): `tech`, `consultoria`, `design`,
  `saude`, `arquitetura`, `direito`, `contabilidade` → **não permitido**; `educacao`
  (instrutor), `reparacao`, `transporte`, `outro` → permitido com ressalva.
  Se não permitido, pular direto para Simples e explicar o porquê no `motivo`.

### C2. 🔴 Withdrawal-engine ignora o Fator R — recomendação pode estar invertida
`lib/withdrawal-engine.ts:66` recomenda pró-labore mínimo para TODO Simples. Para empresa
do **Anexo V** (tech, consultoria, design, saúde, arquitetura, direito — o grosso do público),
pró-labore mínimo derruba o Fator R abaixo de 28% e joga a empresa na alíquota de ~15,5%
em vez de ~6% (Anexo III). Exemplo: faturando R$ 20k/mês, pró-labore de R$ 5.600 (28%)
custa ~R$ 616 de INSS a mais, mas economiza ~R$ 1.900/mês de Simples. **A recomendação
atual faz o cliente do Anexo V pagar mais imposto.** O tax-engine já conhece o Fator R
(`tax-engine.ts:104-106`); o withdrawal-engine não conversa com ele.
- Fix: passar `serviceCategory`/anexo e faturamento para `calcWithdrawalRecommendation`;
  se Anexo V, comparar cenário "pró-labore mínimo no Anexo V" vs "pró-labore 28% no
  Anexo III" (INSS+IR adicionais vs economia de DAS) e recomendar o vencedor, mostrando a conta.

### C3. 🟠 IR sobre pró-labore zerado para Simples
`lib/withdrawal-engine.ts:69-70` — `hasIR` só para presumido/real. Pró-labore é rendimento
tributável do sócio **em qualquer regime**; empresa do Simples retém IRRF igual. Com a
isenção 2026 até R$ 5.000 o erro some abaixo disso, mas acima (ex.: cenário Fator R do C2,
pró-labore alto) o custo de IR precisa entrar na conta.
- Fix: aplicar `calcIR2026` ao pró-labore em todos os regimes.

### C4. 🟠 RBT12 = autodeclarado × 12, para sempre
`lib/tax-engine.ts:74` — a alíquota efetiva nasce do `faturamento_mensal` declarado no
cadastro e congela em `companies.simples_rate`. Dashboard, timeline e página Receber usam
esse valor estático. Conforme o cliente registra receitas reais, a alíquota verdadeira
(RBT12 real) diverge — e a reserva de impostos fica errada na direção que machuca.
- Fix em duas fases: (1) função `calcRBT12Real(companyId)` = soma de receivables recebidas
  nos últimos 12 meses, usada quando houver ≥ 3 meses de histórico (antes disso, manter o
  declarado ou um blend); (2) recalcular a alíquota efetiva on-the-fly no dashboard/timeline
  em vez de ler `simples_rate` congelado. A página Fiscal já recalcula e regrava
  (`app/fiscal/page.tsx:64-74`) — alinhar com ela.

### C5. 🟡 Para Lucro Presumido, a timeline chama tudo de "DAS"
`timeline/route.ts:148-172` rotula "Pagamento DAS · X% sobre receitas" mesmo para
presumido, que não tem DAS (tem IRPJ/CSLL trimestral + PIS/COFINS mensal + ISS).
A estimativa de 15% pode ficar, mas o rótulo mina a credibilidade com quem tem contador.
- Fix mínimo: se `tax_regime === 'presumido'`, descrição "Impostos estimados (Lucro
  Presumido)" e subtítulo "~15% sobre receitas — estimativa".

### C6. 🟡 Fator R nunca ativa na prática
`calcTaxRecommendation` recebe `folhaMensal = 0` por padrão e o cadastro não coleta folha.
Empresas do Anexo V com folha ≥ 28% nunca veem o benefício. Quando C2 for implementado,
alimentar com `prolabore_mensal` (já existe em `companies`) + futuro campo de folha.

---

## D. Ordem de execução sugerida

| # | Item | Esforço | Por quê primeiro |
|---|------|---------|------------------|
| 1 | A1+A2+A3 (constantes 2026) | minutos | Valores errados na cara do cliente |
| 2 | B1 (dupla contagem timeline) | pequeno | Projeção de caixa é a feature central |
| 3 | B3+B4 (MEI no dashboard, impostos page) | pequeno | Consistência entre telas |
| 4 | A4 (IRPF 2026) | médio | Pré-requisito para C2/C3 |
| 5 | C1 (MEI vedado) | médio | Recomendação juridicamente errada p/ público-alvo |
| 6 | B2, B5, B6 | pequeno | Precisão da timeline |
| 7 | C2+C3 (Fator R no pró-labore) | grande | Maior diferencial de produto da lista |
| 8 | C4 (RBT12 real) | grande | Vale como feature: "sua alíquota real, ao vivo" |
| 9 | C5, C6 | pequeno | Polish de credibilidade |

Itens 1–3 e 6 são mecânicos — Sonnet executa direto deste doc.
Itens 4, 5, 7 e 8 envolvem decisão de regra fiscal — revisar o diff com atenção (ou voltar ao Fable).

## Fontes (verificadas em 12/06/2026)

- DAS MEI 2026 (R$ 86,05 serviços): https://www8.receita.fazenda.gov.br/simplesnacional/Noticias/NoticiaCompleta.aspx?id=c3b2044c-ff97-432a-b33c-ecf2a3df6dc3 · https://blog.nubank.com.br/valor-das-mei/
- IRPF 2026 / Lei 15.270/2025: https://www.gov.br/fazenda/pt-br/assuntos/noticias/2026/janeiro/receita-divulga-nova-tabela-do-irpf-com-as-mudancas-apos-isencao-para-quem-ganha-ate-r-5-mil
- Teto INSS 2026 (R$ 8.475,55): https://www.contabilizei.com.br/contabilidade-online/teto-inss/
- Limite MEI segue R$ 81.000: https://www.contabilizei.com.br/contabilidade-online/faturamento-mei-2026/
