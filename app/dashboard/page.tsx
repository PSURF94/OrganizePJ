'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'
import {
  Wallet, Receipt, Target, TrendingUp, TrendingDown,
  AlertTriangle, Lightbulb, ChevronRight, Clock,
} from 'lucide-react'

type GoalSummary = {
  id: string; name: string; target_amount: number; accumulated_amount: number
  percentage_allocation: number; pct: number; estimated_completion: string | null
}

type DashboardData = {
  revenue: number; expenses: number; tax_reserve: number
  goals_this_month: number; disponivel: number
  saldo_inicial: number; total_received_ever: number
  total_expenses_ever: number; total_goals_ever: number
  receivables_pending: number; receivable_30d: number; receivables_overdue: number
  goals: GoalSummary[]; recommendations: string[]
}

const EMPTY: DashboardData = {
  revenue: 0, expenses: 0, tax_reserve: 0,
  goals_this_month: 0, disponivel: 0,
  saldo_inicial: 0, total_received_ever: 0,
  total_expenses_ever: 0, total_goals_ever: 0,
  receivables_pending: 0, receivable_30d: 0, receivables_overdue: 0,
  goals: [], recommendations: [],
}

const C = { orange: '#FF8A00', red: '#E50914', dark: '#1A1A1D' } as const

/* Card escuro reutilizável para métricas */
function DarkCard({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div
      className={className}
      style={{
        background: C.dark,
        border: '1px solid rgba(255,255,255,0.07)',
        borderRadius: 20,
        ...style,
      }}
    >
      {children}
    </div>
  )
}

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
            {[80, 56, 56].map((h, i) => (
              <div key={i} className="rounded-2xl animate-pulse"
                style={{ height: h, background: C.dark, opacity: 0.25 }} />
            ))}
          </div>
        ) : (
          <>
            {/* ── ZONA DARK — métricas principais ── */}

            {/* Disponível */}
            <Link href="/saldo" className="block mb-3 group">
              <DarkCard style={{ padding: '22px 24px' }}>
                <div className="flex items-start justify-between">
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: 8 }}>
                      Disponível hoje
                    </p>
                    <p style={{
                      fontFamily: 'var(--font-poppins, sans-serif)',
                      fontSize: 42,
                      fontWeight: 800,
                      lineHeight: 1,
                      letterSpacing: '-1px',
                      color: data.disponivel >= 0 ? C.orange : C.red,
                    }}>
                      {formatCurrency(data.disponivel)}
                    </p>
                    <p style={{ color: 'rgba(255,255,255,0.22)', fontSize: 11, marginTop: 8 }}>
                      Após despesas e metas · Ver detalhamento
                    </p>
                  </div>
                  <ChevronRight size={18} color="rgba(255,255,255,0.2)" style={{ marginTop: 4, transition: 'color 0.15s' }} />
                </div>
              </DarkCard>
            </Link>

            {/* Grid 2 colunas — Impostos + Metas */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <DarkCard style={{ padding: '18px 20px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(217,119,6,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Receipt size={15} color="#d97706" />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 500 }}>Impostos</p>
                </div>
                <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 22, fontWeight: 700, color: '#d97706' }}>
                  {formatCurrency(data.tax_reserve)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 4 }}>Reservado este mês</p>
              </DarkCard>

              <DarkCard style={{ padding: '18px 20px' }}>
                <div className="flex items-center gap-2 mb-3">
                  <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(255,138,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Target size={15} color={C.orange} />
                  </div>
                  <p style={{ color: 'rgba(255,255,255,0.38)', fontSize: 11, fontWeight: 500 }}>Metas</p>
                </div>
                <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 22, fontWeight: 700, color: C.orange }}>
                  {formatCurrency(data.goals_this_month)}
                </p>
                <p style={{ color: 'rgba(255,255,255,0.2)', fontSize: 10, marginTop: 4 }}>Guardado este mês</p>
              </DarkCard>
            </div>

            {/* A receber */}
            {data.receivable_30d > 0 && (
              <DarkCard style={{ padding: '16px 20px', marginBottom: 12 }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <TrendingUp size={17} color="#10b981" />
                    </div>
                    <div>
                      <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 11 }}>A receber (30 dias)</p>
                      <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 20, fontWeight: 700, color: '#10b981' }}>
                        {formatCurrency(data.receivable_30d)}
                      </p>
                    </div>
                  </div>
                  {data.receivables_overdue > 0 && (
                    <div className="text-right">
                      <div className="flex items-center gap-1 justify-end mb-0.5">
                        <AlertTriangle size={11} color={C.red} />
                        <p style={{ fontSize: 10, fontWeight: 700, color: C.red }}>Em atraso</p>
                      </div>
                      <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 14, fontWeight: 700, color: C.red }}>
                        {formatCurrency(data.receivables_overdue)}
                      </p>
                    </div>
                  )}
                </div>
              </DarkCard>
            )}

            {/* ── ZONA CLARA — listas e ações ── */}

            {/* Metas e Reservas */}
            {data.goals.length > 0 ? (
              <div className="mb-3 mt-5">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">Metas e Reservas</p>
                  <Link href="/objetivos" className="text-[11px] font-semibold" style={{ color: C.orange }}>Ver todas →</Link>
                </div>
                <div className="space-y-2.5">
                  {data.goals.map((g) => (
                    <Link key={g.id} href={`/objetivos/${g.id}`}
                      className="block bg-white rounded-2xl p-4 hover:shadow-md transition-shadow"
                      style={{ border: '1px solid #eef0f3' }}>
                      <div className="flex justify-between items-center mb-2.5">
                        <span className="text-sm font-semibold text-slate-800">{g.name}</span>
                        <span style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 700, fontSize: 15, color: g.pct >= 80 ? '#059669' : C.orange }}>
                          {g.pct}%
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${g.pct}%`, background: g.pct >= 80 ? '#10b981' : C.orange }} />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{formatCurrency(g.accumulated_amount)} / {formatCurrency(g.target_amount)}</span>
                        {g.estimated_completion && (
                          <span className="flex items-center gap-1"><Clock size={10} />{g.estimated_completion}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ) : (
              <Link href="/objetivos/novo"
                className="block mb-3 mt-5 rounded-2xl p-5 text-center transition-colors"
                style={{ border: `2px dashed rgba(255,138,0,0.3)`, background: 'rgba(255,138,0,0.03)' }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(255,138,0,0.07)' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(255,138,0,0.03)' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,138,0,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
                  <Target size={22} color={C.orange} />
                </div>
                <p className="text-sm font-semibold" style={{ color: C.orange }}>Criar primeira meta</p>
                <p className="text-xs text-slate-400 mt-1">Reserve parte das entradas para um objetivo</p>
              </Link>
            )}

            {/* Assistente */}
            {data.recommendations.length > 0 && (
              <div className="mb-3">
                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2.5">Assistente</p>
                <div className="space-y-2">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="flex gap-3 items-start rounded-2xl px-4 py-3.5"
                      style={{ background: C.dark, border: '1px solid rgba(255,255,255,0.07)' }}>
                      <Lightbulb size={15} color={C.orange} style={{ flexShrink: 0, marginTop: 1 }} />
                      <p className="text-sm text-slate-300 leading-snug">{rec}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ações rápidas */}
            <div className="grid grid-cols-3 gap-2 mt-5">
              {[
                { href: '/receitas/nova',  icon: <TrendingUp size={20} />,  label: 'Nova receita',  color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
                { href: '/despesas/nova',  icon: <TrendingDown size={20} />, label: 'Nova despesa',  color: C.red,     bg: 'rgba(229,9,20,0.07)' },
                { href: '/objetivos/novo', icon: <Target size={20} />,       label: 'Nova meta',     color: C.orange,  bg: 'rgba(255,138,0,0.08)' },
              ].map(({ href, icon, label, color, bg }) => (
                <Link key={href} href={href}
                  className="bg-white rounded-2xl p-3 text-center hover:shadow-md transition-shadow"
                  style={{ border: '1px solid #eef0f3' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 8px', color }}>
                    {icon}
                  </div>
                  <p className="text-xs font-medium text-slate-600">{label}</p>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
