'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Receipt, Target, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, ChevronRight, Clock, Wallet,
} from 'lucide-react'
import { calcWithdrawalRecommendation } from '@/lib/withdrawal-engine'
import type { TaxRegime } from '@/lib/constants'

type GoalSummary = {
  id: string; name: string; target_amount: number; accumulated_amount: number
  percentage_allocation: number; pct: number; estimated_completion: string | null
}

type DashboardData = {
  revenue: number; expenses: number; tax_reserve: number
  goals_this_month: number; disponivel: number
  saldo_inicial: number; total_received_ever: number
  total_expenses_ever: number; total_goals_ever: number
  receivables_pending: number; receivable_30d: number; receivables_overdue: number; receivables_overdue_count: number
  goals: GoalSummary[]; recommendations: string[]
  company_tax_regime: string
  company_prolabore_mensal: number | null
  company_retirada_desejada_mensal: number | null
}

const EMPTY: DashboardData = {
  revenue: 0, expenses: 0, tax_reserve: 0,
  goals_this_month: 0, disponivel: 0,
  saldo_inicial: 0, total_received_ever: 0,
  total_expenses_ever: 0, total_goals_ever: 0,
  receivables_pending: 0, receivable_30d: 0, receivables_overdue: 0, receivables_overdue_count: 0,
  goals: [], recommendations: [],
  company_tax_regime: 'simples',
  company_prolabore_mensal: null,
  company_retirada_desejada_mensal: null,
}

const C = { orange: '#FF8A00', red: '#E50914', dark: '#1A1A1D' } as const

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch(`/api/dashboard?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => { setData({ ...EMPTY, ...d }); setLoading(false) })
      .catch(() => setLoading(false))
  }, [year, month])

  const disponColor = data.disponivel >= 0 ? C.orange : C.red

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-5 flex items-baseline justify-between">
          <h1 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 700, fontSize: 22, color: C.dark }}>
            Painel
          </h1>
          <p className="text-sm text-slate-400 capitalize">{monthLabel}</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[96, 72, 72].map((h, i) => (
              <div key={i} className="rounded-2xl animate-pulse bg-white" style={{ height: h, opacity: 0.7 }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── Disponível ── */}
            <Link href="/saldo"
              className="block bg-white rounded-2xl mb-3 overflow-hidden hover:shadow-lg transition-shadow"
              style={{ border: `1px solid #eef0f3`, borderTop: `4px solid ${disponColor}` }}>
              <div className="px-6 py-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>
                      Disponível hoje
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-poppins, sans-serif)',
                      fontSize: 46,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-1.5px',
                      color: disponColor,
                    }}>
                      {formatCurrency(data.disponivel)}
                    </p>
                    <p style={{ fontSize: 11, color: '#cbd5e1', marginTop: 10 }}>
                      Após despesas e metas · Ver detalhamento
                    </p>
                  </div>
                  <ChevronRight size={18} color="#cbd5e1" />
                </div>
              </div>
            </Link>

            {/* ── Grid — Impostos + Metas ── */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              {[
                {
                  label: 'Impostos',
                  value: data.tax_reserve,
                  sub: 'Reservado este mês',
                  color: '#d97706',
                  border: '#d97706',
                  iconBg: '#fef3c7',
                  icon: <Receipt size={16} color="#d97706" />,
                  href: '/despesas',
                },
                {
                  label: 'Metas',
                  value: data.goals_this_month,
                  sub: 'Guardado este mês',
                  color: C.orange,
                  border: C.orange,
                  iconBg: '#fff7ed',
                  icon: <Target size={16} color={C.orange} />,
                  href: '/objetivos',
                },
              ].map(({ label, value, sub, color, border, iconBg, icon, href }) => (
                <Link key={label} href={href} className="bg-white rounded-2xl overflow-hidden hover:shadow-md transition-shadow"
                  style={{ border: '1px solid #eef0f3', borderTop: `4px solid ${border}` }}>
                  <div className="px-4 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {icon}
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
                        {label}
                      </p>
                    </div>
                    <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 24, fontWeight: 700, color, lineHeight: 1 }}>
                      {formatCurrency(value)}
                    </p>
                    <p style={{ fontSize: 10, color: '#cbd5e1', marginTop: 6 }}>{sub}</p>
                  </div>
                </Link>
              ))}
            </div>

            {/* ── A receber ── */}
            {data.receivable_30d > 0 && (
              <div className="bg-white rounded-2xl overflow-hidden mb-3"
                style={{ border: '1px solid #eef0f3', borderTop: '4px solid #10b981' }}>
                <div className="px-5 py-4 flex items-center justify-between">
                  <Link href="/receitas?filter=pendente" className="flex items-center gap-3 flex-1">
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <TrendingUp size={17} color="#10b981" />
                    </div>
                    <div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 4 }}>
                        A receber (30 dias)
                      </p>
                      <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 22, fontWeight: 700, color: '#10b981', lineHeight: 1 }}>
                        {formatCurrency(data.receivable_30d)}
                      </p>
                    </div>
                  </Link>
                  {data.receivables_overdue > 0 && (
                    <Link href="/receitas?filter=atrasado" className="text-right block ml-3">
                      <div className="flex items-center gap-1 justify-end mb-1">
                        <AlertTriangle size={11} color={C.red} />
                        <p style={{ fontSize: 10, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Em atraso</p>
                      </div>
                      <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 16, fontWeight: 700, color: C.red }}>
                        {formatCurrency(data.receivables_overdue)}
                      </p>
                      <p style={{ fontSize: 10, color: C.red, opacity: 0.65, marginTop: 2 }}>
                        {data.receivables_overdue_count} recebimento{data.receivables_overdue_count !== 1 ? 's' : ''} · ver →
                      </p>
                    </Link>
                  )}
                </div>
              </div>
            )}

            {/* ── Metas e Reservas ── */}
            {data.goals.length > 0 ? (
              <div className="mb-3 mt-6">
                <div className="flex items-center justify-between mb-3">
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8' }}>
                    Metas e Reservas
                  </p>
                  <Link href="/objetivos" style={{ fontSize: 11, fontWeight: 700, color: C.orange }}>
                    Ver todas →
                  </Link>
                </div>
                <div className="space-y-2.5">
                  {data.goals.map((g) => {
                    const barColor = g.pct >= 80 ? '#10b981' : C.orange
                    return (
                      <Link key={g.id} href={`/objetivos/${g.id}`}
                        className="block bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
                        style={{ border: '1px solid #eef0f3' }}>
                        <div className="flex justify-between items-center mb-3">
                          <span className="text-sm font-semibold text-slate-800">{g.name}</span>
                          <span style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 700, fontSize: 15, color: barColor }}>
                            {g.pct}%
                          </span>
                        </div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                          <div className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${g.pct}%`, background: barColor }} />
                        </div>
                        <div className="flex justify-between" style={{ fontSize: 11, color: '#94a3b8' }}>
                          <span>{formatCurrency(g.accumulated_amount)} / {formatCurrency(g.target_amount)}</span>
                          {g.estimated_completion && (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />{g.estimated_completion}
                            </span>
                          )}
                        </div>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ) : (
              <Link href="/objetivos/novo"
                className="block mb-3 mt-6 rounded-2xl p-5 text-center transition-colors"
                style={{ border: `2px dashed rgba(255,138,0,0.25)`, background: 'rgba(255,138,0,0.02)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,138,0,0.06)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,138,0,0.02)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,138,0,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Target size={22} color={C.orange} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: C.orange }}>Criar primeira meta</p>
                <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>Reserve parte das entradas para um objetivo</p>
              </Link>
            )}

            {/* ── Retiradas ── */}
            {(() => {
              const target = data.company_retirada_desejada_mensal
              if (!target || target <= 0) return null
              const wr = calcWithdrawalRecommendation(
                (data.company_tax_regime || 'simples') as TaxRegime,
                target,
                data.company_prolabore_mensal,
              )
              const hasWaste = !!wr.annual_waste
              const borderColor = hasWaste ? '#d97706' : '#10b981'
              const bgWaste = '#fef3c7'
              return (
                <Link href="/fiscal" className="block mb-3 rounded-2xl overflow-hidden hover:shadow-md transition-shadow" style={{ border: '1px solid #eef0f3', borderTop: `4px solid ${borderColor}` }}>
                  <div className="bg-white px-5 py-4">
                    <div className="flex items-center gap-2 mb-3">
                      <div style={{ width: 28, height: 28, borderRadius: 7, background: hasWaste ? '#fef3c7' : '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Wallet size={15} color={borderColor} />
                      </div>
                      <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#94a3b8' }}>
                        Suas retiradas
                      </p>
                    </div>

                    {wr.regime === 'mei' ? (
                      <p style={{ fontSize: 12, color: '#64748b' }}>{wr.reason}</p>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Pró-labore</p>
                            <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 16, fontWeight: 700, color: '#1A1A1D' }}>
                              {formatCurrency(wr.optimal_prolabore)}
                            </p>
                            <p style={{ fontSize: 10, color: '#94a3b8' }}>INSS {formatCurrency(wr.inss_cost)}/mês</p>
                          </div>
                          <div>
                            <p style={{ fontSize: 10, color: '#94a3b8', marginBottom: 2 }}>Dist. de lucros</p>
                            <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 16, fontWeight: 700, color: '#10b981' }}>
                              {formatCurrency(wr.optimal_distribution)}
                            </p>
                            <p style={{ fontSize: 10, color: '#10b981' }}>Isento de IR e INSS</p>
                          </div>
                        </div>

                        {hasWaste && (
                          <div style={{ background: bgWaste, borderRadius: 10, padding: '8px 12px' }}>
                            <p style={{ fontSize: 11, fontWeight: 600, color: '#92400e' }}>
                              Pró-labore atual de {formatCurrency(wr.current_prolabore || 0)} gera {formatCurrency((wr.current_tax_cost || 0) - wr.total_tax_cost)} a mais/mês — {formatCurrency(wr.annual_waste!)}/ano de custo extra.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </Link>
              )
            })()}

            {/* ── Assistente ── */}
            {data.recommendations.length > 0 && (
              <div className="mb-3">
                <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#94a3b8', marginBottom: 10 }}>
                  Assistente
                </p>
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 items-start rounded-2xl px-4 py-3.5"
                      style={{ background: C.dark, border: '1px solid rgba(255,255,255,0.06)' }}>
                      <Lightbulb size={15} color={C.orange} style={{ flexShrink: 0, marginTop: 1 }} />
                      <p className="text-sm text-slate-300 leading-snug">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Ações rápidas ── */}
            <div className="grid grid-cols-3 gap-2 mt-6">
              {[
                { href: '/receitas/nova',  icon: <TrendingUp size={19} />,  label: 'Nova receita',  color: '#10b981', bg: '#f0fdf4' },
                { href: '/despesas/nova',  icon: <TrendingDown size={19} />, label: 'Nova despesa',  color: C.red,     bg: '#fff1f2' },
                { href: '/objetivos/novo', icon: <Target size={19} />,       label: 'Nova meta',     color: C.orange,  bg: '#fff7ed' },
              ].map(({ href, icon, label, color, bg }) => (
                <Link key={href} href={href}
                  className="bg-white rounded-2xl p-3 text-center hover:shadow-md transition-shadow"
                  style={{ border: '1px solid #eef0f3' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color }}>
                    {icon}
                  </div>
                  <p style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>{label}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
