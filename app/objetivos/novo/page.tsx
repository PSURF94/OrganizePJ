'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'

const SUGESTOES = [
  'Comprar drone',
  'Comprar veículo',
  'Capital de giro',
  'Reserva de emergência',
  'Contratar assistente',
  'Equipamentos',
  'Expandir operação',
]

function parseCurrencyInput(v: string) {
  const d = v.replace(/\D/g, '')
  if (!d) return 0
  return Number(d) / 100
}

function fmtInput(v: string) {
  const d = v.replace(/\D/g, '')
  if (!d) return ''
  return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function NovoObjetivoPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [targetRaw, setTargetRaw] = useState('')
  const [pct, setPct] = useState(5)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const target = parseCurrencyInput(targetRaw)
    if (!name.trim()) { setError('Informe o nome do objetivo.'); return }
    if (target <= 0) { setError('Informe o valor-meta.'); return }

    setLoading(true)
    const res = await fetch('/api/goals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), target_amount: target, percentage_allocation: pct }),
    })
    if (!res.ok) { setError('Erro ao criar objetivo.'); setLoading(false); return }
    router.push('/objetivos')
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-sm mx-auto">
        <button onClick={() => router.back()} className="text-xs text-slate-400 mb-6 hover:text-slate-600">
          ← Voltar
        </button>
        <h1 className="text-xl font-bold text-slate-900 mb-6">Novo objetivo</h1>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="text-xs font-medium text-slate-600 block mb-2">O que você quer conquistar?</label>
            <input
              list="sugestoes-list"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Ex: Comprar drone, Capital de giro..."
            />
            <datalist id="sugestoes-list">
              {SUGESTOES.map((s) => <option key={s} value={s} />)}
            </datalist>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-600 block mb-1">Valor-meta</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
              <input
                type="text" inputMode="numeric"
                value={targetRaw}
                onChange={(e) => setTargetRaw(fmtInput(e.target.value))}
                className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="0,00"
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-medium text-slate-600">% reservado por entrada</label>
              <span className="text-sm font-bold text-blue-600">{pct}%</span>
            </div>
            <input
              type="range" min="0" max="50" step="1"
              value={pct}
              onChange={(e) => setPct(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-[11px] text-slate-400 mt-1">
              <span>0%</span>
              <span>Sem alocação automática</span>
              <span>50%</span>
            </div>
            {pct > 0 && targetRaw && (
              <div className="mt-3 bg-blue-50 rounded-xl p-3 text-xs text-blue-700">
                Em uma entrada de R$5.000, serão reservados{' '}
                <strong>R$ {(5000 * pct / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> para este objetivo.
              </div>
            )}
          </div>

          {error && <p className="text-red-500 text-xs">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-blue-600 text-white rounded-2xl py-3 text-sm font-semibold disabled:opacity-60">
            {loading ? 'Criando...' : 'Criar objetivo'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
