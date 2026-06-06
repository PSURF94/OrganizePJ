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

interface DayGroup {
  date: string
  events: TimelineEvent[]
}

interface TimelineData {
  current_balance: number
  events: TimelineEvent[]
}

const TYPE = {
  receita: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', label: 'Entrada',  icon: TrendingUp,  sign: '+' },
  despesa: { color: '#E50914', bg: 'rgba(229,9,20,0.08)',   label: 'Despesa',  icon: TrendingDown, sign: '−' },
  imposto: { color: '#d97706', bg: 'rgba(217,119,6,0.08)',  label: 'Imposto',  icon: Receipt,      sign: '−' },
}

function formatDateGroup(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', {
    weekday: 'short', day: '2-digit', month: 'short',
  })
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
  const [data, setData]           = useState<TimelineData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [actionLoading, setAL]    = useState(false)

  async function reload() {
    const r = await fetch('/api/timeline')
    setData(await r.json())
  }

  useEffect(() => {
    fetch('/api/timeline')
      .then(r => r.json())
      .then(d => { setData(d); setLoading(false) })
  }, [])

  async function handleMarkReceived(id: string) {
    setAL(true)
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: new Date().toISOString().split('T')[0] }),
    })
    setExpanded(null)
    await reload()
    setAL(false)
  }

  async function handleUnmarkReceived(id: string) {
    setAL(true)
    await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ received_date: null }),
    })
    setExpanded(null)
    await reload()
    setAL(false)
  }

  const dayGroups = data ? groupByDate(data.events) : []

  return (
    <AppShell>
      <div style={{ maxWidth: 600, margin: '0 auto', padding: '24px 16px 80px' }}>

        {/* Header */}
        <h1 style={{
          fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22,
          color: '#1A1A1D', letterSpacing: '-0.3px',
          paddingLeft: 11, borderLeft: '3px solid #FF8A00', marginBottom: 4,
        }}>
          Timeline
        </h1>
        <p style={{ fontSize: 12, color: '#94a3b8', marginBottom: 20, paddingLeft: 14 }}>
          Projeção dos próximos 90 dias
        </p>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1, 2, 3].map(i => (
              <div key={i} style={{ height: 72, borderRadius: 16, background: '#f1f5f9', animation: 'pulse 1.5s infinite' }} />
            ))}
          </div>
        ) : !data ? (
          <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 14, paddingTop: 60 }}>Erro ao carregar.</p>
        ) : (
          <>
            {/* ── Saldo hero ── */}
            <div style={{
              background: '#1c1917', borderRadius: 20, padding: '22px 26px',
              marginBottom: 28, border: '1px solid rgba(255,255,255,0.06)',
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
                Nenhum evento financeiro nos próximos 90 dias.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {dayGroups.map((group, gi) => (
                  <div key={gi}>
                    {/* ── Date separator ── */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                      <span style={{
                        fontSize: 11, fontWeight: 700, color: '#94a3b8',
                        textTransform: 'uppercase', letterSpacing: '0.07em', whiteSpace: 'nowrap',
                      }}>
                        {formatDateGroup(group.date)}
                        {group.events.length > 1 && (
                          <span style={{ fontWeight: 400, color: '#cbd5e1' }}> · {group.events.length} eventos</span>
                        )}
                      </span>
                      <div style={{ flex: 1, height: 1, background: '#e2e8f0' }} />
                    </div>

                    {/* ── Event cards ── */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {group.events.map((ev, ei) => {
                        const t          = TYPE[ev.type]
                        const Icon       = t.icon
                        const key        = `${gi}-${ei}`
                        const isOpen     = expanded === key
                        const isRecebido = ev.status === 'recebido'
                        const displayAmt = ev.display_amount ?? Math.abs(ev.amount)
                        const balColor   = ev.running_balance < 0 ? '#E50914' : ev.alert === 'warning' ? '#d97706' : '#64748b'

                        return (
                          <div key={ei}>
                            {/* Card row */}
                            <button
                              onClick={() => setExpanded(isOpen ? null : key)}
                              style={{
                                width: '100%', textAlign: 'left', cursor: 'pointer',
                                background: 'white',
                                borderRadius: isOpen ? '14px 14px 0 0' : 14,
                                border: '1px solid #f1f5f9',
                                borderLeft: `4px solid ${isRecebido ? '#10b981' : t.color}`,
                                borderBottom: isOpen ? '1px solid #f8fafc' : '1px solid #f1f5f9',
                                padding: '13px 16px',
                                opacity: isRecebido ? 0.7 : 1,
                                boxShadow: isOpen ? '0 2px 12px rgba(0,0,0,0.06)' : '0 1px 3px rgba(0,0,0,0.04)',
                                transition: 'box-shadow 0.15s ease',
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                {/* Icon badge */}
                                <div style={{
                                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                  background: isRecebido ? 'rgba(16,185,129,0.08)' : t.bg,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <Icon size={14} color={isRecebido ? '#10b981' : t.color} strokeWidth={2.2} />
                                </div>

                                {/* Text */}
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <span style={{
                                    fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                    letterSpacing: '0.1em', color: isRecebido ? '#10b981' : t.color,
                                    display: 'block', marginBottom: 2,
                                  }}>
                                    {isRecebido ? '✓ Recebido' : t.label}
                                  </span>
                                  <p style={{
                                    fontSize: 13, fontWeight: 600, color: '#1A1A1D',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                  }}>
                                    {ev.description}
                                  </p>
                                  {ev.subtitle && (
                                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                      {ev.subtitle}
                                    </p>
                                  )}
                                </div>

                                {/* Amount + projected balance */}
                                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                  <p style={{
                                    fontFamily: 'var(--font-poppins,sans-serif)',
                                    fontSize: 15, fontWeight: 700, lineHeight: 1,
                                    color: isRecebido ? '#10b981' : t.color,
                                  }}>
                                    {t.sign}{formatCurrency(displayAmt)}
                                  </p>
                                  {isRecebido ? (
                                    <p style={{ fontSize: 10, color: '#10b981', marginTop: 4, opacity: 0.6 }}>já no saldo</p>
                                  ) : (
                                    <p style={{ fontSize: 10, color: balColor, marginTop: 4, display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
                                      {ev.alert !== 'ok' && <AlertTriangle size={8} color={balColor} />}
                                      {formatCurrency(ev.running_balance)}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </button>

                            {/* ── Expanded action panel ── */}
                            {isOpen && (
                              <div style={{
                                background: '#fafafa',
                                border: '1px solid #f1f5f9',
                                borderTop: 'none',
                                borderLeft: `4px solid ${isRecebido ? '#10b981' : t.color}`,
                                borderRadius: '0 0 14px 14px',
                                padding: '12px 16px',
                                display: 'flex', alignItems: 'center', gap: 10,
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
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
