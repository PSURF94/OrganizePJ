'use client'
import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown, Receipt, X } from 'lucide-react'

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

function formatDateShort(iso: string) {
  const [year, month, day] = iso.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const TYPE = {
  receita: {
    color: '#10b981',
    bg: 'rgba(16,185,129,0.1)',
    label: 'Entrada',
    icon: TrendingUp,
    sign: '+',
    line: '#10b981',
  },
  despesa: {
    color: '#E50914',
    bg: 'rgba(229,9,20,0.08)',
    label: 'Despesa',
    icon: TrendingDown,
    sign: '−',
    line: '#E50914',
  },
  imposto: {
    color: '#d97706',
    bg: 'rgba(217,119,6,0.1)',
    label: 'Imposto',
    icon: Receipt,
    sign: '−',
    line: '#d97706',
  },
}

export default function TimelinePage() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  return (
    <AppShell>
      <div className="pt-6 pb-12">

        {/* Header */}
        <div className="px-4 mb-5">
          <h1 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 700, fontSize: 22, color: '#1A1A1D' }}>
            Timeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Projeção dos próximos 90 dias</p>
        </div>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1,2].map(i => (
              <div key={i} className="bg-white rounded-2xl h-20 animate-pulse" style={{ opacity: 0.5 }} />
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            {/* Saldo atual */}
            <div className="px-4 mb-6">
              <div className="bg-white rounded-2xl p-5" style={{ border: '1px solid #eef0f3', borderLeft: `4px solid ${data.current_balance >= 0 ? '#FF8A00' : '#E50914'}` }}>
                <p className="text-xs text-slate-400 mb-1">Saldo disponível agora</p>
                <p style={{
                  fontFamily: 'var(--font-poppins, sans-serif)',
                  fontSize: 28,
                  fontWeight: 700,
                  color: data.current_balance >= 0 ? '#1A1A1D' : '#E50914',
                }}>
                  {formatCurrency(data.current_balance)}
                </p>
              </div>
            </div>

            {data.events.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm px-4">
                Nenhum evento financeiro nos próximos 90 dias.
              </div>
            ) : (
              <>
                {/* Legenda */}
                <div className="px-4 mb-4 flex gap-4">
                  {Object.entries(TYPE).map(([key, t]) => (
                    <div key={key} className="flex items-center gap-1.5">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color }} />
                      <span className="text-xs text-slate-400">{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* Timeline horizontal */}
                <div
                  ref={scrollRef}
                  className="overflow-x-auto pb-4"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div
                    className="flex items-end px-4"
                    style={{ minWidth: `${Math.max(data.events.length * 148 + 80, 400)}px` }}
                  >
                    {data.events.map((ev, i) => {
                      const t = TYPE[ev.type]
                      const Icon = t.icon
                      const isSelected = selected === i
                      const nextEv = data.events[i + 1]
                      const balanceColor = ev.running_balance < 0
                        ? '#E50914'
                        : ev.alert === 'warning' ? '#d97706' : '#94a3b8'

                      return (
                        <div key={i} className="flex items-end flex-shrink-0" style={{ width: 148 }}>
                          <div className="flex flex-col items-center w-full">

                            {/* Event card */}
                            <button
                              onClick={() => setSelected(isSelected ? null : i)}
                              className="w-32 text-left transition-all duration-200"
                              style={{
                                background: isSelected ? '#1A1A1D' : 'white',
                                border: `1px solid ${isSelected ? '#1A1A1D' : '#eef0f3'}`,
                                borderTop: `3px solid ${t.color}`,
                                borderRadius: 14,
                                padding: '10px 12px',
                                marginBottom: 10,
                                boxShadow: isSelected ? '0 8px 24px rgba(0,0,0,0.18)' : '0 1px 4px rgba(0,0,0,0.06)',
                                transform: isSelected ? 'translateY(-4px)' : 'none',
                              }}
                            >
                              {/* Type badge */}
                              <div className="flex items-center gap-1.5 mb-2">
                                <div style={{ width: 20, height: 20, borderRadius: 6, background: isSelected ? 'rgba(255,255,255,0.08)' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon size={11} color={isSelected ? t.color : t.color} strokeWidth={2.2} />
                                </div>
                                <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: isSelected ? t.color : t.color }}>
                                  {t.label}
                                </span>
                              </div>

                              {/* Description */}
                              <p style={{ fontSize: 11, fontWeight: 600, color: isSelected ? 'white' : '#1e293b', lineHeight: 1.3, marginBottom: 6 }}
                                className="line-clamp-2">
                                {ev.description}
                              </p>

                              {/* Amount */}
                              <p style={{ fontSize: 14, fontWeight: 700, color: t.color, fontFamily: 'var(--font-poppins, sans-serif)' }}>
                                {t.sign}{formatCurrency(Math.abs(ev.amount))}
                              </p>

                              {/* Date */}
                              <p style={{ fontSize: 10, color: isSelected ? 'rgba(255,255,255,0.35)' : '#94a3b8', marginTop: 3 }}>
                                {formatDateShort(ev.date)}
                              </p>
                            </button>

                            {/* Vertical connector */}
                            <div style={{ width: 1.5, height: 20, background: t.color, opacity: 0.5 }} />

                            {/* Dot on line */}
                            <div style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: t.color,
                              border: '2.5px solid #F6F6F6',
                              boxShadow: `0 0 0 1.5px ${t.color}`,
                              zIndex: 10,
                              flexShrink: 0,
                            }} />

                            {/* Horizontal line to next event */}
                            <div className="flex w-full items-center" style={{ height: 3 }}>
                              <div style={{
                                flex: 1,
                                height: 2,
                                background: ev.running_balance < 0 ? '#E50914' : ev.alert === 'warning' ? '#d97706' : '#e2e8f0',
                                borderRadius: 2,
                              }} />
                              {!nextEv && (
                                <div style={{ width: 16, height: 2, background: '#e2e8f0', borderRadius: 2 }} />
                              )}
                            </div>

                            {/* Running balance */}
                            <div className="mt-2 text-center">
                              <p style={{ fontSize: 11, fontWeight: 600, color: balanceColor, fontFamily: 'var(--font-poppins, sans-serif)' }}>
                                {formatCurrency(ev.running_balance)}
                              </p>
                              {ev.alert !== 'ok' && (
                                <div className="flex items-center justify-center gap-1 mt-0.5">
                                  <AlertTriangle size={9} color={balanceColor} />
                                  <span style={{ fontSize: 9, fontWeight: 700, color: balanceColor }}>
                                    {ev.alert === 'critical' ? 'negativo' : 'baixo'}
                                  </span>
                                </div>
                              )}
                            </div>

                          </div>
                        </div>
                      )
                    })}

                    {/* End marker */}
                    <div className="flex flex-col items-center flex-shrink-0 pb-8" style={{ width: 32 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#e2e8f0', marginBottom: 4 }} />
                      <p style={{ fontSize: 9, color: '#cbd5e1', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>90d</p>
                    </div>
                  </div>
                </div>

                {/* Detail panel for selected event */}
                {selected !== null && (
                  <div className="px-4 mt-2">
                    <div
                      className="rounded-2xl overflow-hidden"
                      style={{ background: '#1A1A1D', border: '1px solid rgba(255,255,255,0.07)' }}
                    >
                      <div className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              {(() => {
                                const t = TYPE[data.events[selected].type]
                                const Icon = t.icon
                                return (
                                  <>
                                    <div style={{ width: 24, height: 24, borderRadius: 7, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                      <Icon size={13} color={t.color} strokeWidth={2.2} />
                                    </div>
                                    <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.color }}>
                                      {t.label} · {formatDateShort(data.events[selected].date)}
                                    </span>
                                  </>
                                )
                              })()}
                            </div>
                            <p className="text-sm font-semibold text-white mb-0.5">
                              {data.events[selected].description}
                            </p>
                            {data.events[selected].subtitle && (
                              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                {data.events[selected].subtitle}
                              </p>
                            )}
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p style={{
                              fontFamily: 'var(--font-poppins, sans-serif)',
                              fontSize: 18,
                              fontWeight: 700,
                              color: TYPE[data.events[selected].type].color,
                            }}>
                              {TYPE[data.events[selected].type].sign}
                              {formatCurrency(Math.abs(data.events[selected].amount))}
                            </p>
                            <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              saldo após:{' '}
                              <span style={{ color: data.events[selected].running_balance < 0 ? '#E50914' : '#FF8A00', fontWeight: 600 }}>
                                {formatCurrency(data.events[selected].running_balance)}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelected(null)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors"
                        style={{ color: 'rgba(255,255,255,0.25)', borderTop: '1px solid rgba(255,255,255,0.06)' }}
                        onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
                      >
                        <X size={12} /> fechar
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
