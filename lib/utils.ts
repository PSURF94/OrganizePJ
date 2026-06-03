export function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function formatDate(dateStr: string) {
  const [y, m, d] = dateStr.split('-')
  return `${d}/${m}/${y}`
}

export function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export function addDays(dateStr: string, days: number) {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() + days)
  return d.toISOString().split('T')[0]
}

export function isOverdue(dueDateStr: string) {
  return dueDateStr < todayISO()
}

export function trialEndsAt() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString()
}
