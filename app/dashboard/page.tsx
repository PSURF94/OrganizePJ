'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import type { DashboardSummary } from '@/lib/constants'
import Link from 'next/link'

const EMPTY: DashboardSummary = {
  revenue: 0, expenses: 0, net_profit: 0,
  tax_reserve: 0, available: 0,
  receivables_pending: 0, receivables_overdue: 0,
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary>(EMPTY)
  const [loading, setLoading] = useState(true)
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const year = now.getFullYear()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  useEffect(() => {
    fetch(`/api/dashboard?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => { setSummary(d); setLoading(false) })
      .catch(() => setLoading(false))
  }, [year, month])

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-sm text-slate-400 capitalize">{monthLabel}</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : (
          <>
            {/* Cards principais */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Faturamento</p>
                <p className="text-lg font-bold text-emerald-600">{formatCurrency(summary.revenue)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Despesas</p>
                <p className="text-lg font-bold text-red-500">{formatCurrency(summary.expenses)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Lucro líquido</p>
                <p className={`text-lg font-bold ${summary.net_profit >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(summary.net_profit)}
                </p>
              </div>
              <div className="bg-white rounded-2xl p-4">
                <p className="text-xs text-slate-500 mb-1">Impostos estimados</p>
                <p className="text-lg font-bold text-amber-500">{formatCurrency(summary.tax_reserve)}</p>
              </div>
            </div>

            {/* Disponível */}
            <div className="bg-blue-600 rounded-2xl p-4 mb-4 text-white">
              <p className="text-xs opacity-80 mb-1">Disponível (após impostos)</p>
              <p className="text-2xl font-bold">{formatCurrency(summary.available)}</p>
            </div>

            {/* Contas a receber */}
            <div className="bg-white rounded-2xl p-4 mb-4">
              <h2 className="font-semibold text-slate-700 text-sm mb-3">Contas a receber</h2>
              <div className="flex justify-between">
                <div>
                  <p className="text-xs text-slate-500">Pendente</p>
                  <p className="font-bold text-slate-800">{formatCurrency(summary.receivables_pending)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-red-500">Atrasado</p>
                  <p className="font-bold text-red-500">{formatCurrency(summary.receivables_overdue)}</p>
                </div>
              </div>
            </div>

            {/* Ações rápidas */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <Link href="/receitas/nova"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50">
                <p className="text-2xl mb-1">💰</p>Nova receita
              </Link>
              <Link href="/despesas/nova"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50">
                <p className="text-2xl mb-1">💸</p>Nova despesa
              </Link>
              <Link href="/clientes/novo"
                className="bg-white rounded-2xl p-3 text-center text-xs font-medium text-slate-700 hover:bg-blue-50">
                <p className="text-2xl mb-1">👤</p>Novo cliente
              </Link>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
