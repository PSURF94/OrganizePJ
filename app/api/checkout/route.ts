import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { createOrFindCustomer, createPayment } from '@/lib/asaas'

const PLANS = {
  basic: { value: 197, description: 'OrganizePJ Basic — licença anual' },
  pro:   { value: 497, description: 'OrganizePJ Pro — licença anual' },
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

  const { data: company } = await supabase
    .from('companies')
    .select('id, name, cnpj')
    .eq('owner_id', session.user.id)
    .single()

  if (!company) return NextResponse.json({ error: 'Empresa não encontrada' }, { status: 404 })
  if (!company.cnpj) return NextResponse.json({ error: 'Adicione seu CNPJ em Configurações antes de assinar.' }, { status: 400 })

  const dueDate = new Date()
  dueDate.setDate(dueDate.getDate() + 5)
  const dueDateStr = dueDate.toISOString().split('T')[0]

  try {
    const cnpjDigits = company.cnpj?.replace(/\D/g, '') || undefined
    const customerId = await createOrFindCustomer(company.name, session.user.email!, cnpjDigits)
    const { invoiceUrl } = await createPayment({
      customerId,
      value: planConfig.value,
      description: planConfig.description,
      externalReference: `license:${company.id}`,
      dueDate: dueDateStr,
    })
    return NextResponse.json({ invoiceUrl })
  } catch (e) {
    console.error('[checkout]', e instanceof Error ? e.message : String(e))
    return NextResponse.json({ error: 'Erro ao processar pagamento. Tente novamente.' }, { status: 502 })
  }
}
