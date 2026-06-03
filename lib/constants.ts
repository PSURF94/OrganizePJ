export const TAX_REGIMES = {
  mei: 'MEI',
  simples: 'Simples Nacional',
  presumido: 'Lucro Presumido',
  real: 'Lucro Real',
} as const

export const SERVICE_STATUSES = {
  orcamento: 'Orçamento',
  aprovado: 'Aprovado',
  em_execucao: 'Em execução',
  concluido: 'Concluído',
  faturado: 'Faturado',
  recebido: 'Recebido',
} as const

export const SERVICE_STATUS_COLORS: Record<string, string> = {
  orcamento: '#94a3b8',
  aprovado: '#3b82f6',
  em_execucao: '#f59e0b',
  concluido: '#8b5cf6',
  faturado: '#06b6d4',
  recebido: '#10b981',
}

export const RECEIVABLE_STATUSES = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
} as const

export const EXPENSE_CATEGORIES = [
  'Combustível',
  'Equipamentos',
  'Software',
  'Marketing',
  'Tributos',
  'Terceiros',
  'Alimentação',
  'Hospedagem',
  'Outras',
] as const

export const LICENSE_STATUS = {
  trial: 'trial',
  active: 'active',
  expired: 'expired',
} as const

export type TaxRegime = keyof typeof TAX_REGIMES
export type ServiceStatus = keyof typeof SERVICE_STATUSES
export type ReceivableStatus = keyof typeof RECEIVABLE_STATUSES
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number]
export type LicenseStatus = keyof typeof LICENSE_STATUS

export interface Company {
  id: string
  owner_id: string
  name: string
  cnpj?: string
  tax_regime: TaxRegime
  simples_rate: number
  trial_ends_at: string
  license_expires_at?: string
  status: LicenseStatus
  created_at: string
}

export interface Client {
  id: string
  company_id: string
  name: string
  cpf_cnpj?: string
  email?: string
  phone?: string
  created_at: string
}

export interface Service {
  id: string
  company_id: string
  client_id: string
  client?: Client
  title: string
  description?: string
  contracted_value: number
  execution_date?: string
  expected_payment_date?: string
  status: ServiceStatus
  created_at: string
}

export interface Receivable {
  id: string
  company_id: string
  client_id?: string
  service_id?: string
  client?: Client
  service?: Service
  description: string
  amount: number
  due_date: string
  received_date?: string
  status: ReceivableStatus
  created_at: string
}

export interface Expense {
  id: string
  company_id: string
  category: ExpenseCategory
  description: string
  amount: number
  date: string
  installment_group_id?: string
  installment_number: number
  installment_total: number
  created_at: string
}

export interface DashboardSummary {
  revenue: number
  expenses: number
  net_profit: number
  tax_reserve: number
  available: number
  receivables_pending: number
  receivables_overdue: number
}
