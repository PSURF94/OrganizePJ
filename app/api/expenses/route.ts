export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { randomUUID } from 'crypto'

export async function GET(req: NextRequest) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { searchParams } = new URL(req.url)
  let query = supabase.from('expenses').select('*').eq('company_id', company.id).order('date', { ascending: false })

  const from = searchParams.get('from')
  const to = searchParams.get('to')
  if (from) query = query.gte('date', from)
  if (to) query = query.lte('date', to)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()
  const total = Number(body.installment_total) || 1
  const amount = Number(body.amount)
  const groupId = total > 1 ? randomUUID() : null

  const records = Array.from({ length: total }, (_, i) => {
    const [y, m, d] = body.date.split('-').map(Number)
    const date = new Date(y, m - 1 + i, d)
    const iso = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
    return {
      company_id: company.id,
      category: body.category,
      description: body.description,
      amount,
      date: iso,
      installment_group_id: groupId,
      installment_number: i + 1,
      installment_total: total,
    }
  })

  const { data, error } = await supabase.from('expenses').insert(records).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
