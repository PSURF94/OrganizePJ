'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import type { Client } from '@/lib/constants'
import { todayISO } from '@/lib/utils'
import Link from 'next/link'

export default function NovoServicoPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    client_id: '',
    contracted_value: '',
    execution_date: '',
    expected_payment_date: todayISO(),
  })

  useEffect(() => {
    fetch('/api/clients').then((r) => r.json()).then((d) => setClients(Array.isArray(d) ? d : []))
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim() || !form.contracted_value) return
    setSaving(true)
    await fetch('/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/servicos')
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/servicos" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Novo Serviço</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título *</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              placeholder="Ex: Consultoria de TI — Empresa X"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Sem cliente vinculado —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor contratado (R$) *</label>
            <input required type="number" min="0" step="0.01" value={form.contracted_value}
              onChange={(e) => set('contracted_value', e.target.value)}
              placeholder="0,00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data de execução</label>
              <input type="date" value={form.execution_date} onChange={(e) => set('execution_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Prev. pagamento</label>
              <input type="date" value={form.expected_payment_date} onChange={(e) => set('expected_payment_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={3} placeholder="Detalhes do serviço..."
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Criar Serviço'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
