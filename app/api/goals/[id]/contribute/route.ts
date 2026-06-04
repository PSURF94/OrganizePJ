export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { todayISO } from '@/lib/utils'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const { data: goal } = await supabase.from('goals')
    .select('id, accumulated_amount, target_amount').eq('id', goalId).eq('company_id', company.id).single()
  if (!goal) return NextResponse.json({ error: 'Goal not found' }, { status: 404 })

  const body = await req.json()
  const amount = Number(body.amount)
  if (!amount || amount <= 0) return NextResponse.json({ error: 'amount must be positive' }, { status: 400 })

  const { data: contribution, error } = await supabase.from('goal_contributions').insert([{
    goal_id: goalId,
    company_id: company.id,
    receivable_id: body.receivable_id || null,
    amount,
    note: body.note || null,
    date: body.date || todayISO(),
  }]).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const newAccumulated = Math.min(
    Number(goal.accumulated_amount) + amount,
    Number(goal.target_amount)
  )
  await supabase.from('goals').update({ accumulated_amount: newAccumulated }).eq('id', goalId)

  return NextResponse.json(contribution, { status: 201 })
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: goalId } = await params
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: company } = await supabase.from('companies').select('id').eq('owner_id', session.user.id).single()
  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const url = new URL(req.url)
  const contributionId = url.searchParams.get('contribution_id')
  if (!contributionId) return NextResponse.json({ error: 'contribution_id required' }, { status: 400 })

  const { data: contribution } = await supabase.from('goal_contributions')
    .select('amount').eq('id', contributionId).single()
  if (!contribution) return NextResponse.json({ error: 'Contribution not found' }, { status: 404 })

  await supabase.from('goal_contributions').delete().eq('id', contributionId)

  const { data: goal } = await supabase.from('goals').select('accumulated_amount').eq('id', goalId).single()
  if (goal) {
    await supabase.from('goals').update({
      accumulated_amount: Math.max(0, Number(goal.accumulated_amount) - Number(contribution.amount))
    }).eq('id', goalId)
  }

  return NextResponse.json({ success: true })
}
