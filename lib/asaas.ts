const BASE =
  process.env.ASAAS_ENV === 'production'
    ? 'https://api.asaas.com/v3'
    : 'https://sandbox.asaas.com/api/v3'

function headers() {
  return {
    'Content-Type': 'application/json',
    access_token: process.env.ASAAS_API_KEY ?? '',
  }
}

async function findCustomerByEmail(email: string): Promise<string | null> {
  const res = await fetch(`${BASE}/customers?email=${encodeURIComponent(email)}`, {
    headers: headers(),
  })
  const data = await res.json()
  return data.data?.[0]?.id ?? null
}

export async function createOrFindCustomer(name: string, email: string): Promise<string> {
  const existing = await findCustomerByEmail(email)
  if (existing) return existing

  const res = await fetch(`${BASE}/customers`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ name, email }),
  })
  const data = await res.json()
  if (!data.id) throw new Error(`Asaas customer error: ${JSON.stringify(data)}`)
  return data.id
}

export async function createPayment(params: {
  customerId: string
  value: number
  description: string
  externalReference: string
  dueDate: string
}): Promise<{ id: string; invoiceUrl: string }> {
  const res = await fetch(`${BASE}/payments`, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({
      customer: params.customerId,
      billingType: 'UNDEFINED',
      value: params.value,
      dueDate: params.dueDate,
      description: params.description,
      externalReference: params.externalReference,
    }),
  })
  const data = await res.json()
  if (!data.invoiceUrl) throw new Error(`Asaas payment error: ${JSON.stringify(data)}`)
  return { id: data.id, invoiceUrl: data.invoiceUrl }
}
