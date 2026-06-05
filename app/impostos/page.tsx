'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Receipt, AlertTriangle, CheckCircle, Calendar } from 'lucide-react'

interface DasEvent {
  date: string
  description: string
  subtitle: string | null
  amount: number
}

interface TaxPayment {
  id: string
  description: string
  amount: number
  date: string
  category: string
}

interface DashSummary {
  tax_reserve: number
  revenue: number
  company_tax_regime: string
}

export default function ImpostosPage() {
  const [dasEvents, setDasEvents] = useState<DasEvent[]>([])
  const [payments, setPayments] = useState<TaxPayment[]>([])
  const [summary, setSummary] = useState<DashSummary | null>(null)
  const [loading, setLoading] = useState(true)

  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()

  useEffect(() => {
    Promise.all([
      fetch(`/api/dashboard?year=${year}&month=${month}`).then((r) => r.json()),
      fetch('/api/timeline').then((r) => r.json()),
      fetch('/api/expenses').then((r) => r.json()),
    ]).then(([dash, timeline, expenses]) => {
      setSummary({
        tax_reserve: dash.tax_reserve ?? 0,
        revenue: dash.revenue ?? 0,
        company_tax_regime: dash.company_tax_regime ?? 'simples',
      })

      const events = (timeline.events ?? []) as Array<{ type: string; date: string; description: string; subtitle: string | null; amount: number }>
      setDasEvents(events.filter((e) => e.type === 'imposto'))

      const all = Array.isArray(expenses) ? expenses as TaxPayment[] : []
      setPayments(all.filter((e) => e.category === 'Tributos').slice(0, 20))

      setLoading(false)
    })
  }, [year, month])

  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  function formatDateShort(iso: string) {
    const [y, m, d] = iso.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const paidThisMonth = payments
    .filter((p) => p.date.startsWith(`${year}-${month}`))
    .reduce((s, p) => s + Number(p.amount), 0)

  const reserveRemaining = Math.max(0, (summary?.tax_reserve ?? 0) - paidThisMonth)

  if (loading) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Impostos</h1>
            <p className="text-sm text-slate-400 capitalize">{monthLabel}</p>
          </div>
          <Link href="/despesas/nova?categoria=Tributos"
            className="bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Registrar
          </Link>
        </div>

        {/* Reserva do mês */}
        <div className="bg-white rounded-2xl p-5 mb-4"
          style={{ borderTop: '4px solid #d97706', border: '1px solid #eef0f3', borderTopColor: '#d97706' }}>
          <div className="flex items-center gap-2 mb-4">
            <div style={{ width: 28, height: 28, borderRadius: 7, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Receipt size={15} color="#d97706" />
            </div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Reserva tributária — {monthLabel}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 mb-1">Reservar</p>
              <p className="text-base font-bold text-amber-600">{formatCurrency(summary?.tax_reserve ?? 0)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 mb-1">Pago este mês</p>
              <p className="text-base font-bold text-emerald-600">{formatCurrency(paidThisMonth)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 text-center">
              <p className="text-[10px] text-slate-400 mb-1">Falta separar</p>
              <p className={`text-base font-bold ${reserveRemaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                {formatCurrency(reserveRemaining)}
              </p>
            </div>
          </div>

          {reserveRemaining <= 0 ? (
            <div className="flex items-center gap-2 bg-emerald-50 rounded-xl px-3 py-2">
              <CheckCircle size={14} color="#10b981" />
              <p className="text-xs text-emerald-700 font-medium">Reserva coberta pelos pagamentos deste mês.</p>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-amber-50 rounded-xl px-3 py-2">
              <AlertTriangle size={14} color="#d97706" />
              <p className="text-xs text-amber-700 font-medium">
                Separe {formatCurrency(reserveRemaining)} da sua conta para o DAS.
              </p>
            </div>
          )}
        </div>

        {/* Próximos vencimentos */}
        {dasEvents.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Próximos vencimentos</p>
            <div className="space-y-2">
              {dasEvents.map((ev, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ border: '1px solid #eef0f3', borderLeft: '3px solid #d97706' }}>
                  <div className="flex items-center gap-3">
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Calendar size={14} color="#d97706" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{ev.description}</p>
                      {ev.subtitle && <p className="text-xs text-slate-400 mt-0.5">{ev.subtitle}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 ml-3">
                    <p className="text-sm font-bold text-amber-600">{formatCurrency(Math.abs(ev.amount))}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">{formatDateShort(ev.date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Histórico de pagamentos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Pagamentos registrados</p>
            <Link href="/despesas" className="text-xs text-[#FF8A00] font-semibold">Ver despesas →</Link>
          </div>

          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px solid #eef0f3' }}>
              <Receipt size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">Nenhum pagamento de tributo registrado.</p>
              <Link href="/despesas/nova?categoria=Tributos"
                className="text-[#FF8A00] text-sm mt-2 inline-block font-medium">
                Registrar pagamento
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {payments.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ border: '1px solid #eef0f3' }}>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{p.description}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{formatDate(p.date)}</p>
                  </div>
                  <p className="text-sm font-bold text-red-500 flex-shrink-0 ml-3">
                    −{formatCurrency(Number(p.amount))}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
