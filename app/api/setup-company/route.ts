export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://ylasrgswpybznngjhrmc.supabase.co'
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYXNyZ3N3cHliem5uZ2pocm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTE4NDMsImV4cCI6MjA5NjAyNzg0M30.huqPr3ZDyHQC6F0Ef_1cUKiPFkRXPB2NfaIZiwASZGQ'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  // Client using user's JWT — satisfies RLS (owner_id = auth.uid())
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json()

  const { error } = await supabase.from('companies').insert([{
    owner_id: user.id,
    ...body,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
