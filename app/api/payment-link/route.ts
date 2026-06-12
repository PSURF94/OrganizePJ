export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { getServerSupabase } from '@/lib/supabase-server'
import { createOrFindCustomer, createPayment } from '@/lib/asaas'

export async function POST(req: NextRequest) {
  if (!process.env.ASAAS_API_KEY) {
    return NextResponse.json({ error: 'Pagamento não configurado' }, { status: 503 })
  }

  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })

  const { data: company } = await supabase
    .from('companies')
    .select('id, plan')
    .eq('owner_id', session.user.id)
    .single()

  if (company?.plan !== 'pro') {
    return NextResponse.json({ error: 'Disponível apenas no plano Pro' }, { status: 403 })
  }

  const { receivable_id } = await req.json()
  if (!receivable_id) return NextResponse.json({ error: 'receivable_id obrigatório' }, { status: 400 })

  const { data: receivable } = await supabase
    .from('receivables')
    .select('id, description, amount, due_date, client_id, clients(name, email, cpf_cnpj)')
    .eq('id', receivable_id)
    .eq('company_id', company.id)
    .single()

  if (!receivable) return NextResponse.json({ error: 'Recebível não encontrado' }, { status: 404 })
  if (receivable.status === 'recebido') return NextResponse.json({ error: 'Este recebível já foi marcado como recebido' }, { status: 400 })

  const client = receivable.clients as { name: string; email: string | null; cpf_cnpj: string | null } | null
  if (!client?.email) {
    return NextResponse.json({
      error: 'Cadastre o e-mail do cliente antes de gerar o link de pagamento',
    }, { status: 422 })
  }

  const dueDate = receivable.due_date ?? new Date().toISOString().split('T')[0]
  const cpfCnpj = client.cpf_cnpj?.replace(/\D/g, '') || undefined

  try {
    const customerId = await createOrFindCustomer(client.name, client.email, cpfCnpj)
    const { invoiceUrl } = await createPayment({
      customerId,
      value: Number(receivable.amount),
      description: receivable.description,
      externalReference: receivable.id,
      dueDate,
    })
    return NextResponse.json({ invoiceUrl })
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[payment-link]', msg)
    return NextResponse.json({ error: msg }, { status: 502 })
  }
}
