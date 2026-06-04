'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'

interface MonthData {
  year: number
  month: number
  label: string
  totalReceivables: number
  totalExpenses: number
  tax: number
  net: number
}

export default function TimelinePage() {
  const [data, setData] = useState<MonthData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => { setData(Array.isArray(d) ? d : []); setLoading(false) })
  }, [])

  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentYear = today.getFullYear()

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Timeline Financeira</h1>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : (
          <div className="space-y-3">
            {data.map((m) => {
              const isCurrent = m.month === currentMonth && m.year === currentYear
              return (
                <div key={`${m.year}-${m.month}`}
                  className={`bg-white rounded-2xl p-4 ${isCurrent ? 'ring-2 ring-blue-400' : ''}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-slate-800 capitalize">{m.label}</p>
                      {isCurrent && <span className="text-xs bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">Atual</span>}
                    </div>
                    <p className={`font-bold text-sm ${m.net >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {formatCurrency(m.net)}
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-emerald-50 rounded-xl p-2">
                      <p className="text-xs text-emerald-600 mb-0.5">Receitas</p>
                      <p className="text-xs font-semibold text-emerald-700">{formatCurrency(m.totalReceivables)}</p>
                    </div>
                    <div className="bg-red-50 rounded-xl p-2">
                      <p className="text-xs text-red-500 mb-0.5">Despesas</p>
                      <p className="text-xs font-semibold text-red-600">{formatCurrency(m.totalExpenses)}</p>
                    </div>
                    <div className="bg-amber-50 rounded-xl p-2">
                      <p className="text-xs text-amber-600 mb-0.5">Imposto</p>
                      <p className="text-xs font-semibold text-amber-700">{formatCurrency(m.tax)}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppShell>
  )
}
