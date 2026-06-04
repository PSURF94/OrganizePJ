export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('companies')
    .select('id, simples_rate, saldo_inicial, tax_regime, das_fixo_mensal')
    .eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const endDate = new Date(today)
  endDate.setDate(endDate.getDate() + 90)
  const endStr = endDate.toISOString().split('T')[0]

  const isMei = company.tax_regime === 'mei'
  const taxRate = isMei ? 0 : Number(company.simples_rate || 0) / 100
  const dasFixo = isMei ? Number(company.das_fixo_mensal || 80.90) : 0

  // Current disponível (cumulative all-time)
  const [
    { data: allReceived },
    { data: allExpenses },
    { data: allContributions },
    { data: pendingReceivables },
    { data: futureExpenses },
    { data: thisMonthReceived },
  ] = await Promise.all([
    supabase.from('receivables').select('amount').eq('company_id', company.id).not('received_date', 'is', null),
    supabase.from('expenses').select('amount').eq('company_id', company.id),
    supabase.from('goal_contributions').select('amount').eq('company_id', company.id),
    supabase.from('receivables')
      .select('description, amount, due_date, client:clients(name)')
      .eq('company_id', company.id)
      .is('received_date', null)
      .gte('due_date', todayStr)
      .lte('due_date', endStr)
      .order('due_date'),
    supabase.from('expenses')
      .select('description, amount, date, category')
      .eq('company_id', company.id)
      .gte('date', todayStr)
      .lte('date', endStr)
      .order('date'),
    supabase.from('receivables')
      .select('amount')
      .eq('company_id', company.id)
      .not('received_date', 'is', null)
      .gte('received_date', `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`),
  ])

  const currentBalance =
    Number(company.saldo_inicial || 0)
    + (allReceived || []).reduce((s, r) => s + Number(r.amount), 0)
    - (allExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
    - (allContributions || []).reduce((s, c) => s + Number(c.amount), 0)

  // Build raw events
  const events: { date: string; type: string; description: string; subtitle: string | null; amount: number }[] = []

  for (const r of (pendingReceivables || [])) {
    const client = r.client as { name: string } | null
    events.push({
      date: r.due_date,
      type: 'receita',
      description: r.description,
      subtitle: client?.name ?? null,
      amount: Number(r.amount),
    })
  }

  for (const e of (futureExpenses || [])) {
    events.push({
      date: e.date,
      type: 'despesa',
      description: e.description,
      subtitle: e.category,
      amount: -Number(e.amount),
    })
  }

  // Tax events: DAS on 20th of next month
  if (isMei) {
    // MEI: DAS fixo mensal — um evento por mês no dia 20 do mês seguinte
    for (let offset = 0; offset <= 2; offset++) {
      const refMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1)
      const dasDate = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 20)
      if (dasDate.toISOString().split('T')[0] >= todayStr && dasDate.toISOString().split('T')[0] <= endStr) {
        events.push({
          date: dasDate.toISOString().split('T')[0],
          type: 'imposto',
          description: 'Pagamento DAS (MEI)',
          subtitle: `DAS fixo de ${refMonth.toLocaleDateString('pt-BR', { month: 'long' })}`,
          amount: -Math.round(dasFixo * 100) / 100,
        })
      }
    }
  } else {
    // Simples / Presumido: DAS proporcional às receitas do mês
    const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
    const currentMonthPending = (pendingReceivables || [])
      .filter((r) => r.due_date.startsWith(currentMonthPrefix))
      .reduce((s, r) => s + Number(r.amount), 0)
    const currentMonthReceivedAmt = (thisMonthReceived || []).reduce((s, r) => s + Number(r.amount), 0)
    const currentMonthTax = (currentMonthReceivedAmt + currentMonthPending) * taxRate

    if (currentMonthTax > 0.01) {
      const dasDate = new Date(today.getFullYear(), today.getMonth() + 1, 20)
      events.push({
        date: dasDate.toISOString().split('T')[0],
        type: 'imposto',
        description: 'Pagamento DAS',
        subtitle: `${company.simples_rate}% sobre receitas de ${today.toLocaleDateString('pt-BR', { month: 'long' })}`,
        amount: -Math.round(currentMonthTax * 100) / 100,
      })
    }

    const nextMonthDate = new Date(today.getFullYear(), today.getMonth() + 1, 1)
    const nextMonthPrefix = `${nextMonthDate.getFullYear()}-${String(nextMonthDate.getMonth() + 1).padStart(2, '0')}`
    const nextMonthPending = (pendingReceivables || [])
      .filter((r) => r.due_date.startsWith(nextMonthPrefix))
      .reduce((s, r) => s + Number(r.amount), 0)
    const nextMonthTax = nextMonthPending * taxRate

    if (nextMonthTax > 0.01) {
      const dasDate = new Date(today.getFullYear(), today.getMonth() + 2, 20)
      events.push({
        date: dasDate.toISOString().split('T')[0],
        type: 'imposto',
        description: 'Pagamento DAS',
        subtitle: `${company.simples_rate}% sobre receitas de ${nextMonthDate.toLocaleDateString('pt-BR', { month: 'long' })}`,
        amount: -Math.round(nextMonthTax * 100) / 100,
      })
    }
  }

  events.sort((a, b) => a.date.localeCompare(b.date))

  let balance = currentBalance
  const result = events.map((e) => {
    balance += e.amount
    return {
      ...e,
      running_balance: Math.round(balance * 100) / 100,
      alert: balance < 0 ? 'critical' : balance < currentBalance * 0.15 ? 'warning' : 'ok',
    }
  })

  return NextResponse.json({ current_balance: currentBalance, events: result })
}
