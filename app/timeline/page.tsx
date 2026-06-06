'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { AlertTriangle, TrendingUp, TrendingDown, Receipt } from 'lucide-react'

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

const TYPE = {
  receita: { color: '#10b981', bg: 'rgba(16,185,129,0.10)', label: 'Entrada',  icon: TrendingUp,   sign: '+' },
  despesa: { color: '#E50914', bg: 'rgba(229,9,20,0.10)',   label: 'Despesa',  icon: TrendingDown,  sign: '−' },
  imposto: { color: '#d97706', bg: 'rgba(217,119,6,0.10)',  label: 'Imposto',  icon: Receipt,       sign: '−' },
}

function fmtDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  const date    = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const wCap    = weekday.charAt(0).toUpperCase() + weekday.slice(1)
  const dd      = String(d).padStart(2, '0')
  const mm      = String(m).padStart(2, '0')
  return `${wCap} · ${dd}/${mm}`
}

function groupByDate(events: TimelineEvent[]): DayGroup[] {
  const map = new Map<string, TimelineEvent[]>()
  for (const ev of events) {
    if (!map.has(ev.date)) map.set(ev.date, [])
    map.get(ev.date)!.push(ev)
  }
  return Array.from(map.entries()).map(([date, evs]) => ({ date, events: evs }))
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

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 80px' }}>

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
            {[1, 2, 3].map(i => <div key={i} style={{ height: 90, borderRadius: 16, background: '#f1f5f9' }} />)}
          </div>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', paddingTop: 60 }}>Erro ao carregar.</p>
        ) : (
          <>
            {/* ── Saldo hero ── */}
            <div style={{
              background: '#1c1917', borderRadius: 20, padding: '22px 26px',
              marginBottom: 36, border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 8 }}>
                Saldo disponível agora
              </p>
              <p style={{
                fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 44, fontWeight: 800,
                lineHeight: 1, letterSpacing: '-1.5px',
                color: data.current_balance >= 0 ? '#FF8A00' : '#E50914',
              }}>
                {formatCurrency(data.current_balance)}
              </p>
              {data.current_balance < 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                  <AlertTriangle size={12} color="#E50914" />
                  <p style={{ color: '#E50914', fontSize: 12, fontWeight: 600 }}>Saldo negativo — atenção ao fluxo</p>
                </div>
              )}
            </div>

            {data.events.length === 0 ? (
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingTop: 40 }}>
                Nenhum evento nos próximos 90 dias.
              </p>
            ) : (
              <div>
                {dayGroups.map((group, gi) => {
                  const lastEv   = group.events[group.events.length - 1]
                  const prevBal  = gi === 0
                    ? data.current_balance
                    : dayGroups[gi - 1].events[dayGroups[gi - 1].events.length - 1].running_balance
                  const dayDelta = lastEv.running_balance - prevBal
                  const isLast   = gi === dayGroups.length - 1

                  // Dot color reflects health of projected balance after this day
                  const dotColor =
                    lastEv.running_balance < 0 ? '#E50914' :
                    lastEv.alert === 'warning'  ? '#d97706' :
                    '#10b981'

                  // Balance label color
                  const balColor =
                    lastEv.running_balance < 0 ? '#E50914' :
                    lastEv.alert === 'warning'  ? '#d97706' :
                    '#FF8A00'

                  return (
                    <div key={gi} style={{ display: 'flex', gap: 18 }}>

                      {/* ── Coluna esquerda: nó + segmento de trilho ── */}
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0, width: 16 }}>
                        {/* Nó */}
                        <div style={{
                          width: 14, height: 14, borderRadius: '50%',
                          background: dotColor,
                          border: '2.5px solid white',
                          boxShadow: `0 0 0 2.5px ${dotColor}35, 0 0 10px ${dotColor}25`,
                          flexShrink: 0, zIndex: 1,
                          marginTop: 3,
                        }} />
                        {/* Segmento do trilho — cor do nó deste dia, estica até o próximo nó */}
                        {!isLast && (
                          <div style={{
                            flex: 1,
                            width: 2,
                            background: dotColor,
                            opacity: 0.2,
                            borderRadius: 1,
                            marginTop: 5,
                            marginBottom: 0,
                          }} />
                        )}
                      </div>

                      {/* ── Coluna direita: conteúdo do dia ── */}
                      <div style={{ flex: 1, minWidth: 0, paddingBottom: isLast ? 0 : 28 }}>

                        {/* Cabeçalho: data + delta */}
                        <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 6 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#475569', textTransform: 'capitalize' }}>
                            {fmtDate(group.date)}
                            {group.events.length > 1 && (
                              <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 11 }}> · {group.events.length} eventos</span>
                            )}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 700, color: dayDelta >= 0 ? '#10b981' : '#E50914' }}>
                            {dayDelta >= 0 ? '+' : ''}{formatCurrency(dayDelta)}
                          </span>
                        </div>

                        {/* Saldo projetado do dia — UMA VEZ, com destaque */}
                        <div style={{
                          display: 'inline-flex', alignItems: 'baseline', gap: 6,
                          marginBottom: 10,
                        }}>
                          <span style={{
                            fontSize: 12, fontWeight: 700, letterSpacing: '0.04em',
                            textTransform: 'uppercase', color: balColor, opacity: 0.55,
                          }}>saldo</span>
                          <span style={{
                            fontFamily: 'var(--font-poppins,sans-serif)',
                            fontSize: 20, fontWeight: 800, letterSpacing: '-0.5px',
                            color: balColor, lineHeight: 1,
                          }}>
                            {formatCurrency(lastEv.running_balance)}
                          </span>
                          {lastEv.alert !== 'ok' && (
                            <AlertTriangle size={12} color={balColor} style={{ marginBottom: 1 }} />
                          )}
                        </div>

                        {/* Cards dos eventos — sem saldo por evento */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                          {group.events.map((ev, ei) => {
                            const t          = TYPE[ev.type]
                            const Icon       = t.icon
                            const key        = `${gi}-${ei}`
                            const isOpen     = expanded === key
                            const isRecebido = ev.status === 'recebido'
                            const displayAmt = ev.display_amount ?? Math.abs(ev.amount)

                            return (
                              <div key={ei}>
                                <button
                                  onClick={() => setExpanded(isOpen ? null : key)}
                                  style={{
                                    width: '100%', textAlign: 'left', cursor: 'pointer',
                                    background: 'white',
                                    borderRadius: isOpen ? '11px 11px 0 0' : 11,
                                    border: '1px solid #f1f5f9',
                                    borderLeft: `3px solid ${isRecebido ? '#10b981' : t.color}`,
                                    borderBottom: isOpen ? '1px solid #f8fafc' : undefined,
                                    padding: '10px 13px',
                                    opacity: isRecebido ? 0.65 : 1,
                                    boxShadow: isOpen ? '0 4px 14px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                                    transition: 'box-shadow 0.15s',
                                  }}
                                >
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{
                                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                                      background: isRecebido ? 'rgba(16,185,129,0.08)' : t.bg,
                                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    }}>
                                      <Icon size={12} color={isRecebido ? '#10b981' : t.color} strokeWidth={2.2} />
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <span style={{ fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: isRecebido ? '#10b981' : t.color }}>
                                        {isRecebido ? '✓ Recebido' : t.label}
                                      </span>
                                      <p style={{ fontSize: 13, fontWeight: 600, color: '#1A1A1D', margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                        {ev.description}
                                      </p>
                                      {ev.subtitle && (
                                        <p style={{ fontSize: 11, color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                          {ev.subtitle}
                                        </p>
                                      )}
                                    </div>
                                    {/* Apenas o valor do evento — sem saldo repetido */}
                                    <p style={{
                                      fontFamily: 'var(--font-poppins,sans-serif)',
                                      fontSize: 14, fontWeight: 700, lineHeight: 1, flexShrink: 0,
                                      color: isRecebido ? '#10b981' : t.color,
                                    }}>
                                      {t.sign}{formatCurrency(displayAmt)}
                                    </p>
                                  </div>
                                </button>

                                {isOpen && (
                                  <div style={{
                                    background: '#fafafa',
                                    border: '1px solid #f1f5f9', borderTop: 'none',
                                    borderLeft: `3px solid ${isRecebido ? '#10b981' : t.color}`,
                                    borderRadius: '0 0 11px 11px',
                                    padding: '9px 13px',
                                  }}>
                                    {ev.type === 'receita' && ev.id ? (
                                      !isRecebido ? (
                                        <button
                                          onClick={() => handleMarkReceived(ev.id!)}
                                          disabled={actionLoading}
                                          style={{
                                            fontSize: 12, fontWeight: 700, color: '#10b981',
                                            background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)',
                                            borderRadius: 8, padding: '7px 14px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1,
                                          }}>
                                          {actionLoading ? 'Salvando…' : '✓ Marcar como recebido'}
                                        </button>
                                      ) : (
                                        <button
                                          onClick={() => handleUnmarkReceived(ev.id!)}
                                          disabled={actionLoading}
                                          style={{
                                            fontSize: 12, fontWeight: 700, color: '#64748b',
                                            background: 'white', border: '1px solid #e2e8f0',
                                            borderRadius: 8, padding: '7px 14px',
                                            cursor: actionLoading ? 'not-allowed' : 'pointer', opacity: actionLoading ? 0.5 : 1,
                                          }}>
                                          {actionLoading ? 'Salvando…' : '↩ Desfazer recebimento'}
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

                {/* Ponta do trilho — marcador final */}
                {(() => {
                  const finalEv    = dayGroups[dayGroups.length - 1]?.events.slice(-1)[0]
                  const finalBal   = finalEv?.running_balance ?? 0
                  const finalColor = finalBal < 0 ? '#E50914' : finalEv?.alert === 'warning' ? '#d97706' : '#10b981'
                  return (
                    <div style={{ display: 'flex', gap: 18, alignItems: 'flex-start', paddingTop: 4 }}>
                      <div style={{ width: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, paddingTop: 3 }}>
                        <div style={{
                          width: 10, height: 10, borderRadius: '50%',
                          background: 'transparent',
                          border: `2px solid ${finalColor}`,
                          opacity: 0.45,
                        }} />
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
