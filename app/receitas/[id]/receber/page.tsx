'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { formatCurrency, todayISO } from '@/lib/utils'

type GoalRow = { id: string; name: string; percentage_allocation: number; target_amount: number; accumulated_amount: number }
type Receivable = { id: string; description: string; amount: number; due_date: string; client?: { name: string } | null }
type Contribution = { goal_id: string; name: string; amount: string }

function parseCurrency(v: string) {
  const digits = v.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

function fmtInput(v: string) {
  const digits = v.replace(/\D/g, '')
  if (!digits) return ''
  return (Number(digits) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ReceberPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [receivable, setReceivable] = useState<Receivable | null>(null)
  const [goals, setGoals] = useState<GoalRow[]>([])
  const [contributions, setContributions] = useState<Contribution[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch(`/api/receivables/${id}`).then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()),
    ]).then(([rec, gs]) => {
      setReceivable(rec)
      const activeGoals: GoalRow[] = (Array.isArray(gs) ? gs : []).filter((g: GoalRow) => g.percentage_allocation > 0)
      setGoals(activeGoals)
      if (rec?.amount) {
        const amount = Number(rec.amount)
        setContributions(activeGoals.map((g: GoalRow) => ({
          goal_id: g.id,
          name: g.name,
          amount: fmtInput(String(Math.round(amount * g.percentage_allocation) * 100)),
        })))
      }
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [id])

  function updateContribution(goalId: string, raw: string) {
    setContributions((prev) => prev.map((c) => c.goal_id === goalId ? { ...c, amount: fmtInput(raw) } : c))
  }

  const totalGoals = contributions.reduce((s, c) => s + parseCurrency(c.amount), 0)
  const amount = Number(receivable?.amount || 0)
  const disponivel = amount - totalGoals

  async function handleConfirm() {
    setSaving(true)
    setError('')
    const res = await fetch(`/api/receivables/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        received_date: todayISO(),
        contributions: contributions.map((c) => ({ goal_id: c.goal_id, amount: parseCurrency(c.amount) })),
      }),
    })
    if (!res.ok) {
      setError('Erro ao registrar recebimento.')
      setSaving(false)
      return
    }
    router.push('/receitas')
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">Carregando...</div>
  )

  if (!receivable) return (
    <div className="min-h-screen flex items-center justify-center text-red-400 text-sm">Recebível não encontrado.</div>
  )

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-8">
      <div className="max-w-sm mx-auto">
        <button onClick={() => router.back()} className="text-xs text-slate-400 mb-6 hover:text-slate-600">
          ← Voltar
        </button>

        <h1 className="text-lg font-bold text-slate-900 mb-1">Confirmar recebimento</h1>
        <p className="text-sm text-slate-400 mb-6">{receivable.description}</p>

        {/* Valor total */}
        <div className="bg-emerald-600 rounded-2xl p-5 mb-5 text-white">
          <p className="text-xs opacity-75 mb-1">Valor recebido</p>
          <p className="text-3xl font-bold">{formatCurrency(amount)}</p>
          {receivable.client && <p className="text-xs opacity-60 mt-1">{(receivable.client as { name: string }).name}</p>}
        </div>

        {/* Distribuição */}
        {goals.length > 0 ? (
          <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm space-y-4">
            <h2 className="text-sm font-semibold text-slate-700">Distribuição desta entrada</h2>

            {contributions.map((c) => (
              <div key={c.goal_id}>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-600">🎯 {c.name}</label>
                  <span className="text-[11px] text-slate-400">
                    {goals.find((g) => g.id === c.goal_id)?.percentage_allocation}% da entrada
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                  <input
                    type="text" inputMode="numeric"
                    value={c.amount}
                    onChange={(e) => updateContribution(c.goal_id, e.target.value)}
                    className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ))}

            <div className="pt-3 border-t border-slate-100">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Objetivos total</span>
                <span className="font-semibold text-blue-600">{formatCurrency(totalGoals)}</span>
              </div>
              <div className="flex justify-between text-sm mt-1">
                <span className="font-semibold text-slate-700">Disponível</span>
                <span className={`font-bold ${disponivel >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {formatCurrency(disponivel)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-slate-100 rounded-2xl p-4 mb-4 text-center">
            <p className="text-sm text-slate-500">Nenhum objetivo com percentual configurado.</p>
            <p className="text-xs text-slate-400 mt-1">Crie objetivos para reservar parte das entradas automaticamente.</p>
          </div>
        )}

        {error && <p className="text-red-500 text-xs mb-3">{error}</p>}

        <button
          onClick={handleConfirm}
          disabled={saving}
          className="w-full bg-emerald-600 text-white rounded-2xl py-3.5 text-sm font-semibold disabled:opacity-60"
        >
          {saving ? 'Registrando...' : 'Confirmar recebimento'}
        </button>
      </div>
    </div>
  )
}
