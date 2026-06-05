'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Client } from '@/lib/constants'
import Link from 'next/link'
import { Users } from 'lucide-react'

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
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 800, fontSize: 22, color: '#1A1A1D', letterSpacing: '-0.3px', paddingLeft: 11, borderLeft: '3px solid #FF8A00' }}>Clientes</h1>
          <Link href="/clientes/novo"
            className="bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Novo
          </Link>
        </div>

        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar cliente..."
          className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
        />

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Users size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">{search ? 'Nenhum cliente encontrado' : 'Nenhum cliente cadastrado'}</p>
            {!search && <Link href="/clientes/novo" className="text-[#FF8A00] text-sm mt-2 inline-block">Cadastrar primeiro cliente</Link>}
          </div>
        ) : (
          <div className="bg-white rounded-2xl divide-y divide-slate-100">
            {filtered.map((client) => (
              <div key={client.id} className="flex items-center gap-3 px-4 py-3">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-[#FF8A00] font-bold text-sm flex-shrink-0">
                  {client.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-slate-800 truncate">{client.name}</p>
                  <p className="text-xs text-slate-400">
                    {[client.email, client.phone, client.cpf_cnpj].filter(Boolean).join(' · ') || 'Sem contato'}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0 flex-wrap justify-end">
                  <Link href={`/clientes/${client.id}`}
                    className="text-xs text-[#FF8A00] font-medium px-2 py-1 rounded-lg hover:bg-orange-50">
                    Ver
                  </Link>
                  <button onClick={() => handleDelete(client.id, client.name)}
                    className="text-xs text-slate-300 hover:text-red-400 px-2 py-1 rounded-lg">
                    Excluir
                  </button>
                  <Link href="/em-breve?f=proposta-comercial"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 4, color: '#94a3b8', textDecoration: 'none', fontSize: 12, padding: '4px 8px', borderRadius: 8 }}>
                    Proposta <span style={{ fontSize: 9, background: 'rgba(255,138,0,0.1)', color: '#FF8A00', borderRadius: 4, padding: '1px 5px', fontWeight: 700 }}>PRO</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
