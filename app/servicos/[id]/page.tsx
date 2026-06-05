'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import type { Service, Client, ServiceStatus } from '@/lib/constants'
import { SERVICE_STATUSES, SERVICE_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const STATUS_ORDER: ServiceStatus[] = ['orcamento', 'aprovado', 'em_execucao', 'concluido', 'faturado', 'recebido']

export default function ServicoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [service, setService] = useState<Service | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [form, setForm] = useState({
    title: '', description: '', client_id: '', contracted_value: '', execution_date: '', expected_payment_date: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    Promise.all([
      fetch(`/api/services/${id}`).then((r) => r.json()),
      fetch('/api/clients').then((r) => r.json()),
    ]).then(([svc, cls]) => {
      setService(svc)
      setClients(Array.isArray(cls) ? cls : [])
      setForm({
        title: svc.title,
        description: svc.description || '',
        client_id: svc.client_id || '',
        contracted_value: String(svc.contracted_value),
        execution_date: svc.execution_date || '',
        expected_payment_date: svc.expected_payment_date || '',
      })
    })
  }, [id])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/services/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/servicos')
  }

  async function handleStatusChange(status: ServiceStatus) {
    const updated = await fetch(`/api/services/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    }).then((r) => r.json())
    setService((prev) => prev ? { ...prev, status: updated.status } : prev)
  }

  async function handleDelete() {
    if (!confirm(`Excluir serviço "${service?.title}"?`)) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    router.push('/servicos')
  }

  if (!service) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  const currentIdx = STATUS_ORDER.indexOf(service.status as ServiceStatus)

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/servicos" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Serviço</h1>
        </div>

        {/* Status workflow */}
        <div className="bg-white rounded-2xl p-4 mb-4">
          <p className="text-xs font-medium text-slate-500 mb-3">Status atual</p>
          <div className="flex gap-1.5 flex-wrap">
            {STATUS_ORDER.map((s, i) => (
              <button key={s} onClick={() => handleStatusChange(s)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  s === service.status
                    ? 'text-white shadow-sm'
                    : i < currentIdx ? 'text-slate-300' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
                style={s === service.status ? { backgroundColor: SERVICE_STATUS_COLORS[s] } : {}}>
                {SERVICE_STATUSES[s]}
              </button>
            ))}
          </div>
          <p className="text-xs text-slate-400 mt-3">Valor: <span className="font-semibold text-slate-700">{formatCurrency(service.contracted_value)}</span></p>
        </div>

        {/* Edit form */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Título *</label>
            <input required value={form.title} onChange={(e) => set('title', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Cliente</label>
            <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] bg-white">
              <option value="">— Sem cliente —</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
            <input required type="number" min="0" step="0.01" value={form.contracted_value}
              onChange={(e) => set('contracted_value', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data execução</label>
              <input type="date" value={form.execution_date} onChange={(e) => set('execution_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Previsão de faturamento</label>
              <input type="date" value={form.expected_payment_date} onChange={(e) => set('expected_payment_date', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Descrição</label>
            <textarea value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] resize-none" />
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        <button onClick={handleDelete} className="w-full mt-3 text-red-400 text-sm py-2 hover:text-red-600">
          Excluir serviço
        </button>
      </div>
    </AppShell>
  )
}
