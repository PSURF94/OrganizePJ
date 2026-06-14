'use client'
import { useEffect, useState, useMemo } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, Receipt, AlertTriangle } from 'lucide-react'

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

interface DayGroup { date: string; events: TimelineEvent[] }
interface TimelineData { current_balance: number; events: TimelineEvent[] }

interface MonthBar {
  prefix: string
  label: string
  received: number
  pending: number
  outgoing: number
}

const TYPE = {
  receita: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', label: 'Entrada',  icon: TrendingUp,   sign: '+' },
  despesa: { color: '#E50914', bg: 'rgba(229,9,20,0.10)',   label: 'Despesa',  icon: TrendingDown,  sign: '−' },
  imposto: { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  label: 'Imposto',  icon: Receipt,       sign: '−' },
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')
  return { weekday, day: String(d).padStart(2, '0'), month: String(m).padStart(2, '0') }
}

function monthLabel(prefix: string) {
  const [y, m] = prefix.split('-').map(Number)
  const date = new Date(y, m - 1, 1)
  const name = date.toLocaleDateString('pt-BR', { month: 'long' })
  return name.charAt(0).toUpperCase() + name.slice(1) + ' ' + y
}

function groupByDate(events: TimelineEvent[]): DayGroup[] {
  const map = new Map<string, TimelineEvent[]>()
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, [])
    map.get(ev.date)!.push(ev)
  }
  return Array.from(map.entries()).map(([date, evs]) => ({ date, events: evs }))
}

function Bar({ value, max, color, opacity = 1 }: { value: number; max: number; color: string; opacity?: number }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
      <div style={{
        width: `${pct}%`, height: '100%', borderRadius: 4,
        background: color, opacity,
        transition: 'width 0.4s ease',
        minWidth: pct > 0 ? 4 : 0,
      }} />
    </div>
  )
}

export default function TimelinePage() {
  const [data, setData]         = useState<TimelineData | null>(null)
  const [loading, setLoading]   = useState(true)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [actionLoading, setAL]  = useState(false)

  async function reload() {
    const r = await fetch('/api/timeline')
    setData(await r.json())
  }

  useEffect(() => {
    fetch('/api/timeline').then(r => r.json()).then(d => { setData(d); setLoading(false) })
  }, [])

  async function handleMarkReceived(id: string) {
    setAL(true)
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: new Date().toISOString().split('T')[0] }),
    })
    setExpanded(null); await reload(); setAL(false)
  }

  async function handleUnmarkReceived(id: string) {
    setAL(true)
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: null }),
    })
    setExpanded(null); await reload(); setAL(false)
  }

  const dayGroups = data ? groupByDate(data.events) : []

  const monthBars = useMemo<MonthBar[]>(() => {
    if (!data) return []
    const map = new Map<string, MonthBar>()
    for (const ev of data.events) {
      const prefix = ev.date.slice(0, 7)
      if (!map.has(prefix)) map.set(prefix, { prefix, label: monthLabel(prefix), received: 0, pending: 0, outgoing: 0 })
      const m = map.get(prefix)!
      if (ev.type === 'receita') {
        if (ev.status === 'recebido') m.received += Math.abs(ev.amount)
        else m.pending += Math.abs(ev.amount)
      } else {
        m.outgoing += Math.abs(ev.amount)
      }
    }
    return Array.from(map.values())
  }, [data])

  const maxBar = useMemo(() => {
    return Math.max(...monthBars.map(m => Math.max(m.received + m.pending, m.outgoing)), 1)
  }, [monthBars])

  const balColor = data
    ? data.current_balance < 0 ? '#E50914' : '#FF8A00'
    : '#FF8A00'

  return (
    <AppShell>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px 80px' }}>

        <h1 style={{
          fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22,
          color: '#1A1A1D', letterSpacing: '-0.3px',
          paddingLeft: 11, borderLeft: '3px solid #FF8A00', marginBottom: 4,
        }}>Timeline</h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, paddingLeft: 14 }}>
          Projeção dos próximos 90 dias
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => <div key={i} style={{ height: 80, borderRadius: 16, background: '#f1f5f9' }} />)}
          </div>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', paddingTop: 60 }}>Erro ao carregar.</p>
        ) : (
          <>
            {/* ── Saldo + barras mensais ── */}
            <div style={{
              background: 'white', borderRadius: 20,
              border: '1px solid #f1f5f9',
              boxShadow: '0 1px 6px rgba(0,0,0,0.05)',
              marginBottom: 24, overflow: 'hidden',
            }}>
              {/* Saldo */}
              <div style={{
                padding: '20px 24px 18px',
                borderBottom: '1px solid #f8fafc',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8', marginBottom: 4 }}>
                    Disponível agora
                  </p>
                  <p style={{
                    fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 36, fontWeight: 800,
                    lineHeight: 1, letterSpacing: '-1.5px', color: balColor,
                  }}>
                    {formatCurrency(data.current_balance)}
                  </p>
                </div>
                {data.current_balance < 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(229,9,20,0.06)', borderRadius: 10, padding: '8px 12px' }}>
                    <AlertTriangle size={13} color="#E50914" />
                    <span style={{ color: '#E50914', fontSize: 12, fontWeight: 600 }}>Saldo negativo</span>
                  </div>
                )}
              </div>

              {/* Barras mensais */}
              {monthBars.length > 0 && (
                <div style={{ padding: '16px 24px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#94a3b8' }}>
                      Fluxo por mês
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      {[
                        { color: '#10b981', label: 'Recebido', opacity: 1 },
                        { color: '#10b981', label: 'A receber', opacity: 0.35 },
                        { color: '#E50914', label: 'Saídas', opacity: 0.8 },
                      ].map(({ color, label, opacity }) => (
                        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <div style={{ width: 10, height: 6, borderRadius: 2, background: color, opacity }} />
                          <span style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600 }}>{label}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {monthBars.map((m) => (
                      <div key={m.prefix}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#475569', width: 110, flexShrink: 0 }}>{m.label}</span>
                          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                            {/* Entradas */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {m.received > 0 && (
                                <div style={{ flex: m.received / maxBar, height: 8, background: '#10b981', borderRadius: '4px 0 0 4px', minWidth: 4 }} />
                              )}
                              {m.pending > 0 && (
                                <div style={{ flex: m.pending / maxBar, height: 8, background: '#10b981', opacity: 0.35, borderRadius: m.received > 0 ? '0 4px 4px 0' : 4, minWidth: 4 }} />
                              )}
                              {(m.received + m.pending) === 0 && (
                                <div style={{ flex: 1, height: 8, background: '#f1f5f9', borderRadius: 4 }} />
                              )}
                            </div>
                            {/* Saídas */}
                            {m.outgoing > 0 && (
                              <Bar value={m.outgoing} max={maxBar} color="#E50914" opacity={0.8} />
                            )}
                          </div>
                          <div style={{ width: 80, flexShrink: 0, textAlign: 'right' }}>
                            {m.received + m.pending > 0 && (
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#10b981', lineHeight: 1.2 }}>
                                +{formatCurrency(m.received + m.pending)}
                              </p>
                            )}
                            {m.outgoing > 0 && (
                              <p style={{ fontSize: 10, fontWeight: 700, color: '#E50914', lineHeight: 1.2 }}>
                                −{formatCurrency(m.outgoing)}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Lista de eventos ── */}
            {data.events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingTop: 40 }}>
                Nenhum evento nos próximos 90 dias.
              </p>
            ) : (
              <div>
                {dayGroups.map((group, gi) => {
                  const lastEv  = group.events[group.events.length - 1]
                  const isLast  = gi === dayGroups.length - 1
                  const dotColor  = lastEv.running_balance < 0 ? '#E50914' : lastEv.alert === 'warning' ? '#d97706' : '#10b981'
                  const balColor2 = lastEv.running_balance < 0 ? '#E50914' : lastEv.alert === 'warning' ? '#d97706' : '#FF8A00'
                  const { weekday, day, month } = fmtDate(group.date)

                  return (
                    <div key={gi} style={{ display: 'flex', gap: 20 }}>

                      {/* Date pill */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 52 }}>
                        <div style={{
                          width: 48, borderRadius: 12, background: 'white',
                          border: '1px solid #e8ecf0', borderTop: `3px solid ${dotColor}`,
                          boxShadow: '0 1px 6px rgba(0,0,0,0.06)',
                          padding: '6px 4px', textAlign: 'center',
                        }}>
                          <p style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: dotColor, lineHeight: 1, marginBottom: 2 }}>{weekday}</p>
                          <p style={{ fontSize: 14, fontWeight: 800, color: '#1A1A1D', lineHeight: 1 }}>{day}</p>
                          <p style={{ fontSize: 9, color: '#94a3b8', lineHeight: 1, marginTop: 1 }}>{month}</p>
                        </div>
                        {!isLast && (
                          <div style={{
                            flex: 1, width: 2,
                            background: 'linear-gradient(to bottom, rgba(0,0,0,0.09), rgba(0,0,0,0.02))',
                            borderRadius: 1, marginTop: 6,
                          }} />
                        )}
                      </div>

                      {/* Content */}
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 28 }}>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8, paddingTop: 4 }}>
                          <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 4 }}>
                            <span style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#94a3b8' }}>saldo</span>
                            <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.5px', color: balColor2 }}>
                              {formatCurrency(lastEv.running_balance)}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {group.events.map((ev, ei) => {
                            const t          = TYPE[ev.type]
                            const Icon       = t.icon
                            const key        = `${gi}-${ei}`
                            const isOpen     = expanded === key
                            const isRecebido = ev.status === 'recebido'
                            const displayAmt = ev.display_amount ?? Math.abs(ev.amount)
                            const evColor    = isRecebido ? '#10b981' : t.color
                            // Cushion encoding: sólido = recebido/confirmado, tracejado = pendente/estimado
                            const bStyle     = isRecebido ? 'solid' : (ev.type === 'despesa' ? 'solid' : 'dashed')

                            return (
                              <div key={ei}>
                                <button
                                  onClick={() => setExpanded(isOpen ? null : key)}
                                  style={{
                                    width: '100%', textAlign: 'left', cursor: 'pointer',
                                    background: 'white',
                                    borderRadius: isOpen ? '14px 14px 0 0' : 14,
                                    border: '1px solid #f1f5f9',
                                    borderLeft: `3px ${bStyle} ${evColor}`,
                                    borderBottom: isOpen ? '1px solid #f8fafc' : undefined,
                                    padding: '12px 16px',
                                    opacity: isRecebido ? 0.65 : 1,
                                    boxShadow: isOpen ? '0 6px 18px rgba(0,0,0,0.07)' : '0 1px 4px rgba(0,0,0,0.04)',
                                    transition: 'box-shadow 0.15s, border-radius 0.1s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                    <div style={{
                                      width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                      background: isRecebido ? 'rgba(16,185,129,0.08)' : t.bg,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <Icon size={14} color={evColor} strokeWidth={2.2} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: evColor }}>
                                        {isRecebido ? 'Recebido' : t.label}
                                      </span>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1D', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {ev.description}
                                      </p>
                                      {ev.subtitle && (
                                        <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {ev.subtitle}
                                        </p>
                                      )}
                                    </div>
                                    <p style={{
                                      fontFamily: 'var(--font-poppins,sans-serif)',
                                      fontSize: 15, fontWeight: 800, lineHeight: 1, flexShrink: 0,
                                      color: evColor,
                                    }}>
                                      {t.sign}{formatCurrency(displayAmt)}
                                    </p>
                                  </div>
                                </button>

                                {isOpen && (
                                  <div style={{
                                    background: '#fafafa',
                                    border: '1px solid #f1f5f9', borderTop: 'none',
                                    borderLeft: `3px ${bStyle} ${evColor}`,
                                    borderRadius: '0 0 14px 14px',
                                    padding: '10px 16px',
                                  }}>
                                    {ev.type === 'receita' && ev.id ? (
                                      !isRecebido ? (
                                        <button
                                          onClick={() => handleMarkReceived(ev.id!)}
                                          disabled={actionLoading}
                                          style={{
                                            fontSize: 12, fontWeight: 700, color: '#10b981',
                                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: 10, padding: '8px 16px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1,
                                          }}>
                                          {actionLoading ? 'Salvando…' : 'Marcar como recebido'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUnmarkReceived(ev.id!)}
                                          disabled={actionLoading}
                                          style={{
                                            fontSize: 12, fontWeight: 700, color: '#64748b',
                                            background: 'white', border: '1px solid #e2e8f0',
                                            borderRadius: 10, padding: '8px 16px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1,
                                          }}>
                                          {actionLoading ? 'Salvando…' : 'Desfazer recebimento'}
                                        </button>
                                      )
                                    ) : (
                                      <p style={{ fontSize: 11, color: '#94a3b8' }}>Sem ações disponíveis.</p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </div>
                  )
                })}

                {/* Fim da projeção */}
                {(() => {
                  const finalEv    = dayGroups[dayGroups.length - 1]?.events.slice(-1)[0]
                  const finalBal   = finalEv?.running_balance ?? 0
                  const finalColor = finalBal < 0 ? '#E50914' : finalEv?.alert === 'warning' ? '#d97706' : '#10b981'
                  return (
                    <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start', paddingTop: 4 }}>
                      <div style={{ width: 52, display: 'flex', justifyContent: 'center' }}>
                        <div style={{ width: 12, height: 12, borderRadius: '50%', border: `2px solid ${finalColor}`, opacity: 0.35, marginTop: 4 }} />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <span style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                          fim da projeção · 90 dias
                        </span>
                        <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: 5 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: finalColor, opacity: 0.55 }}>
                            saldo final
                          </span>
                          <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 16, fontWeight: 800, letterSpacing: '-0.4px', color: finalColor }}>
                            {formatCurrency(finalBal)}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
