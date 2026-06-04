'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import type { Client, Service } from '@/lib/constants'
import { todayISO } from '@/lib/utils'
import Link from 'next/link'

export default function NovaReceitaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [form, setForm] = useState({
    description: '',
    amount: '',
    due_date: todayISO(),
    client_id: '',
    service_id: '',
  })

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then((r) => r.json()),
      fetch('/api/services').then((r) => r.json()),
    ]).then(([cls, svcs]) => {
      setClients(Array.isArray(cls) ? cls : [])
      setServices(Array.isArray(svcs) ? svcs : [])
    })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim() || !form.amount || !form.due_date) return
    setSaving(true)
    await fetch('/api/receivables', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/receitas')
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/receitas" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Nova Receita</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
            <input required value={form.description} onChange={(e) => set('description', e.target.value)}
              placeholder="Ex: Honorários — Projeto X"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
            <input required type="number" min="0" step="0.01" value={form.amount}
              onChange={(e) => set('amount', e.target.value)} placeholder="0,00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Data de vencimento *</label>
            <input required type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente (opcional)</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Nenhum —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Serviço vinculado (opcional)</label>
            <select value={form.service_id} onChange={(e) => set('service_id', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              <option value="">— Nenhum —</option>
              {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
            </select>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Lançar Receita'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
