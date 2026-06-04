'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'

interface TimelineEvent {
  date: string
  type: 'receita' | 'despesa' | 'imposto'
  description: string
  subtitle: string | null
  amount: number
  running_balance: number
  alert: 'ok' | 'warning' | 'critical'
}

interface TimelineData {
  current_balance: number
  events: TimelineEvent[]
}

function formatDate(iso: string) {
  const [year, month, day] = iso.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

const TYPE_COLORS = {
  receita: {
    dot: 'bg-emerald-500',
    ring: 'ring-emerald-200',
    amount: 'text-emerald-600',
    badge: 'bg-emerald-50 text-emerald-700',
    label: 'Receita',
  },
  despesa: {
    dot: 'bg-red-500',
    ring: 'ring-red-200',
    amount: 'text-red-500',
    badge: 'bg-red-50 text-red-600',
    label: 'Despesa',
  },
  imposto: {
    dot: 'bg-amber-500',
    ring: 'ring-amber-200',
    amount: 'text-amber-600',
    badge: 'bg-amber-50 text-amber-700',
    label: 'Imposto',
  },
}

const ALERT_STYLES = {
  ok: { bar: '', balance: 'text-slate-500' },
  warning: { bar: 'border-l-4 border-amber-400', balance: 'text-amber-600 font-semibold' },
  critical: { bar: 'border-l-4 border-red-500', balance: 'text-red-600 font-bold' },
}

export default function TimelinePage() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Timeline Financeira</h1>
        <p className="text-xs text-slate-400 mb-5">Próximos 90 dias</p>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            {/* Current balance card */}
            <div className="bg-white rounded-2xl p-5 mb-6 shadow-sm">
              <p className="text-xs text-slate-500 mb-1">Saldo disponível agora</p>
              <p className={`text-2xl font-bold ${data.current_balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                {formatCurrency(data.current_balance)}
              </p>
            </div>

            {data.events.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm">
                Nenhum evento financeiro nos próximos 90 dias.
              </div>
            ) : (
              <div className="relative">
                {/* Vertical line */}
                <div className="absolute left-5 top-0 bottom-0 w-px bg-slate-200" />

                <div className="space-y-0">
                  {data.events.map((ev, i) => {
                    const c = TYPE_COLORS[ev.type]
                    const a = ALERT_STYLES[ev.alert]

                    return (
                      <div key={i} className="relative flex gap-4 pb-5">
                        {/* Dot */}
                        <div className={`relative z-10 flex-shrink-0 w-10 h-10 rounded-full ${c.dot} ring-4 ${c.ring} flex items-center justify-center`}>
                          {ev.type === 'receita' && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                            </svg>
                          )}
                          {ev.type === 'despesa' && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                            </svg>
                          )}
                          {ev.type === 'imposto' && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 14l2 2 4-4m-7 4h8a2 2 0 002-2V8a2 2 0 00-2-2H7a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                          )}
                        </div>

                        {/* Card */}
                        <div className={`flex-1 bg-white rounded-2xl p-4 shadow-sm ${a.bar} ${ev.alert === 'critical' ? 'bg-red-50' : ev.alert === 'warning' ? 'bg-amber-50' : ''}`}>
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.badge}`}>{c.label}</span>
                                {ev.alert === 'critical' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-red-100 text-red-700">Saldo negativo</span>
                                )}
                                {ev.alert === 'warning' && (
                                  <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-amber-100 text-amber-700">Saldo baixo</span>
                                )}
                              </div>
                              <p className="text-sm font-semibold text-slate-800 truncate">{ev.description}</p>
                              {ev.subtitle && (
                                <p className="text-xs text-slate-400 truncate">{ev.subtitle}</p>
                              )}
                              <p className="text-xs text-slate-400 mt-1">{formatDate(ev.date)}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className={`text-sm font-bold ${c.amount}`}>
                                {ev.amount > 0 ? '+' : ''}{formatCurrency(ev.amount)}
                              </p>
                              <p className={`text-xs mt-0.5 ${a.balance}`}>
                                saldo: {formatCurrency(ev.running_balance)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* End marker */}
                <div className="flex gap-4 items-center">
                  <div className="flex-shrink-0 w-10 flex justify-center">
                    <div className="w-3 h-3 rounded-full bg-slate-300" />
                  </div>
                  <p className="text-xs text-slate-400">Fim da projeção (90 dias)</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
