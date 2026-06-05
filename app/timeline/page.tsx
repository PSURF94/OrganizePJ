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
  receita: { color: '#10b981', bg: 'rgba(16,185,129,0.15)', label: 'Entrada',  icon: TrendingUp,   sign: '+' },
  despesa: { color: '#E50914', bg: 'rgba(229,9,20,0.15)',   label: 'Despesa',  icon: TrendingDown, sign: '−' },
  imposto: { color: '#d97706', bg: 'rgba(217,119,6,0.15)',  label: 'Imposto',  icon: Receipt,      sign: '−' },
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
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: '#1A1A1D', opacity: 0.3 }} />
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            {/* ── Saldo disponível — hero ── */}
            <div className="px-4 mb-6">
              <div style={{
                background: '#1A1A1D',
                borderRadius: 20,
                padding: '24px 28px',
                border: '1px solid rgba(255,255,255,0.07)',
              }}>
                <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 12, letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 8 }}>
                  Saldo disponível agora
                </p>
                <p style={{
                  fontFamily: 'var(--font-poppins, sans-serif)',
                  fontSize: 42,
                  fontWeight: 800,
                  color: data.current_balance >= 0 ? '#FF8A00' : '#E50914',
                  lineHeight: 1,
                  letterSpacing: '-1px',
                }}>
                  {formatCurrency(data.current_balance)}
                </p>
                {data.current_balance < 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <AlertTriangle size={13} color="#E50914" />
                    <p style={{ color: '#E50914', fontSize: 12, fontWeight: 600 }}>Saldo negativo — atenção ao fluxo</p>
                  </div>
                )}
              </div>
            </div>

            {data.events.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm px-4">
                Nenhum evento financeiro nos próximos 90 dias.
              </div>
            ) : (
              <>
                {/* Legenda */}
                <div className="px-4 mb-5 flex gap-5">
                  {Object.entries(TYPE).map(([, t]) => (
                    <div key={t.label} className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, boxShadow: `0 0 6px ${t.color}` }} />
                      <span style={{ color: '#94a3b8', fontSize: 12 }}>{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Timeline — fundo escuro ── */}
                <div style={{ background: '#1A1A1D', marginBottom: selected !== null ? 0 : 0 }}>
                  <div
                    ref={scrollRef}
                    className="overflow-x-auto"
                    style={{ WebkitOverflowScrolling: 'touch', paddingBottom: 28, paddingTop: 24 }}
                  >
                    <div
                      className="flex items-end px-6"
                      style={{ minWidth: `${Math.max(data.events.length * 160 + 80, 400)}px` }}
                    >
                      {data.events.map((ev, i) => {
                        const t = TYPE[ev.type]
                        const Icon = t.icon
                        const isSelected = selected === i
                        const nextEv = data.events[i + 1]
                        const balColor = ev.running_balance < 0 ? '#E50914'
                          : ev.alert === 'warning' ? '#d97706' : 'rgba(255,255,255,0.3)'

                        return (
                          <div key={i} className="flex items-end flex-shrink-0" style={{ width: 160 }}>
                            <div className="flex flex-col items-center w-full">

                              {/* Card */}
                              <button
                                onClick={() => setSelected(isSelected ? null : i)}
                                className="w-36 text-left transition-all duration-200"
                                style={{
                                  background: isSelected
                                    ? t.bg
                                    : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${isSelected ? t.color : 'rgba(255,255,255,0.08)'}`,
                                  borderRadius: 16,
                                  padding: '12px 14px',
                                  marginBottom: 14,
                                  boxShadow: isSelected ? `0 0 20px ${t.color}30` : 'none',
                                  transform: isSelected ? 'translateY(-6px)' : 'none',
                                }}
                              >
                                <div className="flex items-center gap-1.5 mb-2.5">
                                  <Icon size={12} color={t.color} strokeWidth={2.5} />
                                  <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: t.color }}>
                                    {t.label}
                                  </span>
                                </div>
                                <p style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.85)', lineHeight: 1.35, marginBottom: 8 }}
                                  className="line-clamp-2">
                                  {ev.description}
                                </p>
                                <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 16, fontWeight: 700, color: t.color }}>
                                  {t.sign}{formatCurrency(Math.abs(ev.amount))}
                                </p>
                                <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>
                                  {formatDateShort(ev.date)}
                                </p>
                              </button>

                              {/* Conector vertical */}
                              <div style={{ width: 2, height: 18, background: t.color, opacity: 0.6 }} />

                              {/* Dot brilhante */}
                              <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: '50%',
                                background: t.color,
                                boxShadow: `0 0 10px ${t.color}, 0 0 20px ${t.color}60`,
                                border: '2.5px solid #1A1A1D',
                                zIndex: 10,
                                flexShrink: 0,
                              }} />

                              {/* Linha horizontal */}
                              <div className="flex w-full items-center" style={{ height: 4 }}>
                                <div style={{
                                  flex: 1,
                                  height: 3,
                                  background: ev.running_balance < 0
                                    ? '#E50914'
                                    : ev.alert === 'warning'
                                    ? '#d97706'
                                    : 'rgba(255,255,255,0.12)',
                                  borderRadius: 3,
                                }} />
                                {!nextEv && (
                                  <div style={{ width: 20, height: 3, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }} />
                                )}
                              </div>

                              {/* Saldo projetado */}
                              <div className="mt-3 text-center">
                                <p style={{
                                  fontFamily: 'var(--font-poppins, sans-serif)',
                                  fontSize: 13,
                                  fontWeight: 700,
                                  color: balColor,
                                }}>
                                  {formatCurrency(ev.running_balance)}
                                </p>
                                {ev.alert !== 'ok' && (
                                  <div className="flex items-center justify-center gap-1 mt-0.5">
                                    <AlertTriangle size={9} color={balColor} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: balColor }}>
                                      {ev.alert === 'critical' ? 'negativo' : 'baixo'}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        )
                      })}

                      {/* Fim */}
                      <div className="flex flex-col items-center flex-shrink-0 pb-10" style={{ width: 32 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', marginBottom: 4 }} />
                        <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>90d</p>
                      </div>
                    </div>
                  </div>

                  {/* ── Detalhe selecionado ── */}
                  {selected !== null && (
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', padding: '20px 24px' }}>
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          {(() => {
                            const t = TYPE[data.events[selected].type]
                            const Icon = t.icon
                            return (
                              <>
                                <div className="flex items-center gap-2 mb-3">
                                  <div style={{ width: 26, height: 26, borderRadius: 8, background: t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Icon size={14} color={t.color} strokeWidth={2.2} />
                                  </div>
                                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: t.color }}>
                                    {t.label} · {formatDateShort(data.events[selected].date)}
                                  </span>
                                </div>
                                <p style={{ color: 'white', fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                                  {data.events[selected].description}
                                </p>
                                {data.events[selected].subtitle && (
                                  <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 13 }}>
                                    {data.events[selected].subtitle}
                                  </p>
                                )}
                              </>
                            )
                          })()}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p style={{
                            fontFamily: 'var(--font-poppins, sans-serif)',
                            fontSize: 22,
                            fontWeight: 800,
                            color: TYPE[data.events[selected].type].color,
                          }}>
                            {TYPE[data.events[selected].type].sign}
                            {formatCurrency(Math.abs(data.events[selected].amount))}
                          </p>
                          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                            saldo após:{' '}
                            <span style={{
                              color: data.events[selected].running_balance < 0 ? '#E50914' : '#FF8A00',
                              fontWeight: 700,
                            }}>
                              {formatCurrency(data.events[selected].running_balance)}
                            </span>
                          </p>
                          <button
                            onClick={() => setSelected(null)}
                            className="flex items-center gap-1 mt-3 ml-auto transition-colors"
                            style={{ color: 'rgba(255,255,255,0.2)', fontSize: 12 }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.5)' }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.2)' }}
                          >
                            <X size={12} /> fechar
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
