export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('receivables')
    .select('*, client:clients(id, name), service:services(id, title)')
    .eq('company_id', company.id)
    .order('due_date', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const today = new Date().toISOString().split('T')[0]
  const enriched = (data || []).map((r) => ({
    ...r,
    status: r.received_date ? 'recebido' : r.due_date < today ? 'atrasado' : 'pendente',
  }))

  return NextResponse.json(enriched)
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()
  const { data, error } = await supabase.from('receivables').insert([{
    company_id: company.id,
    client_id: body.client_id || null,
    service_id: body.service_id || null,
    description: body.description,
    amount: Number(body.amount),
    due_date: body.due_date,
    status: 'pendente',
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
