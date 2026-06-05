'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Service, ServiceStatus } from '@/lib/constants'
import { SERVICE_STATUSES, SERVICE_STATUS_COLORS } from '@/lib/constants'
import { formatCurrency, formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Briefcase } from 'lucide-react'

const ALL = 'all'

export default function ServicosPage() {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<string>(ALL)

  async function load() {
    const res = await fetch('/api/services')
    const data = await res.json()
    setServices(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Excluir serviço "${title}"?`)) return
    await fetch(`/api/services/${id}`, { method: 'DELETE' })
    setServices((prev) => prev.filter((s) => s.id !== id))
  }

  const filtered = filter === ALL ? services : services.filter((s) => s.status === filter)

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-slate-900">Serviços</h1>
          <Link href="/servicos/novo" className="bg-[#FF8A00] text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Novo
          </Link>
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          <button onClick={() => setFilter(ALL)}
            className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${filter === ALL ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
            Todos
          </button>
          {Object.entries(SERVICE_STATUSES).map(([key, label]) => (
            <button key={key} onClick={() => setFilter(key)}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap flex-shrink-0 ${filter === key ? 'bg-slate-800 text-white' : 'bg-white text-slate-500'}`}>
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <Briefcase size={40} className="mx-auto mb-3 text-slate-300" />
            <p className="text-sm">Nenhum serviço encontrado</p>
            <Link href="/servicos/novo" className="text-[#FF8A00] text-sm mt-2 inline-block">Criar primeiro serviço</Link>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((s) => (
              <div key={s.id} className="bg-white rounded-2xl p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full flex-shrink-0"
                        style={{ backgroundColor: SERVICE_STATUS_COLORS[s.status] }} />
                      <span className="text-xs text-slate-400">{SERVICE_STATUSES[s.status as ServiceStatus]}</span>
                    </div>
                    <p className="font-medium text-sm text-slate-800">{s.title}</p>
                    {s.client && <p className="text-xs text-slate-400 mt-0.5">{(s.client as { name: string }).name}</p>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-semibold text-sm text-slate-800">{formatCurrency(s.contracted_value)}</p>
                    {s.expected_payment_date && (
                      <p className="text-xs text-slate-400">vence {formatDate(s.expected_payment_date)}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                  <Link href={`/servicos/${s.id}`}
                    className="text-xs text-[#FF8A00] font-medium px-2 py-1 rounded-lg hover:bg-orange-50">
                    Ver / Editar
                  </Link>
                  <button onClick={() => handleDelete(s.id, s.title)}
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
