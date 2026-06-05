export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN
  if (!ASAAS_WEBHOOK_TOKEN) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const token = req.headers.get('asaas-access-token')
  if (token !== ASAAS_WEBHOOK_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { event, payment } = body

  const isPaid     = event === 'PAYMENT_RECEIVED' || event === 'PAYMENT_CONFIRMED'
  const isCanceled = event === 'PAYMENT_REFUNDED'  || event === 'PAYMENT_CHARGEBACK_DISPUTE'

  if (!isPaid && !isCanceled) return NextResponse.json({ ok: true })

  const companyId = payment?.externalReference
  if (!companyId) return NextResponse.json({ error: 'No externalReference' }, { status: 400 })

  const supabaseAdmin = createClient(
    'https://ylasrgswpybznngjhrmc.supabase.co',
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )

  if (isPaid) {
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    await supabaseAdmin
      .from('companies')
      .update({ status: 'active', license_expires_at: expiresAt.toISOString() })
      .eq('id', companyId)
  } else if (isCanceled) {
    await supabaseAdmin
      .from('companies')
      .update({ status: 'expired' })
      .eq('id', companyId)
  }

  return NextResponse.json({ ok: true })
}
