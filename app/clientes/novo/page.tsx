'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Link from 'next/link'

export default function NovoClientePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', cpf_cnpj: '', email: '', phone: '' })

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    router.push('/clientes')
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/clientes" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Novo Cliente</h1>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome *</label>
            <input
              required
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="Nome completo ou razão social"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">CPF / CNPJ</label>
            <input
              value={form.cpf_cnpj}
              onChange={(e) => set('cpf_cnpj', e.target.value)}
              placeholder="000.000.000-00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              placeholder="email@exemplo.com"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Telefone</label>
            <input
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
              placeholder="(11) 99999-9999"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50"
          >
            {saving ? 'Salvando...' : 'Cadastrar Cliente'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
