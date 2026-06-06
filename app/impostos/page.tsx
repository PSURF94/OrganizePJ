'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency, formatDate, todayISO, capFirst } from '@/lib/utils'
import { Receipt, Calendar, Plus, X, CheckCircle } from 'lucide-react'

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
  simples_rate?: number
}

const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]'

export default function ImpostosPage() {
  const [dasEvents, setDasEvents]   = useState<DasEvent[]>([])
  const [payments, setPayments]     = useState<TaxPayment[]>([])
  const [summary, setSummary]       = useState<DashSummary | null>(null)
  const [loading, setLoading]       = useState(true)
  const [showForm, setShowForm]     = useState(false)
  const [savingPay, setSavingPay]   = useState(false)
  const [payForm, setPayForm]       = useState({ description: 'Pagamento DAS', amount: '', date: todayISO() })

  const now   = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year  = now.getFullYear()

  async function load() {
    const [dash, timeline, expenses] = await Promise.all([
      fetch(`/api/dashboard?year=${year}&month=${month}`).then((r) => r.json()),
      fetch('/api/timeline').then((r) => r.json()),
      fetch('/api/expenses').then((r) => r.json()),
    ])

    setSummary({
      tax_reserve:        dash.tax_reserve ?? 0,
      revenue:            dash.revenue ?? 0,
      company_tax_regime: dash.company_tax_regime ?? 'simples',
      simples_rate:       dash.simples_rate,
    })

    const events = (timeline.events ?? []) as Array<{ type: string; date: string; description: string; subtitle: string | null; amount: number }>
    setDasEvents(events.filter((e) => e.type === 'imposto'))

    const all = Array.isArray(expenses) ? expenses as TaxPayment[] : []
    setPayments(all.filter((e) => e.category === 'Tributos'))

    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleRegisterPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!payForm.amount || Number(payForm.amount) <= 0) return
    setSavingPay(true)
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category: 'Tributos',
        description: payForm.description || 'Pagamento DAS',
        amount: Number(payForm.amount),
        date: payForm.date,
        installment_total: 1,
      }),
    })
    setSavingPay(false)
    setShowForm(false)
    setPayForm({ description: 'Pagamento DAS', amount: '', date: todayISO() })
    setLoading(true)
    await load()
  }

  function formatDateShort(iso: string) {
    const [y, m, d] = iso.split('-')
    return new Date(Number(y), Number(m) - 1, Number(d))
      .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
  }

  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  // ── Cálculos do impostômetro ──
  const taxReserve = summary?.tax_reserve ?? 0                            // gerado pelas receitas já recebidas
  const dasTotal   = dasEvents.length > 0
    ? Math.abs(dasEvents.reduce((s, e) => s + e.amount, 0))              // total DAS projetado (recebidas + pendentes)
    : taxReserve

  const paidThisMonth = payments
    .filter((p) => p.date.startsWith(`${year}-${month}`))
    .reduce((s, p) => s + Number(p.amount), 0)

  const pendente  = Math.max(0, taxReserve - paidThisMonth)               // já gerado, ainda não pago
  const projetado = Math.max(0, dasTotal - taxReserve)                    // das pendências futuras
  const total     = paidThisMonth + pendente + projetado                  // tudo

  // Percentuais para a barra
  const pct = (v: number) => total > 0 ? Math.round((v / total) * 100) : 0
  const pctPago   = pct(paidThisMonth)
  const pctPend   = pct(pendente)
  const pctProj   = pct(projetado)

  const tudoPago  = pendente === 0 && projetado === 0 && paidThisMonth > 0

  if (loading) return (
    <AppShell>
      <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-lg mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22, color: '#1A1A1D', letterSpacing: '-0.3px', paddingLeft: 11, borderLeft: '3px solid #d97706' }}>
              Impostos
            </h1>
            <p className="text-sm text-slate-400 capitalize mt-0.5 pl-3">{monthLabel}</p>
          </div>
          <button
            onClick={() => setShowForm((v) => !v)}
            className="flex items-center gap-1.5 bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl"
          >
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? 'Cancelar' : 'Registrar pagamento'}
          </button>
        </div>

        {/* ── Impostômetro ── */}
        <div style={{
          background: '#1c1917', borderRadius: 20, padding: '24px 24px 20px',
          marginBottom: 16, border: '1px solid rgba(255,255,255,0.06)',
        }}>
          <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>
            Impostômetro — {monthLabel}
          </p>

          {/* Total */}
          <p style={{
            fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 40, fontWeight: 800,
            letterSpacing: '-1.5px', lineHeight: 1, color: tudoPago ? '#10b981' : '#FF8A00',
            marginBottom: 20,
          }}>
            {formatCurrency(total)}
          </p>

          {/* Barra segmentada */}
          <div style={{ display: 'flex', height: 10, borderRadius: 100, overflow: 'hidden', background: 'rgba(255,255,255,0.07)', marginBottom: 16 }}>
            {pctPago > 0 && (
              <div style={{ width: `${pctPago}%`, background: '#10b981', transition: 'width 0.6s ease' }} />
            )}
            {pctPend > 0 && (
              <div style={{ width: `${pctPend}%`, background: '#d97706', transition: 'width 0.6s ease' }} />
            )}
            {pctProj > 0 && (
              <div style={{ width: `${pctProj}%`, background: 'rgba(255,255,255,0.18)', transition: 'width 0.6s ease' }} />
            )}
          </div>

          {/* Métricas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
            {[
              { label: 'Pago',      value: paidThisMonth, color: '#10b981', dot: '#10b981' },
              { label: 'Pendente',  value: pendente,       color: '#d97706', dot: '#d97706' },
              { label: 'Projetado', value: projetado,      color: 'rgba(255,255,255,0.45)', dot: 'rgba(255,255,255,0.25)' },
            ].map(({ label, value, color, dot }) => (
              <div key={label} style={{ background: 'rgba(255,255,255,0.04)', borderRadius: 12, padding: '10px 12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: dot, flexShrink: 0 }} />
                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'rgba(255,255,255,0.3)' }}>
                    {label}
                  </span>
                </div>
                <p style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 13, fontWeight: 800, color, lineHeight: 1 }}>
                  {formatCurrency(value)}
                </p>
              </div>
            ))}
          </div>

          {/* Status */}
          <div style={{ marginTop: 14 }}>
            {tudoPago ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(16,185,129,0.1)', borderRadius: 10, padding: '8px 12px' }}>
                <CheckCircle size={13} color="#10b981" />
                <span style={{ fontSize: 12, color: '#10b981', fontWeight: 600 }}>Impostos do mês cobertos.</span>
              </div>
            ) : pendente > 0 ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(217,119,6,0.1)', borderRadius: 10, padding: '8px 12px' }}>
                <Receipt size={13} color="#d97706" />
                <span style={{ fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                  Separe {formatCurrency(pendente)} para o DAS — já gerado pelas receitas recebidas.
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.04)', borderRadius: 10, padding: '8px 12px' }}>
                <Receipt size={13} color="rgba(255,255,255,0.3)" />
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', fontWeight: 500 }}>
                  Nada vencido por enquanto — {formatCurrency(projetado)} projetado das pendências.
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Formulário inline de pagamento ── */}
        {showForm && (
          <form onSubmit={handleRegisterPayment} className="bg-white rounded-2xl p-5 mb-4 space-y-3"
            style={{ border: '1px solid #f1f5f9' }}>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Registrar pagamento</p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
              <input
                value={payForm.description}
                onChange={(e) => setPayForm((p) => ({ ...p, description: capFirst(e.target.value) }))}
                autoCapitalize="sentences"
                className={inputCls}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
                <input
                  required type="number" min="0.01" step="0.01"
                  value={payForm.amount}
                  onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                  placeholder="0,00"
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data *</label>
                <input
                  required type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                  className={inputCls}
                />
              </div>
            </div>
            <button type="submit" disabled={savingPay}
              className="w-full bg-[#FF8A00] text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50">
              {savingPay ? 'Registrando...' : 'Confirmar pagamento'}
            </button>
          </form>
        )}

        {/* ── Próximos vencimentos ── */}
        {dasEvents.length > 0 && (
          <div className="mb-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Próximos vencimentos</p>
            <div className="space-y-2">
              {dasEvents.map((ev, i) => (
                <div key={i} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                  style={{ border: '1px solid #f1f5f9', borderLeft: '3px solid #d97706' }}>
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

        {/* ── Abatimentos registrados ── */}
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Abatimentos registrados</p>

          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-6 text-center" style={{ border: '1px solid #f1f5f9' }}>
              <Receipt size={28} className="mx-auto mb-2 text-slate-300" />
              <p className="text-sm text-slate-400">Nenhum pagamento registrado ainda.</p>
              <button
                onClick={() => setShowForm(true)}
                className="text-[#FF8A00] text-sm mt-2 inline-block font-medium"
              >
                Registrar pagamento
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {payments
                .sort((a, b) => b.date.localeCompare(a.date))
                .map((p) => {
                  const isThisMonth = p.date.startsWith(`${year}-${month}`)
                  return (
                    <div key={p.id} className="bg-white rounded-2xl px-4 py-3 flex items-center justify-between"
                      style={{ border: '1px solid #f1f5f9', borderLeft: `3px solid ${isThisMonth ? '#10b981' : '#e2e8f0'}` }}>
                      <div>
                        <p className="text-sm font-medium text-slate-800">{p.description}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {formatDate(p.date)}
                          {isThisMonth && (
                            <span className="ml-2 text-emerald-600 font-semibold">· este mês</span>
                          )}
                        </p>
                      </div>
                      <p className="text-sm font-bold text-emerald-600 flex-shrink-0 ml-3">
                        −{formatCurrency(Number(p.amount))}
                      </p>
                    </div>
                  )
                })}
            </div>
          )}
        </div>

      </div>
    </AppShell>
  )
}
