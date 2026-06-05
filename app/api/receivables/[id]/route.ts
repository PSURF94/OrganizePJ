export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { todayISO } from '@/lib/utils'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data, error } = await supabase.from('receivables')
    .select('*, client:clients(name)')
    .eq('id', id).eq('company_id', company.id).single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, unknown> = {}
  if ('received_date' in body) {
    updates.received_date = body.received_date
    updates.status = body.received_date ? 'recebido' : 'pendente'
  }
  if ('amount' in body) updates.amount = Number(body.amount)
  if ('due_date' in body) updates.due_date = body.due_date
  if ('description' in body) updates.description = body.description
  if ('client_id' in body) updates.client_id = body.client_id || null

  const { data, error } = await supabase.from('receivables')
    .update(updates).eq('id', id).eq('company_id', company.id).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // When marking as received, create goal contributions
  if (body.received_date && Array.isArray(body.contributions) && body.contributions.length > 0) {
    const date = body.received_date || todayISO()
    for (const c of body.contributions) {
      if (!c.goal_id || !c.amount || Number(c.amount) <= 0) continue

      const { data: goal } = await supabase.from('goals')
        .select('id, accumulated_amount, target_amount')
        .eq('id', c.goal_id).eq('company_id', company.id).single()
      if (!goal) continue

      await supabase.from('goal_contributions').insert([{
        goal_id: c.goal_id,
        company_id: company.id,
        receivable_id: id,
        amount: Number(c.amount),
        note: c.note || null,
        date,
      }])

      const newAccumulated = Math.min(
        Number(goal.accumulated_amount) + Number(c.amount),
        Number(goal.target_amount)
      )
      await supabase.from('goals').update({ accumulated_amount: newAccumulated }).eq('id', c.goal_id)
    }
  }

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

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { error } = await supabase.from('receivables').delete().eq('id', id).eq('company_id', company.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
