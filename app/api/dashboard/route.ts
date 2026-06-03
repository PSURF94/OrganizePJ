export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  const supabase = getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase
    .from('companies')
    .select('id, simples_rate')
    .eq('owner_id', session.user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  const year = searchParams.get('year') || String(new Date().getFullYear())
  const month = searchParams.get('month') || String(new Date().getMonth() + 1).padStart(2, '0')
  const y = Number(year), m = Number(month)
  const lastDay = new Date(y, m, 0).getDate()
  const from = `${year}-${month.padStart(2, '0')}-01`
  const to = `${year}-${month.padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const [{ data: receivables }, { data: expenses }] = await Promise.all([
    supabase.from('receivables').select('amount, status, received_date, due_date')
      .eq('company_id', company.id),
    supabase.from('expenses').select('amount').eq('company_id', company.id)
      .gte('date', from).lte('date', to),
  ])

  const revenue = (receivables || [])
    .filter((r) => r.received_date && r.received_date >= from && r.received_date <= to)
    .reduce((s, r) => s + Number(r.amount), 0)

  const totalExpenses = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)
  const taxReserve = Math.round(revenue * (company.simples_rate / 100) * 100) / 100
  const netProfit = revenue - totalExpenses - taxReserve
  const available = netProfit

  const today = new Date().toISOString().split('T')[0]
  const pendingReceivables = (receivables || []).filter((r) => r.status === 'pendente' && r.due_date >= today)
  const overdueReceivables = (receivables || []).filter((r) => r.status === 'pendente' && r.due_date < today)

  return NextResponse.json({
    revenue,
    expenses: totalExpenses,
    net_profit: netProfit,
    tax_reserve: taxReserve,
    available,
    receivables_pending: pendingReceivables.reduce((s, r) => s + Number(r.amount), 0),
    receivables_overdue: overdueReceivables.reduce((s, r) => s + Number(r.amount), 0),
  })
}
