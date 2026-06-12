export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { formatCurrency } from '@/lib/utils'

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('companies').select('id, simples_rate, das_fixo_mensal, saldo_inicial, tax_regime, prolabore_mensal, retirada_desejada_mensal, status, trial_ends_at, license_expires_at').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || String(new Date().getFullYear())
  const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0')
  const y = Number(year), m = Number(month)
  const lastDay = new Date(y, m, 0).getDate()
  const from = `${year}-${month.padStart(2, '0')}-01`
  const to   = `${year}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const today = new Date().toISOString().split('T')[0]
  const in30d = new Date(); in30d.setDate(in30d.getDate() + 30)
  const next30 = in30d.toISOString().split('T')[0]

  const [
    { data: allReceivables },
    { data: monthExpenses },
    { data: allExpenses },
    { data: goals },
    { data: monthGoalContribs },
    { data: allGoalContribs },
  ] = await Promise.all([
    supabase.from('receivables').select('amount, status, received_date, due_date').eq('company_id', company.id),
    supabase.from('expenses').select('amount').eq('company_id', company.id).gte('date', from).lte('date', to),
    supabase.from('expenses').select('amount').eq('company_id', company.id).lte('date', today),
    supabase.from('goals').select('id, name, target_amount, accumulated_amount, percentage_allocation, goal_contributions(amount, date)')
      .eq('company_id', company.id).eq('is_active', true).order('created_at', { ascending: true }),
    supabase.from('goal_contributions').select('amount').eq('company_id', company.id).gte('date', from).lte('date', to),
    supabase.from('goal_contributions').select('amount').eq('company_id', company.id),
  ])

  // This month revenue (received)
  const revenue = (allReceivables || [])
    .filter((r) => r.received_date && r.received_date >= from && r.received_date <= to)
    .reduce((s, r) => s + Number(r.amount), 0)

  // All-time received (for cumulative disponivel)
  const totalReceivedEver = (allReceivables || [])
    .filter((r) => r.received_date)
    .reduce((s, r) => s + Number(r.amount), 0)

  const totalExpensesEver = (allExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const totalGoalsEver    = (allGoalContribs || []).reduce((s, c) => s + Number(c.amount), 0)

  const monthExpensesTotal  = (monthExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const goalsThisMonth      = (monthGoalContribs || []).reduce((s, c) => s + Number(c.amount), 0)
  const taxReserve = company.tax_regime === 'mei'
    ? Math.round(Number(company.das_fixo_mensal || 86.05) * 100) / 100
    : Math.round(revenue * (company.simples_rate / 100) * 100) / 100

  // Disponível = saldo inicial + tudo que entrou − tudo que saiu − metas acumuladas
  const saldoInicial = Number(company.saldo_inicial) || 0
  const disponivel = saldoInicial + totalReceivedEver - totalExpensesEver - totalGoalsEver

  const pending    = (allReceivables || []).filter((r) => r.status === 'pendente' && r.due_date >= today)
  const overdue    = (allReceivables || []).filter((r) => r.status === 'pendente' && r.due_date < today)
  const next30List = (allReceivables || []).filter((r) => r.status === 'pendente' && r.due_date >= today && r.due_date <= next30)

  const pendingTotal  = pending.reduce((s, r) => s + Number(r.amount), 0)
  const overdueTotal  = overdue.reduce((s, r) => s + Number(r.amount), 0)
  const receivable30d = next30List.reduce((s, r) => s + Number(r.amount), 0)

  function estimateCompletion(goal: { accumulated_amount: number; target_amount: number; goal_contributions: Array<{amount: number; date: string}> }) {
    const remaining = Number(goal.target_amount) - Number(goal.accumulated_amount)
    if (remaining <= 0) return null
    const since = new Date(); since.setDate(since.getDate() - 60)
    const sinceISO = since.toISOString().split('T')[0]
    const recent = (goal.goal_contributions || []).filter((c) => c.date >= sinceISO)
    if (recent.length === 0) return null
    const total = recent.reduce((s, c) => s + Number(c.amount), 0)
    const monthlyAvg = total / 2
    if (monthlyAvg <= 0) return null
    const months = Math.ceil(remaining / monthlyAvg)
    const d = new Date(); d.setMonth(d.getMonth() + months)
    return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
  }

  const goalsData = (goals || []).map((g) => ({
    id: g.id,
    name: g.name,
    target_amount: Number(g.target_amount),
    accumulated_amount: Number(g.accumulated_amount),
    percentage_allocation: Number(g.percentage_allocation),
    pct: Math.min(100, Math.round((Number(g.accumulated_amount) / Number(g.target_amount)) * 100)),
    estimated_completion: estimateCompletion(g),
  }))

  const recommendations: string[] = []
  if (revenue > 0 && taxReserve > 0) {
    recommendations.push(`Reserve ${formatCurrency(taxReserve)} para impostos deste mês.`)
  }
  if (overdueTotal > 0) {
    recommendations.push(`Você tem ${formatCurrency(overdueTotal)} em recebimentos atrasados.`)
  }
  if (disponivel < 0) {
    recommendations.push(`Atenção: saldo disponível está negativo. Priorize receber pendências.`)
  }

  return NextResponse.json({
    revenue,
    expenses: monthExpensesTotal,
    tax_reserve: taxReserve,
    goals_this_month: goalsThisMonth,
    disponivel,
    saldo_inicial: saldoInicial,
    total_received_ever: totalReceivedEver,
    total_expenses_ever: totalExpensesEver,
    total_goals_ever: totalGoalsEver,
    receivables_pending: pendingTotal,
    receivable_30d: receivable30d,
    receivables_overdue: overdueTotal,
    receivables_overdue_count: overdue.length,
    goals: goalsData,
    recommendations,
    simples_rate: Number(company.simples_rate),
    company_tax_regime: company.tax_regime,
    company_prolabore_mensal: company.prolabore_mensal ? Number(company.prolabore_mensal) : null,
    company_retirada_desejada_mensal: company.retirada_desejada_mensal ? Number(company.retirada_desejada_mensal) : null,
    trial_status: company.status,
    trial_ends_at: company.trial_ends_at ?? null,
  })
}
