'use client'
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import AppShell from '@/components/AppShell'
import type { Client } from '@/lib/constants'
import Link from 'next/link'
import { capFirst } from '@/lib/utils'

export default function ClienteDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [client, setClient] = useState<Client | null>(null)
  const [form, setForm] = useState({ name: '', cpf_cnpj: '', email: '', phone: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/api/clients/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setClient(data)
        setForm({ name: data.name, cpf_cnpj: data.cpf_cnpj || '', email: data.email || '', phone: data.phone || '' })
      })
  }, [id])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch(`/api/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    router.push('/clientes')
  }

  async function handleDelete() {
    if (!confirm(`Excluir cliente "${client?.name}"?`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    router.push('/clientes')
  }

  if (!client) return (
    <AppShell>
      <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
    </AppShell>
  )

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/clientes" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Editar Cliente</h1>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome *</label>
            <input required value={form.name} onChange={(e) => set('name', capFirst(e.target.value))}
              autoCapitalize="words"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">CPF / CNPJ</label>
            <input value={form.cpf_cnpj} onChange={(e) => set('cpf_cnpj', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
            <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
            <input value={form.phone} onChange={(e) => set('phone', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </form>

        <button onClick={handleDelete}
          className="w-full mt-3 text-red-400 text-sm py-2 hover:text-red-600">
          Excluir cliente
        </button>
      </div>
    </AppShell>
  )
}
