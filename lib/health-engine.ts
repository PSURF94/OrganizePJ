export type HealthStatus = 'saudavel' | 'atencao' | 'risco'

export type HealthFator = {
  label: string
  ok: boolean
  detalhe: string
}

export type CompanyHealth = {
  score: number
  status: HealthStatus
  label: string
  color: string
  emoji: string
  fatores: HealthFator[]
  acoes: string[]
}

export type HealthInput = {
  revenue: number
  expenses: number
  tax_reserve: number
  receivables_pending: number
  receivables_overdue: number
  active_services: number
}

export function calcCompanyHealth(input: HealthInput): CompanyHealth {
  const { revenue, expenses, tax_reserve, receivables_pending, receivables_overdue, active_services } = input

  let score = 0
  const fatores: HealthFator[] = []
  const acoes: string[] = []

  // 1. Caixa (30 pts)
  const net = revenue - expenses - tax_reserve
  if (net > 0) {
    score += 30
    fatores.push({ label: 'Caixa', ok: true, detalhe: 'Receitas cobrem despesas e impostos' })
  } else if (revenue === 0 && expenses === 0) {
    score += 15
    fatores.push({ label: 'Caixa', ok: true, detalhe: 'Sem movimentação no período' })
  } else if (net > -(expenses * 0.2)) {
    score += 12
    fatores.push({ label: 'Caixa', ok: false, detalhe: 'Caixa apertado este mês' })
    acoes.push('Reduza despesas variáveis para equilibrar o caixa')
  } else {
    fatores.push({ label: 'Caixa', ok: false, detalhe: 'Despesas superam receitas este mês' })
    acoes.push('Priorize receber valores pendentes e adie despesas não essenciais')
  }

  // 2. Recebimentos futuros (20 pts)
  if (receivables_pending > 0) {
    score += 20
    fatores.push({ label: 'Recebimentos futuros', ok: true, detalhe: 'Há recebimentos previstos' })
  } else {
    fatores.push({ label: 'Recebimentos futuros', ok: false, detalhe: 'Nenhum recebimento previsto' })
    acoes.push('Cadastre os recebimentos esperados para ter visibilidade do caixa futuro')
  }

  // 3. Inadimplência (20 pts)
  if (receivables_overdue === 0) {
    score += 20
    fatores.push({ label: 'Inadimplência', ok: true, detalhe: 'Nenhum recebimento atrasado' })
  } else if (receivables_overdue < receivables_pending * 0.3) {
    score += 10
    fatores.push({ label: 'Inadimplência', ok: false, detalhe: 'Baixa inadimplência — atenção' })
    acoes.push('Entre em contato com clientes com pagamentos atrasados')
  } else {
    fatores.push({ label: 'Inadimplência', ok: false, detalhe: 'Alto índice de inadimplência' })
    acoes.push('Priorize a cobrança dos clientes em atraso — isso impacta diretamente seu caixa')
  }

  // 4. Reserva tributária (15 pts)
  if (revenue === 0) {
    score += 10
    fatores.push({ label: 'Reserva de impostos', ok: true, detalhe: 'Sem faturamento no período' })
  } else if (tax_reserve > 0) {
    score += 15
    fatores.push({ label: 'Reserva de impostos', ok: true, detalhe: 'Impostos sendo calculados automaticamente' })
  } else {
    fatores.push({ label: 'Reserva de impostos', ok: false, detalhe: 'Impostos não estão sendo reservados' })
    acoes.push('Configure sua alíquota nas configurações para calcular automaticamente a reserva')
  }

  // 5. Pipeline de serviços (15 pts)
  if (active_services >= 2) {
    score += 15
    fatores.push({ label: 'Pipeline de trabalho', ok: true, detalhe: `${active_services} serviços ativos` })
  } else if (active_services === 1) {
    score += 8
    fatores.push({ label: 'Pipeline de trabalho', ok: false, detalhe: '1 serviço ativo — dependência alta' })
    acoes.push('Busque novos clientes para diversificar sua carteira e reduzir riscos')
  } else {
    fatores.push({ label: 'Pipeline de trabalho', ok: false, detalhe: 'Nenhum serviço ativo no momento' })
    acoes.push('Cadastre seus serviços em andamento para ter visibilidade do pipeline')
  }

  let status: HealthStatus
  let label: string
  let color: string
  let emoji: string

  if (score >= 80) {
    status = 'saudavel'; label = 'Saudável'; color = '#10b981'; emoji = '🟢'
  } else if (score >= 50) {
    status = 'atencao'; label = 'Atenção'; color = '#f59e0b'; emoji = '🟡'
  } else {
    status = 'risco'; label = 'Risco'; color = '#ef4444'; emoji = '🔴'
  }

  return { score, status, label, color, emoji, fatores, acoes }
}
