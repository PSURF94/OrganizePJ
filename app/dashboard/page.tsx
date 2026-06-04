'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type GoalSummary = {
  id: string; name: string; target_amount: number; accumulated_amount: number
  percentage_allocation: number; pct: number; estimated_completion: string | null
}

type DashboardData = {
  revenue: number; expenses: number; tax_reserve: number
  goals_this_month: number; disponivel: number
  receivables_pending: number; receivable_30d: number; receivables_overdue: number
  goals: GoalSummary[]; recommendations: string[]
}

const EMPTY: DashboardData = {
  revenue: 0, expenses: 0, tax_reserve: 0,
  goals_this_month: 0, disponivel: 0,
  receivables_pending: 0, receivable_30d: 0, receivables_overdue: 0,
  goals: [], recommendations: [],
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

        <div className="mb-6">
          <h1 className="text-xl font-bold text-slate-900">Painel</h1>
          <p className="text-sm text-slate-400 capitalize">{monthLabel}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : (
          <>
            {/* 3 Grandes Blocos */}
            <div className="bg-white rounded-2xl p-5 mb-3 shadow-sm">
              <p className="text-xs text-slate-400 mb-1">💼 Disponível hoje</p>
              <p className={`text-3xl font-bold ${data.disponivel >= 0 ? 'text-slate-900' : 'text-red-500'}`}>
                {formatCurrency(data.disponivel)}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">Após despesas, impostos e metas</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
                <p className="text-xs text-amber-600 font-medium mb-1">🧾 Impostos</p>
                <p className="text-lg font-bold text-amber-700">{formatCurrency(data.tax_reserve)}</p>
                <p className="text-[11px] text-amber-500 mt-0.5">Reservado este mês</p>
              </div>
              <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                <p className="text-xs text-blue-600 font-medium mb-1">🎯 Metas e Reservas</p>
                <p className="text-lg font-bold text-blue-700">{formatCurrency(data.goals_this_month)}</p>
                <p className="text-[11px] text-blue-500 mt-0.5">Guardado este mês</p>
              </div>
            </div>

            {/* Metas e Reservas */}
            {data.goals.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Metas e Reservas</h2>
                  <Link href="/objetivos" className="text-xs text-blue-600 font-medium">Ver todas →</Link>
                </div>
                <div className="space-y-3 mb-6">
                  {data.goals.map((g) => (
                    <Link key={g.id} href={`/objetivos/${g.id}`}
                      className="block bg-white rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-semibold text-slate-800">{g.name}</span>
                        <span className="text-sm font-bold text-blue-600">{g.pct}%</span>
                      </div>
                      <div className="h-2.5 bg-slate-100 rounded-full overflow-hidden mb-2">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${g.pct}%`,
                            background: g.pct >= 80 ? '#10b981' : g.pct >= 40 ? '#3b82f6' : '#6366f1',
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-[11px] text-slate-400">
                        <span>{formatCurrency(g.accumulated_amount)} / {formatCurrency(g.target_amount)}</span>
                        {g.estimated_completion && <span>Previsão: {g.estimated_completion}</span>}
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <Link href="/objetivos/novo"
                className="block mb-6 border-2 border-dashed border-blue-200 rounded-2xl p-5 text-center hover:bg-blue-50 transition-colors">
                <p className="text-2xl mb-1">🎯</p>
                <p className="text-sm font-semibold text-blue-600">Criar primeira meta</p>
                <p className="text-xs text-slate-400 mt-0.5">Reserve parte das suas entradas para um objetivo</p>
              </Link>
            )}

            {/* A receber */}
            {data.receivable_30d > 0 && (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 mb-6 flex justify-between items-center">
                <div>
                  <p className="text-xs text-emerald-600 font-medium">📥 A receber (30 dias)</p>
                  <p className="text-lg font-bold text-emerald-700 mt-0.5">{formatCurrency(data.receivable_30d)}</p>
                </div>
                {data.receivables_overdue > 0 && (
                  <div className="text-right">
                    <p className="text-xs text-red-500">⚠ Em atraso</p>
                    <p className="text-sm font-bold text-red-500">{formatCurrency(data.receivables_overdue)}</p>
                  </div>
                )}
              </div>
            )}

            {/* Assistente */}
            {data.recommendations.length > 0 && (
              <>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Assistente</h2>
                <div className="space-y-2 mb-6">
                  {data.recommendations.map((rec, i) => (
                    <div key={i} className="bg-slate-800 rounded-xl px-4 py-3 flex gap-3 items-start">
                      <span className="text-blue-400 shrink-0">💡</span>
                      <p className="text-sm text-slate-200 leading-snug">{rec}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Ações rápidas */}
            <div className="grid grid-cols-3 gap-2">
              <Link href="/receitas/nova"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50 shadow-sm">
                <p className="text-2xl mb-1">💰</p>Nova receita
              </Link>
              <Link href="/despesas/nova"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50 shadow-sm">
                <p className="text-2xl mb-1">💸</p>Nova despesa
              </Link>
              <Link href="/objetivos/novo"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50 shadow-sm">
                <p className="text-2xl mb-1">🎯</p>Nova meta
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
