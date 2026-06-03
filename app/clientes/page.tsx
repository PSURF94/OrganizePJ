'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Client } from '@/lib/constants'
import Link from 'next/link'

export default function ClientesPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function load() {
    const res = await fetch('/api/clients')
    const data = await res.json()
    setClients(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Excluir cliente "${name}"? Os serviços vinculados serão desvinculados.`)) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    setClients((prev) => prev.filter((c) => c.id !== id))
  }

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Clientes</h1>
          <Link href="/clientes/novo"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Novo
          </Link>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-sm">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
            {!search && <Link href="/clientes/novo" className="text-blue-600 text-sm mt-2 inline-block">Cadastrar primeiro cliente</Link>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl divide-y divide-slate-100">
            {filtered.map((client) => (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{client.name}</p>
                  <p className="text-xs text-slate-400">
                    {[client.email, client.phone, client.cpf_cnpj].filter(Boolean).join(' · ') || 'Sem contato'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <Link href={`/clientes/${client.id}`}
                    className="text-xs text-blue-600 font-medium px-2 py-1 rounded-lg hover:bg-blue-50">
                    Ver
                  </Link>
                  <button onClick={() => handleDelete(client.id, client.name)}
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
