export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'

async function getCompany(supabase: Awaited<ReturnType<typeof getServerSupabase>>, userId: string) {
  const { data } = await supabase.from('companies').select('id').eq('owner_id', userId).single()
  return data
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await getCompany(supabase, session.user.id)
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data, error } = await supabase
    .from('goals')
    .select('*, goal_contributions(id, amount, date, receivable_id, note, created_at)')
    .eq('id', id).eq('company_id', company.id)
    .order('created_at', { referencedTable: 'goal_contributions', ascending: false })
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await getCompany(supabase, session.user.id)
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('name' in body) updates.name = String(body.name).trim()
  if ('target_amount' in body) updates.target_amount = Number(body.target_amount)
  if ('percentage_allocation' in body) updates.percentage_allocation = Number(body.percentage_allocation)
  if ('is_active' in body) updates.is_active = Boolean(body.is_active)

  const { data, error } = await supabase.from('goals')
    .update(updates).eq('id', id).eq('company_id', company.id)
    .select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const company = await getCompany(supabase, session.user.id)
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { error } = await supabase.from('goals').delete().eq('id', id).eq('company_id', company.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
