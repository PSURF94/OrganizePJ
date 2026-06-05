'use client'
import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown, Receipt, X } from 'lucide-react'

interface TimelineEvent {
  id?: string
  date: string
  type: 'receita' | 'despesa' | 'imposto'
  description: string
  subtitle: string | null
  amount: number
  display_amount?: number
  status?: string
  running_balance: number
  alert: 'ok' | 'warning' | 'critical'
}

interface DayGroup {
  date: string
  events: TimelineEvent[]
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
  receita: { color: '#10b981', bg: 'rgba(16,185,129,0.15)',  label: 'Entrada', icon: TrendingUp,  sign: '+' },
  despesa: { color: '#E50914', bg: 'rgba(229,9,20,0.15)',    label: 'Despesa', icon: TrendingDown, sign: '−' },
  imposto: { color: '#d97706', bg: 'rgba(217,119,6,0.15)',   label: 'Imposto', icon: Receipt,      sign: '−' },
}

const DARK = '#1c1917'

function groupByDate(events: TimelineEvent[]): DayGroup[] {
  const map = new Map<string, TimelineEvent[]>()
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, [])
    map.get(ev.date)!.push(ev)
  }
  return Array.from(map.entries()).map(([date, evs]) => ({ date, events: evs }))
}

export default function TimelinePage() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<{ gi: number; ei: number } | null>(null)
  const [expandedGroups, setExpandedGroups] = useState<Record<number, boolean>>({})
  const [actionLoading, setActionLoading] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  function toggleExpand(gi: number) {
    setExpandedGroups(prev => ({ ...prev, [gi]: !prev[gi] }))
  }

  async function reload() {
    const r = await fetch('/api/timeline')
    const d = await r.json()
    setData(d)
  }

  async function handleMarkReceived(id: string) {
    setActionLoading(true)
    const today = new Date().toISOString().split('T')[0]
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: today }),
    })
    setSelected(null)
    await reload()
    setActionLoading(false)
  }

  async function handleUnmarkReceived(id: string) {
    setActionLoading(true)
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: null }),
    })
    setSelected(null)
    await reload()
    setActionLoading(false)
  }

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  const dayGroups: DayGroup[] = data ? groupByDate(data.events) : []

  function selectEvent(gi: number, ei: number) {
    if (selected?.gi === gi && selected?.ei === ei) {
      setSelected(null)
    } else {
      setSelected({ gi, ei })
    }
  }

  return (
    <AppShell>
      <div className="pt-6 pb-12">

        {/* Header */}
        <div className="px-4 mb-5">
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22, color: '#1A1A1D', letterSpacing: '-0.3px', paddingLeft: 11, borderLeft: '3px solid #FF8A00' }}>
            Timeline
          </h1>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Projeção dos próximos 90 dias</p>
        </div>

        {loading ? (
          <div className="px-4 space-y-3">
            {[1, 2].map(i => (
              <div key={i} className="rounded-2xl h-24 animate-pulse" style={{ background: DARK, opacity: 0.25 }} />
            ))}
          </div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            {/* ── Saldo — hero ── */}
            <div className="px-4 mb-5">
              <div style={{ background: DARK, borderRadius: 20, padding: '22px 26px', border: '1px solid rgba(255,255,255,0.06)' }}>
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                  Saldo disponível agora
                </p>
                <p style={{
                  fontFamily: 'var(--font-poppins, sans-serif)',
                  fontSize: 44,
                  fontWeight: 800,
                  lineHeight: 1,
                  letterSpacing: '-1.5px',
                  color: data.current_balance >= 0 ? '#FF8A00' : '#E50914',
                }}>
                  {formatCurrency(data.current_balance)}
                </p>
                {data.current_balance < 0 && (
                  <div className="flex items-center gap-1.5 mt-3">
                    <AlertTriangle size={12} color="#E50914" />
                    <p style={{ color: '#E50914', fontSize: 12, fontWeight: 600 }}>Saldo negativo — atenção ao fluxo</p>
                  </div>
                )}
              </div>
            </div>

            {data.events.length === 0 ? (
              <div className="text-center py-16 px-4" style={{ color: '#94a3b8', fontSize: 14 }}>
                Nenhum evento financeiro nos próximos 90 dias.
              </div>
            ) : (
              <>
                {/* Legenda */}
                <div className="px-4 mb-4 flex gap-5">
                  {Object.values(TYPE).map((t) => (
                    <div key={t.label} className="flex items-center gap-2">
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, boxShadow: `0 0 5px ${t.color}` }} />
                      <span style={{ fontSize: 11, color: '#94a3b8' }}>{t.label}</span>
                    </div>
                  ))}
                </div>

                {/* ── Área da timeline ── */}
                <div style={{ background: DARK }}>
                  <div
                    ref={scrollRef}
                    className="overflow-x-auto"
                    style={{ WebkitOverflowScrolling: 'touch', paddingTop: 28, paddingBottom: 24 }}
                  >
                    <div
                      className="flex items-end px-6"
                      style={{ minWidth: `${Math.max(dayGroups.length * 164 + 60, 400)}px` }}
                    >
                      {dayGroups.map((group, gi) => {
                        const lastEv = group.events[group.events.length - 1]
                        const nextGroup = dayGroups[gi + 1]
                        const balColor =
                          lastEv.running_balance > 0 ? '#10b981' :
                          lastEv.running_balance < 0 ? '#E50914' :
                          'rgba(255,255,255,0.35)'
                        const isAnySelected = selected?.gi === gi

                        if (group.events.length === 1) {
                          // ── Card simples (1 evento) ── mesmo comportamento original
                          const ev = group.events[0]
                          const t = TYPE[ev.type]
                          const Icon = t.icon
                          const isSelected = selected?.gi === gi && selected?.ei === 0

                          return (
                            <div key={gi} className="flex items-end flex-shrink-0" style={{ width: 164 }}>
                              <div className="flex flex-col items-center w-full">
                                <button
                                  onClick={() => selectEvent(gi, 0)}
                                  style={{
                                    width: 144, height: 190,
                                    textAlign: 'left',
                                    display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                                    background: ev.status === 'recebido' ? 'rgba(16,185,129,0.06)' : isSelected ? t.bg : 'rgba(255,255,255,0.05)',
                                    border: `1px solid ${ev.status === 'recebido' ? 'rgba(16,185,129,0.2)' : isSelected ? t.color : 'rgba(255,255,255,0.08)'}`,
                                    borderTop: `3px solid ${ev.status === 'recebido' ? '#10b981' : t.color}`,
                                    borderRadius: 16,
                                    padding: '12px 13px',
                                    marginBottom: 14,
                                    overflow: 'hidden',
                                    opacity: ev.status === 'recebido' ? 0.7 : 1,
                                    boxShadow: isSelected ? `0 0 24px ${t.color}28` : 'none',
                                    transform: isSelected ? 'translateY(-6px)' : 'none',
                                    transition: 'all 0.2s ease',
                                    cursor: 'pointer', flexShrink: 0,
                                  }}
                                >
                                  <div className="flex items-center gap-1.5">
                                    <Icon size={11} color={ev.status === 'recebido' ? '#10b981' : t.color} strokeWidth={2.5} />
                                    <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: ev.status === 'recebido' ? '#10b981' : t.color }}>
                                      {ev.status === 'recebido' ? '✓ Recebido' : t.label}
                                    </span>
                                  </div>
                                  <p style={{
                                    fontSize: 11, fontWeight: 600,
                                    color: isSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.75)',
                                    lineHeight: 1.35, overflow: 'hidden',
                                    display: '-webkit-box', WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical' as const,
                                    flex: 1, margin: '8px 0',
                                  }}>
                                    {ev.description}
                                  </p>
                                  <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', gap: 4 }}>
                                    <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 15, fontWeight: 700, color: ev.status === 'recebido' ? '#10b981' : t.color, lineHeight: 1 }}>
                                      {t.sign}{formatCurrency(ev.display_amount ?? Math.abs(ev.amount))}
                                    </p>
                                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)', flexShrink: 0 }}>
                                      {formatDateShort(ev.date)}
                                    </p>
                                  </div>
                                </button>

                                <div style={{ width: 2, height: 16, background: ev.status === 'recebido' ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)' }} />
                                <div style={{
                                  width: 13, height: 13, borderRadius: '50%',
                                  background: ev.status === 'recebido' ? 'transparent' : balColor,
                                  border: ev.status === 'recebido' ? '2px solid rgba(16,185,129,0.25)' : `2.5px solid ${DARK}`,
                                  zIndex: 10, flexShrink: 0,
                                }} />
                                <div style={{ display: 'flex', width: '100%', height: 3, alignItems: 'center' }}>
                                  <div style={{
                                    flex: 1, height: 3,
                                    background: lastEv.running_balance < 0 ? '#E50914' : lastEv.alert === 'warning' ? '#d97706' : 'rgba(255,255,255,0.1)',
                                    borderRadius: 3,
                                  }} />
                                  {!nextGroup && (
                                    <div style={{ width: 20, height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
                                  )}
                                </div>
                                {ev.status === 'recebido' ? (
                                  <div style={{ marginTop: 10, height: 14 }} />
                                ) : (
                                  <div style={{ marginTop: 10, textAlign: 'center' }}>
                                    <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 12, fontWeight: 700, color: balColor, lineHeight: 1 }}>
                                      {formatCurrency(lastEv.running_balance)}
                                    </p>
                                    {lastEv.alert !== 'ok' && (
                                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 3 }}>
                                        <AlertTriangle size={9} color={balColor} />
                                        <span style={{ fontSize: 9, fontWeight: 700, color: balColor }}>
                                          {lastEv.alert === 'critical' ? 'negativo' : 'baixo'}
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          )
                        }

                        // ── Card agrupado — mini cards com friso colorido individual ──
                        const isExpanded = !!expandedGroups[gi]
                        const visibleCount = isExpanded ? group.events.length : Math.min(2, group.events.length)
                        const hiddenCount = group.events.length - visibleCount
                        const dotColor = lastEv.running_balance < 0 ? '#E50914'
                          : lastEv.alert === 'warning' ? '#d97706'
                          : TYPE[lastEv.type].color

                        return (
                          <div key={gi} className="flex items-end flex-shrink-0" style={{ width: 164 }}>
                            <div className="flex flex-col items-center w-full">

                              {/* Stacked mini cards */}
                              <div style={{
                                width: 144,
                                height: 190,
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 5,
                                marginBottom: 14,
                                flexShrink: 0,
                                overflow: 'hidden',
                              }}>
                                {group.events.slice(0, visibleCount).map((ev, ei) => {
                                  const t = TYPE[ev.type]
                                  const Icon = t.icon
                                  const isThisSelected = selected?.gi === gi && selected?.ei === ei
                                  return (
                                    <button
                                      key={ei}
                                      onClick={() => selectEvent(gi, ei)}
                                      style={{
                                          height: 76,
                                        flexShrink: 0,
                                        textAlign: 'left',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'space-between',
                                        background: isThisSelected ? t.bg : 'rgba(255,255,255,0.05)',
                                        border: `1px solid ${isThisSelected ? t.color : 'rgba(255,255,255,0.08)'}`,
                                        borderTop: `3px solid ${t.color}`,
                                        borderRadius: 10,
                                        padding: '6px 10px',
                                        overflow: 'hidden',
                                        boxShadow: isThisSelected ? `0 0 20px ${t.color}28` : 'none',
                                        transform: isThisSelected ? 'translateY(-2px)' : 'none',
                                        transition: 'all 0.15s ease',
                                        cursor: 'pointer',
                                      }}
                                    >
                                      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                        <Icon size={9} color={ev.status === 'recebido' ? '#10b981' : t.color} strokeWidth={2.5} />
                                        <span style={{ fontSize: 8, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: ev.status === 'recebido' ? '#10b981' : t.color }}>
                                          {ev.status === 'recebido' ? '✓ Recebido' : t.label}
                                        </span>
                                      </div>
                                      <p style={{
                                        fontSize: 10, fontWeight: 600,
                                        color: isThisSelected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.72)',
                                        overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
                                        flex: 1, margin: '3px 0',
                                      }}>
                                        {ev.description}
                                      </p>
                                      <p style={{
                                        fontFamily: 'var(--font-poppins, sans-serif)',
                                        fontSize: 11, fontWeight: 700, color: ev.status === 'recebido' ? '#10b981' : t.color, lineHeight: 1,
                                      }}>
                                        {t.sign}{formatCurrency(ev.display_amount ?? Math.abs(ev.amount))}
                                      </p>
                                    </button>
                                  )
                                })}

                                {hiddenCount > 0 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(gi) }}
                                    style={{ height: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 700, color: '#FF8A00', background: 'rgba(255,138,0,0.08)', border: '1px solid rgba(255,138,0,0.15)', borderRadius: 6, cursor: 'pointer' }}>
                                    + {hiddenCount} mais
                                  </button>
                                )}
                                {isExpanded && hiddenCount === 0 && group.events.length > 2 && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); toggleExpand(gi) }}
                                    style={{ height: 20, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 9, fontWeight: 700, color: 'rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, cursor: 'pointer' }}>
                                    ver menos
                                  </button>
                                )}
                              </div>

                              {/* Conector + dot + linha */}
                              <div style={{ width: 2, height: 16, background: 'rgba(255,255,255,0.12)' }} />
                              <div style={{
                                width: 13, height: 13, borderRadius: '50%',
                                background: balColor,
                                border: `2.5px solid ${DARK}`, zIndex: 10, flexShrink: 0,
                              }} />
                              <div style={{ display: 'flex', width: '100%', height: 3, alignItems: 'center' }}>
                                <div style={{
                                  flex: 1, height: 3,
                                  background: lastEv.running_balance < 0 ? '#E50914' : lastEv.alert === 'warning' ? '#d97706' : 'rgba(255,255,255,0.1)',
                                  borderRadius: 3,
                                }} />
                                {!nextGroup && (
                                  <div style={{ width: 20, height: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 3 }} />
                                )}
                              </div>

                              <div style={{ marginTop: 10, textAlign: 'center' }}>
                                <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', marginBottom: 2 }}>
                                  {formatDateShort(group.date)} · {group.events.length} eventos
                                </p>
                                <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 12, fontWeight: 700, color: balColor, lineHeight: 1 }}>
                                  {formatCurrency(lastEv.running_balance)}
                                </p>
                                {lastEv.alert !== 'ok' && (
                                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 3, marginTop: 3 }}>
                                    <AlertTriangle size={9} color={balColor} />
                                    <span style={{ fontSize: 9, fontWeight: 700, color: balColor }}>
                                      {lastEv.alert === 'critical' ? 'negativo' : 'baixo'}
                                    </span>
                                  </div>
                                )}
                              </div>

                            </div>
                          </div>
                        )
                      })}

                      {/* Marcador de fim — paddingBottom alinha o dot com o centro dos dots da timeline */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', flexShrink: 0, width: 24, paddingBottom: 34 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'rgba(255,255,255,0.12)' }} />
                      </div>
                    </div>
                  </div>

                  {/* ── Detalhe do evento selecionado ── */}
                  {selected !== null && (() => {
                    const ev = dayGroups[selected.gi]?.events[selected.ei]
                    if (!ev) return null
                    const t = TYPE[ev.type]
                    const Icon = t.icon
                    const group = dayGroups[selected.gi]
                    const displayAmt = ev.display_amount ?? Math.abs(ev.amount)
                    const isRecebido = ev.status === 'recebido'
                    return (
                      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 24px' }}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-3">
                              <div style={{ width: 26, height: 26, borderRadius: 8, background: isRecebido ? 'rgba(16,185,129,0.15)' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon size={13} color={isRecebido ? '#10b981' : t.color} strokeWidth={2.2} />
                              </div>
                              <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isRecebido ? '#10b981' : t.color }}>
                                {isRecebido ? '✓ Recebido' : t.label} · {formatDateShort(ev.date)}
                                {group.events.length > 1 && (
                                  <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400, textTransform: 'none' }}>
                                    {' '}· evento {selected.ei + 1}/{group.events.length}
                                  </span>
                                )}
                              </span>
                            </div>
                            <p style={{ color: 'white', fontWeight: 600, fontSize: 14, marginBottom: 4, lineHeight: 1.4 }}>
                              {ev.description}
                            </p>
                            {ev.subtitle && (
                              <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{ev.subtitle}</p>
                            )}

                            {/* Action buttons */}
                            {ev.type === 'receita' && ev.id && (
                              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                                {!isRecebido ? (
                                  <button
                                    onClick={() => handleMarkReceived(ev.id!)}
                                    disabled={actionLoading}
                                    style={{ fontSize: 11, fontWeight: 700, color: '#10b981', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 8, padding: '6px 12px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
                                    {actionLoading ? 'Salvando…' : '✓ Marcar como recebido'}
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleUnmarkReceived(ev.id!)}
                                    disabled={actionLoading}
                                    style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1 }}>
                                    {actionLoading ? 'Salvando…' : '↩ Desfazer recebimento'}
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                          <div style={{ textAlign: 'right', flexShrink: 0 }}>
                            <p style={{
                              fontFamily: 'var(--font-poppins, sans-serif)',
                              fontSize: 22, fontWeight: 800, color: isRecebido ? '#10b981' : t.color, lineHeight: 1,
                              opacity: isRecebido ? 0.6 : 1,
                            }}>
                              {t.sign}{formatCurrency(displayAmt)}
                            </p>
                            {isRecebido ? (
                              <p style={{ fontSize: 10, color: '#10b981', marginTop: 4, opacity: 0.7 }}>já no saldo</p>
                            ) : (
                              <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>
                                saldo após:{' '}
                                <span style={{ color: ev.running_balance < 0 ? '#E50914' : '#FF8A00', fontWeight: 700 }}>
                                  {formatCurrency(ev.running_balance)}
                                </span>
                              </p>
                            )}
                            <button
                              onClick={() => setSelected(null)}
                              className="flex items-center gap-1 mt-3 ml-auto transition-colors"
                              style={{ color: 'rgba(255,255,255,0.18)', fontSize: 11 }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.45)' }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.18)' }}
                            >
                              <X size={11} /> fechar
                            </button>
                          </div>
                        </div>
                      </div>
                    )
                  })()}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
