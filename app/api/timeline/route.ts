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
  const isPresumido = company.tax_regime === 'presumido'
  const taxRate = isMei ? 0 : Number(company.simples_rate || 0) / 100
  const dasFixo = isMei ? Number(company.das_fixo_mensal || 86.05) : 0

  // Current disponível (cumulative all-time)
  const currentMonthPrefix = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`

  const [
    { data: allReceived },
    { data: allExpenses },
    { data: allContributions },
    { data: pendingReceivables },
    { data: futureExpenses },
    { data: thisMonthReceived },
    { data: tributosExpenses },
  ] = await Promise.all([
    supabase.from('receivables').select('amount').eq('company_id', company.id).not('received_date', 'is', null),
    supabase.from('expenses').select('amount').eq('company_id', company.id).lte('date', todayStr),
    supabase.from('goal_contributions').select('amount').eq('company_id', company.id),
    supabase.from('receivables')
      .select('id, description, amount, due_date, client:clients(name)')
      .eq('company_id', company.id)
      .is('received_date', null)
      .gte('due_date', todayStr)
      .lte('due_date', endStr)
      .order('due_date'),
    supabase.from('expenses')
      .select('id, description, amount, date, category')
      .eq('company_id', company.id)
      .gte('date', todayStr)
      .lte('date', endStr)
      .order('date'),
    supabase.from('receivables')
      .select('amount')
      .eq('company_id', company.id)
      .not('received_date', 'is', null)
      .gte('received_date', `${currentMonthPrefix}-01`)
      .lte('received_date', `${currentMonthPrefix}-${String(new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate()).padStart(2, '0')}`),
    // Pagamentos de tributos já registrados — para abater do DAS projetado
    supabase.from('expenses')
      .select('amount, date')
      .eq('company_id', company.id)
      .eq('category', 'Tributos'),
  ])

  const currentBalance =
    Number(company.saldo_inicial || 0)
    + (allReceived || []).reduce((s, r) => s + Number(r.amount), 0)
    - (allExpenses || []).reduce((s, e) => s + Number(e.amount), 0)
    - (allContributions || []).reduce((s, c) => s + Number(c.amount), 0)

  // Build raw events
  const events: { id?: string; date: string; type: string; description: string; subtitle: string | null; amount: number; status?: string; display_amount?: number }[] = []

  for (const r of (pendingReceivables || [])) {
    const client = r.client as unknown as { name: string } | null
    events.push({
      id: r.id,
      date: r.due_date,
      type: 'receita',
      status: 'pendente',
      description: r.description,
      subtitle: client?.name ?? null,
      amount: Number(r.amount),
    })
  }

  for (const e of (futureExpenses || [])) {
    events.push({
      id: e.id,
      date: e.date,
      type: 'despesa',
      description: e.description,
      subtitle: e.category,
      amount: -Number(e.amount),
    })
  }

  // Pagamentos Tributos já registrados — abate do DAS projetado por mês de pagamento
  const paidTributosByMonth = (tributosExpenses || []).reduce<Record<string, number>>((acc, e) => {
    const prefix = e.date.slice(0, 7) // "YYYY-MM"
    acc[prefix] = (acc[prefix] ?? 0) + Number(e.amount)
    return acc
  }, {})

  // Tax events: DAS on 20th of next month
  if (isMei) {
    // MEI: DAS fixo mensal — um evento por mês no dia 20 do mês seguinte
    for (let offset = 0; offset <= 2; offset++) {
      const refMonth = new Date(today.getFullYear(), today.getMonth() + offset, 1)
      const refPrefix = `${refMonth.getFullYear()}-${String(refMonth.getMonth() + 1).padStart(2, '0')}`
      const dasDate = new Date(refMonth.getFullYear(), refMonth.getMonth() + 1, 20)
      const dasDateStr = dasDate.toISOString().split('T')[0]
      if (dasDateStr >= todayStr && dasDateStr <= endStr) {
        // Abate tributos pagos no mês de vencimento do DAS
        const dasMonthPrefix = dasDateStr.slice(0, 7)
        const alreadyPaid = paidTributosByMonth[dasMonthPrefix] ?? 0
        const remaining = Math.max(0, dasFixo - alreadyPaid)
        if (remaining > 0.01) {
          events.push({
            date: dasDateStr,
            type: 'imposto',
            description: 'Pagamento DAS (MEI)',
            subtitle: `DAS fixo de ${refMonth.toLocaleDateString('pt-BR', { month: 'long' })}${alreadyPaid > 0 ? ` · já pago R$ ${alreadyPaid.toFixed(2).replace('.', ',')}` : ''}`,
            amount: -Math.round(remaining * 100) / 100,
          })
        }
      }
    }
  } else {
    // Simples / Presumido: DAS proporcional às receitas do mês
    const currentMonthPending = (pendingReceivables || [])
      .filter((r) => r.due_date.startsWith(currentMonthPrefix))
      .reduce((s, r) => s + Number(r.amount), 0)
    const currentMonthReceivedAmt = (thisMonthReceived || []).reduce((s, r) => s + Number(r.amount), 0)
    const currentMonthTax = (currentMonthReceivedAmt + currentMonthPending) * taxRate

    if (currentMonthTax > 0.01) {
      const dasDate = new Date(today.getFullYear(), today.getMonth() + 1, 20)
      const dasDateStr = dasDate.toISOString().split('T')[0]
      const dasMonthPrefix = dasDateStr.slice(0, 7)
      // Abate tributos pagos no mês de vencimento do DAS
      const alreadyPaid = paidTributosByMonth[dasMonthPrefix] ?? 0
      const remaining = Math.max(0, currentMonthTax - alreadyPaid)
      const taxDesc = isPresumido ? 'Impostos estimados (Lucro Presumido)' : 'Pagamento DAS'
      const taxSubtitleBase = (monthName: string, paid: number) => isPresumido
        ? `~${company.simples_rate}% sobre receitas de ${monthName} — estimativa${paid > 0 ? ` · já pago R$ ${paid.toFixed(2).replace('.', ',')}` : ''}`
        : `${company.simples_rate}% sobre receitas de ${monthName}${paid > 0 ? ` · já pago R$ ${paid.toFixed(2).replace('.', ',')}` : ''}`

      if (remaining > 0.01) {
        events.push({
          date: dasDateStr,
          type: 'imposto',
          description: taxDesc,
          subtitle: taxSubtitleBase(today.toLocaleDateString('pt-BR', { month: 'long' }), alreadyPaid),
          amount: -Math.round(remaining * 100) / 100,
        })
      }
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
        description: isPresumido ? 'Impostos estimados (Lucro Presumido)' : 'Pagamento DAS',
        subtitle: isPresumido
          ? `~${company.simples_rate}% sobre receitas de ${nextMonthDate.toLocaleDateString('pt-BR', { month: 'long' })} — estimativa`
          : `${company.simples_rate}% sobre receitas de ${nextMonthDate.toLocaleDateString('pt-BR', { month: 'long' })}`,
        amount: -Math.round(nextMonthTax * 100) / 100,
      })
    }

    // 3º mês — necessário para janela de 90 dias
    const secondNextMonthDate = new Date(today.getFullYear(), today.getMonth() + 2, 1)
    const secondNextMonthPrefix = `${secondNextMonthDate.getFullYear()}-${String(secondNextMonthDate.getMonth() + 1).padStart(2, '0')}`
    const secondNextMonthPending = (pendingReceivables || [])
      .filter((r) => r.due_date.startsWith(secondNextMonthPrefix))
      .reduce((s, r) => s + Number(r.amount), 0)
    const secondNextMonthTax = secondNextMonthPending * taxRate
    if (secondNextMonthTax > 0.01) {
      const dasDate = new Date(today.getFullYear(), today.getMonth() + 3, 20)
      events.push({
        date: dasDate.toISOString().split('T')[0],
        type: 'imposto',
        description: isPresumido ? 'Impostos estimados (Lucro Presumido)' : 'Pagamento DAS',
        subtitle: isPresumido
          ? `~${company.simples_rate}% sobre receitas de ${secondNextMonthDate.toLocaleDateString('pt-BR', { month: 'long' })} — estimativa`
          : `${company.simples_rate}% sobre receitas de ${secondNextMonthDate.toLocaleDateString('pt-BR', { month: 'long' })}`,
        amount: -Math.round(secondNextMonthTax * 100) / 100,
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
