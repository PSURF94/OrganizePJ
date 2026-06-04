export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id, simples_rate').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const today = new Date()
  const months: { year: number; month: number; label: string; from: string; to: string }[] = []
  for (let i = 0; i < 6; i++) {
    const d = new Date(today.getFullYear(), today.getMonth() + i, 1)
    const y = d.getFullYear()
    const m = d.getMonth() + 1
    const lastDay = new Date(y, m, 0).getDate()
    months.push({
      year: y, month: m,
      label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
      from: `${y}-${String(m).padStart(2, '0')}-01`,
      to: `${y}-${String(m).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`,
    })
  }

  const from = months[0].from
  const to = months[months.length - 1].to

  const [{ data: receivables }, { data: expenses }] = await Promise.all([
    supabase.from('receivables').select('amount, due_date, received_date, description, client:clients(name)')
      .eq('company_id', company.id).gte('due_date', from).lte('due_date', to),
    supabase.from('expenses').select('amount, date, description, category')
      .eq('company_id', company.id).gte('date', from).lte('date', to),
  ])

  const todayStr = today.toISOString().split('T')[0]
  const result = months.map(({ year, month, label, from: mFrom, to: mTo }) => {
    const mReceivables = (receivables || []).filter((r) => r.due_date >= mFrom && r.due_date <= mTo)
    const mExpenses = (expenses || []).filter((e) => e.date >= mFrom && e.date <= mTo)
    const totalReceivables = mReceivables.reduce((s, r) => s + Number(r.amount), 0)
    const totalExpenses = mExpenses.reduce((s, e) => s + Number(e.amount), 0)
    const tax = Math.round(
      mReceivables.filter((r) => r.received_date).reduce((s, r) => s + Number(r.amount), 0)
        * (company.simples_rate / 100) * 100
    ) / 100

    return { year, month, label, totalReceivables, totalExpenses, tax, net: totalReceivables - totalExpenses - tax }
  })

  return NextResponse.json(result)
}
