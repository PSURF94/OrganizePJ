'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Expense } from '@/lib/constants'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import Link from 'next/link'

function monthBounds(offset = 0) {
  const d = new Date()
  const y = d.getFullYear()
  const m = d.getMonth() + offset
  const first = new Date(y, m, 1)
  const last = new Date(y, m + 1, 0)
  const pad = (n: number) => String(n).padStart(2, '0')
  return {
    from: `${first.getFullYear()}-${pad(first.getMonth() + 1)}-01`,
    to: `${last.getFullYear()}-${pad(last.getMonth() + 1)}-${pad(last.getDate())}`,
    label: first.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }),
  }
}

export default function DespesasPage() {
  const [items, setItems] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [monthOffset, setMonthOffset] = useState(0)

  const { from, to, label } = monthBounds(monthOffset)

  async function load() {
    setLoading(true)
    const res = await fetch(`/api/expenses?from=${from}&to=${to}`)
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [from, to])

  async function handleDelete(id: string) {
    if (!confirm('Excluir esta despesa?')) return
    await fetch(`/api/expenses/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((e) => e.id !== id))
  }

  const total = items.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Despesas</h1>
          <Link href="/despesas/nova" className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Nova
          </Link>
        </div>

        <div className="flex items-center justify-between bg-white rounded-2xl px-4 py-3 mb-4">
          <button onClick={() => setMonthOffset((p) => p - 1)} className="text-slate-400 hover:text-slate-700 text-lg px-1">‹</button>
          <span className="text-sm font-medium text-slate-700 capitalize">{label}</span>
          <button onClick={() => setMonthOffset((p) => p + 1)} className="text-slate-400 hover:text-slate-700 text-lg px-1">›</button>
        </div>

        {!loading && items.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 flex justify-between items-center">
            <span className="text-xs text-slate-500">Total ({items.length})</span>
            <span className="font-bold text-red-500">{formatCurrency(total)}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : items.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">💸</p>
            <p className="text-sm">Nenhuma despesa em {label}</p>
            <Link href="/despesas/nova" className="text-blue-600 text-sm mt-2 inline-block">Lançar despesa</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl px-4 py-3 flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800">{e.description}</p>
                  <p className="text-xs text-slate-400">
                    {e.category} · {formatDate(e.date)}
                    {e.installment_total > 1 && (
                      <span className="ml-1 text-xs text-slate-400">({e.installment_number}/{e.installment_total})</span>
                    )}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-semibold text-sm text-slate-800">{formatCurrency(e.amount)}</p>
                  <button onClick={() => handleDelete(e.id)} className="text-xs text-slate-300 hover:text-red-400 mt-0.5">
                    Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
