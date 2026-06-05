'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Expense } from '@/lib/constants'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import Link from 'next/link'
import { TrendingDown } from 'lucide-react'

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
  const [adiando, setAdiando] = useState<string | null>(null)
  const [novaData, setNovaData] = useState('')

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

  async function handleAdiar(id: string) {
    if (!novaData) return
    await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ date: novaData }),
    })
    setItems((prev) => prev.map((e) => e.id === id ? { ...e, date: novaData } : e))
    setAdiando(null)
  }

  const total = items.reduce((s, e) => s + Number(e.amount), 0)

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22, color: '#1A1A1D', letterSpacing: '-0.3px', paddingLeft: 11, borderLeft: '3px solid #FF8A00' }}>Despesas</h1>
          <Link href="/despesas/nova" className="bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl">
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
            <TrendingDown size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Nenhuma despesa em {label}</p>
            <Link href="/despesas/nova" className="text-[#FF8A00] text-sm mt-2 inline-block">Lançar despesa</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((e) => (
              <div key={e.id} className="bg-white rounded-2xl px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-slate-800">{e.description}</p>
                    <p className="text-xs text-slate-400">
                      {e.category} · {formatDate(e.date)}
                      {e.installment_total > 1 && (
                        <span className="ml-1">({e.installment_number}/{e.installment_total})</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                    <p className="font-semibold text-sm text-slate-800">{formatCurrency(e.amount)}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => { setAdiando(e.id); setNovaData(e.date) }}
                        className="text-xs text-blue-400 hover:text-blue-600 font-medium"
                      >
                        Adiar
                      </button>
                      <Link href={`/despesas/${e.id}/editar`} className="text-xs text-[#FF8A00] hover:text-orange-600">
                        Editar
                      </Link>
                      <button onClick={() => handleDelete(e.id)} className="text-xs text-slate-300 hover:text-red-400">
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Inline adiar */}
                {adiando === e.id && (
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex-shrink-0">Nova data:</span>
                    <input
                      type="date"
                      value={novaData}
                      onChange={(ev) => setNovaData(ev.target.value)}
                      className="flex-1 border border-slate-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-blue-400"
                    />
                    <button
                      onClick={() => handleAdiar(e.id)}
                      className="text-xs bg-blue-500 text-white font-semibold px-3 py-1.5 rounded-lg hover:bg-blue-600"
                    >
                      Confirmar
                    </button>
                    <button
                      onClick={() => setAdiando(null)}
                      className="text-xs text-slate-400 hover:text-slate-600 px-1"
                    >
                      ✕
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
