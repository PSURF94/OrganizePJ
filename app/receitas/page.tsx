'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Receivable } from '@/lib/constants'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'
import Link from 'next/link'
import { TrendingUp } from 'lucide-react'

const STATUS_STYLE: Record<string, string> = {
  pendente: 'bg-amber-50 text-amber-600',
  recebido: 'bg-emerald-50 text-emerald-600',
  atrasado: 'bg-red-50 text-red-500',
}

const STATUS_LABEL: Record<string, string> = {
  pendente: 'Pendente',
  recebido: 'Recebido',
  atrasado: 'Atrasado',
}

export default function ReceitasPage() {
  const [items, setItems] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  async function load() {
    const res = await fetch('/api/receivables')
    const data = await res.json()
    setItems(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function markReceived(id: string) {
    window.location.href = `/receitas/${id}/receber`
  }

  async function handleDelete(id: string) {
    if (!confirm('Excluir este recebível?')) return
    await fetch(`/api/receivables/${id}`, { method: 'DELETE' })
    setItems((prev) => prev.filter((r) => r.id !== id))
  }

  const filtered = filter === 'all' ? items : items.filter((r) => r.status === filter)
  const total = filtered.reduce((s, r) => s + Number(r.amount), 0)

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Receitas</h1>
          <Link href="/receitas/nova" className="bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Nova
          </Link>
        </div>

        <div className="flex gap-2 mb-4">
          {['all', 'pendente', 'atrasado', 'recebido'].map((f) => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-full text-xs font-medium ${filter === f ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
              {f === 'all' ? 'Todas' : STATUS_LABEL[f]}
            </button>
          ))}
        </div>

        {!loading && filtered.length > 0 && (
          <div className="bg-white rounded-2xl p-4 mb-4 flex justify-between items-center">
            <span className="text-xs text-slate-500">Total ({filtered.length})</span>
            <span className="font-bold text-slate-800">{formatCurrency(total)}</span>
          </div>
        )}

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <TrendingUp size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Nenhuma receita encontrada</p>
            <Link href="/receitas/nova" className="text-[#FF8A00] text-sm mt-2 inline-block">Lançar receita</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((r) => (
              <div key={r.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-slate-800">{r.description}</p>
                      {r.installment_total > 1 && (
                        <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full font-medium flex-shrink-0">
                          {r.installment_number}/{r.installment_total}
                        </span>
                      )}
                    </div>
                    {r.client && <p className="text-xs text-slate-400 mt-0.5">{(r.client as { name: string }).name}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">Vence {formatDate(r.due_date)}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-slate-800">{formatCurrency(r.amount)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full mt-1 inline-block ${STATUS_STYLE[r.status]}`}>
                      {STATUS_LABEL[r.status]}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  {r.status !== 'recebido' && (
                    <button onClick={() => markReceived(r.id)}
                      className="text-xs text-emerald-600 font-medium px-2 py-1 rounded-lg hover:bg-emerald-50">
                      Marcar recebido
                    </button>
                  )}
                  <Link href={`/receitas/${r.id}/editar`}
                    className="text-xs text-[#FF8A00] font-medium px-2 py-1 rounded-lg hover:bg-orange-50">
                    Editar
                  </Link>
                  <button onClick={() => handleDelete(r.id)}
                    className="text-xs text-slate-300 hover:text-red-400 px-2 py-1 rounded-lg">
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
