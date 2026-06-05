'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

type Client = { id: string; name: string }

export default function EditarReceitaPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({ description: '', amount: '', due_date: '', client_id: '' })

  useEffect(() => {
    Promise.all([
      fetch(`/api/receivables/${id}`).then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([rec, cls]) => {
      setForm({
        description: rec.description || '',
        amount: String(rec.amount || ''),
        due_date: rec.due_date || '',
        client_id: rec.client_id || '',
      })
      setClients(Array.isArray(cls) ? cls : [])
      setLoading(false)
    })
  }, [id])

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const res = await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        description: form.description,
        amount: Number(form.amount),
        due_date: form.due_date,
        client_id: form.client_id || null,
      }),
    })
    if (!res.ok) {
      const d = await res.json()
      setError(d.error || 'Erro ao salvar.')
      setSaving(false)
      return
    }
    router.push('/receitas')
  }

  if (loading) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-slate-600">← Voltar</button>
          <h1 className="text-xl font-bold text-slate-900">Editar Receita</h1>
        </div>
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
            <input required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
            <input type="number" step="0.01" min="0" required value={form.amount}
              onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data de vencimento *</label>
            <input type="date" required value={form.due_date} onChange={(e) => setForm((p) => ({ ...p, due_date: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => setForm((p) => ({ ...p, client_id: e.target.value }))}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]">
              <option value="">— Nenhum —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {error && <p className="text-red-500 text-xs">{error}</p>}
          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar alterações'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
