export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET
  if (!WEBHOOK_SECRET) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const incoming = req.headers.get('x-webhook-secret') ?? new URL(req.url).searchParams.get('secret')
  if (incoming !== WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    'https://ylasrgswpybznngjhrmc.supabase.co',
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )
  const body = await req.json()

  // Hotmart: event = 'PURCHASE_APPROVED' | 'PURCHASE_CANCELED'
  // Kiwify: status = 'paid' | 'refunded'
  const email =
    body?.data?.buyer?.email ||
    body?.customer?.email ||
    body?.email

  const isPaid =
    body?.event === 'PURCHASE_APPROVED' ||
    body?.status === 'paid'

  const isCanceled =
    body?.event === 'PURCHASE_CANCELED' ||
    body?.status === 'refunded'

  if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 })

  const { data: user } = await supabaseAdmin.auth.admin.listUsers()
  const found = user?.users?.find((u) => u.email === email)
  if (!found) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id')
    .eq('owner_id', found.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  if (isPaid) {
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    await supabaseAdmin.from('companies').update({
      status: 'active',
      license_expires_at: expiresAt.toISOString(),
    }).eq('id', company.id)
  } else if (isCanceled) {
    await supabaseAdmin.from('companies').update({ status: 'expired' }).eq('id', company.id)
  }

  return NextResponse.json({ ok: true })
}
