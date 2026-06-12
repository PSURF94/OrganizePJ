export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createHash, timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

export async function POST(req: NextRequest) {
  const ASAAS_WEBHOOK_TOKEN = process.env.ASAAS_WEBHOOK_TOKEN
  if (!ASAAS_WEBHOOK_TOKEN) return NextResponse.json({ error: 'Webhook not configured' }, { status: 503 })

  const token = req.headers.get('asaas-access-token') ?? ''
  if (!safeEqual(token, ASAAS_WEBHOOK_TOKEN)) {
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
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )

  const PLAN_VALUES: Record<number, string> = { 197: 'basic', 497: 'pro' }

  if (isPaid) {
    const value = Math.round(payment?.value ?? 0)
    const plan = PLAN_VALUES[value]
    if (!plan) {
      console.error('[webhook] valor não reconhecido:', payment?.value, 'companyId:', companyId)
      return NextResponse.json({ error: 'Valor de pagamento não reconhecido' }, { status: 400 })
    }
    const expiresAt = new Date()
    expiresAt.setFullYear(expiresAt.getFullYear() + 1)
    await supabaseAdmin
      .from('companies')
      .update({ status: 'active', license_expires_at: expiresAt.toISOString(), plan })
      .eq('id', companyId)
  } else if (isCanceled) {
    await supabaseAdmin
      .from('companies')
      .update({ status: 'expired' })
      .eq('id', companyId)
  }

  return NextResponse.json({ ok: true })
}
