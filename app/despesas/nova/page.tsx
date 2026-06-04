'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { todayISO } from '@/lib/utils'
import Link from 'next/link'

export default function NovaDespesaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
    date: todayISO(),
    installment_total: '1',
  })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount) return
    setSaving(true)
    await fetch('/api/expenses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/despesas')
  }

  const total = Number(form.installment_total) || 1

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/despesas" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Nova Despesa</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
            <input required value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Ex: Assinatura Adobe CC"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Valor por parcela (R$) *</label>
              <input required type="number" min="0" step="0.01" value={form.amount}
                onChange={(e) => set('amount', e.target.value)} placeholder="0,00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Parcelas</label>
              <input type="number" min="1" max="60" value={form.installment_total}
                onChange={(e) => set('installment_total', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data (1ª parcela)</label>
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          {total > 1 && (
            <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
              Serão criadas <strong>{total} parcelas</strong> de <strong>R$ {Number(form.amount || 0).toFixed(2).replace('.', ',')}</strong> mensais.
            </div>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Lançar Despesa'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
