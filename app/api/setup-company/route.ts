export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const supabaseAdmin = createClient(
    'https://ylasrgswpybznngjhrmc.supabase.co',
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )

  const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token)
  if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json()

  const { error } = await supabaseAdmin.from('companies').insert([{
    owner_id: user.id,
    ...body,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
