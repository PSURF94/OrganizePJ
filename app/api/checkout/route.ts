import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { createClient } from '@supabase/supabase-js'
import { createOrFindCustomer, createPayment } from '@/lib/asaas'

const PLANS = {
  basic: { value: 100, description: 'OrganizePJ Basic — licença anual' },
  pro:   { value: 500, description: 'OrganizePJ Pro — licença anual' },
} as const

export async function POST(req: NextRequest) {
  if (!process.env.ASAAS_API_KEY) {
    return NextResponse.json({ error: 'Pagamento não configurado' }, { status: 503 })
  }

  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { plan } = await req.json()
  const planConfig = PLANS[plan as keyof typeof PLANS]
  if (!planConfig) return NextResponse.json({ error: 'Plano inválido' }, { status: 400 })

  const supabaseAdmin = createClient(
    'https://ylasrgswpybznngjhrmc.supabase.co',
    (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim()
  )

  const { data: company } = await supabaseAdmin
    .from('companies')
    .select('id, name')
    .eq('owner_id', session.user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 5)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  const customerId = await createOrFindCustomer(company.name, session.user.email!)
  const { invoiceUrl } = await createPayment({
    customerId,
    value: planConfig.value,
    description: planConfig.description,
    externalReference: company.id,
    dueDate: dueDateStr,
  })

  return NextResponse.json({ invoiceUrl })
}
