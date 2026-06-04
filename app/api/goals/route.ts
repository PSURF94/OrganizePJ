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
    .from('goals')
    .select('*, goal_contributions(id, amount, date, receivable_id, note)')
    .eq('company_id', company.id)
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data || [])
}

export async function POST(req: NextRequest) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()
  const { name, target_amount, percentage_allocation } = body
  if (!name || !target_amount) return NextResponse.json({ error: 'name and target_amount required' }, { status: 400 })

  const { data, error } = await supabase.from('goals').insert([{
    company_id: company.id,
    name: String(name).trim(),
    target_amount: Number(target_amount),
    percentage_allocation: Number(percentage_allocation) || 0,
    accumulated_amount: 0,
    is_active: true,
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data, { status: 201 })
}
