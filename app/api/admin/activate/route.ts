export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const ADMIN_TOKEN = process.env.ADMIN_TOKEN
  if (!ADMIN_TOKEN) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const token = req.headers.get('x-admin-token')
  if (token !== ADMIN_TOKEN) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabaseAdmin = createClient(
    'https://ylasrgswpybznngjhrmc.supabase.co',
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )

  const body = await req.json()
  const { email } = body
  if (!email) return NextResponse.json({ error: 'email required' }, { status: 400 })

  const { data: users } = await supabaseAdmin.auth.admin.listUsers()
  const user = users?.users?.find((u) => u.email === email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const expiresAt = new Date()
  expiresAt.setFullYear(expiresAt.getFullYear() + 1)

  const { error } = await supabaseAdmin
    .from('companies')
    .update({ status: 'active', license_expires_at: expiresAt.toISOString() })
    .eq('owner_id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, expires_at: expiresAt.toISOString() })
}
