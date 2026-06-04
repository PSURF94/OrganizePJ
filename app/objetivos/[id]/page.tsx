'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { formatCurrency, formatDate, todayISO } from '@/lib/utils'

type Contribution = { id: string; amount: number; date: string; note: string | null; receivable_id: string | null }
type Goal = {
  id: string; name: string; target_amount: number; accumulated_amount: number
  percentage_allocation: number; is_active: boolean
  goal_contributions: Contribution[]
}

function parseCurrencyInput(v: string) { return Number(v.replace(/\D/g, '')) / 100 }
function fmtInput(v: string) {
  const d = v.replace(/\D/g, '')
  if (!d) return ''
  return (Number(d) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function ObjetivoDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()

  const [goal, setGoal] = useState<Goal | null>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [manualAmount, setManualAmount] = useState('')
  const [manualNote, setManualNote] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch(`/api/goals/${id}`)
    if (res.ok) setGoal(await res.json())
    setLoading(false)
  }

  useEffect(() => { load() }, [id])

  async function handleContribute(e: React.FormEvent) {
    e.preventDefault()
    const amount = parseCurrencyInput(manualAmount)
    if (amount <= 0) { setError('Informe o valor.'); return }
    setSaving(true)
    const res = await fetch(`/api/goals/${id}/contribute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, note: manualNote || null, date: todayISO() }),
    })
    if (!res.ok) { setError('Erro ao salvar.'); setSaving(false); return }
    setManualAmount(''); setManualNote(''); setShowForm(false); setSaving(false)
    load()
  }

  async function handleDelete() {
    if (!confirm('Excluir este objetivo e todas as contribuições?')) return
    await fetch(`/api/goals/${id}`, { method: 'DELETE' })
    router.push('/objetivos')
  }

  async function removeContribution(contributionId: string) {
    if (!confirm('Remover esta contribuição?')) return
    await fetch(`/api/goals/${id}/contribute?contribution_id=${contributionId}`, { method: 'DELETE' })
    load()
  }

  if (loading) return (
    <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>
  )
  if (!goal) return (
    <AppShell><div className="text-center py-20 text-slate-400 text-sm">Objetivo não encontrado.</div></AppShell>
  )

  const pct = Math.min(100, Math.round((Number(goal.accumulated_amount) / Number(goal.target_amount)) * 100))
  const remaining = Number(goal.target_amount) - Number(goal.accumulated_amount)
  const sorted = [...(goal.goal_contributions || [])].sort((a, b) => b.date.localeCompare(a.date))

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-sm mx-auto">
        <button onClick={() => router.back()} className="text-xs text-slate-400 mb-4 hover:text-slate-600">
          ← Voltar
        </button>

        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">{goal.name}</h1>
            {goal.percentage_allocation > 0 && (
              <p className="text-xs text-slate-400 mt-0.5">{goal.percentage_allocation}% de cada entrada</p>
            )}
          </div>
          <button onClick={handleDelete} className="text-xs text-slate-300 hover:text-red-400">Excluir</button>
        </div>

        {/* Thermometer card */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <div className="flex justify-between items-end mb-3">
            <div>
              <p className="text-xs text-slate-400">Acumulado</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(goal.accumulated_amount)}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Meta</p>
              <p className="text-lg font-bold text-slate-700">{formatCurrency(goal.target_amount)}</p>
            </div>
          </div>

          <div className="h-4 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{
                width: `${pct}%`,
                background: pct >= 80 ? '#10b981' : pct >= 40 ? '#3b82f6' : '#6366f1',
              }}
            />
          </div>

          <div className="flex justify-between text-xs text-slate-500">
            <span>{pct}% concluído</span>
            {remaining > 0 && <span>Faltam {formatCurrency(remaining)}</span>}
            {remaining <= 0 && <span className="text-emerald-600 font-semibold">Objetivo concluído! 🎉</span>}
          </div>
        </div>

        {/* Contribuição manual */}
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full mb-4 border-2 border-dashed border-blue-200 text-blue-600 rounded-2xl py-3 text-sm font-semibold hover:bg-blue-50 transition-colors"
        >
          {showForm ? 'Cancelar' : '+ Contribuição manual'}
        </button>

        {showForm && (
          <form onSubmit={handleContribute} className="bg-white rounded-2xl p-5 mb-4 shadow-sm space-y-3">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Valor</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                <input
                  type="text" inputMode="numeric" autoFocus
                  value={manualAmount}
                  onChange={(e) => setManualAmount(fmtInput(e.target.value))}
                  className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0,00"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Observação (opcional)</label>
              <input
                type="text" value={manualNote} onChange={(e) => setManualNote(e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Ex: Saldo extra de maio"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button type="submit" disabled={saving}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
              {saving ? 'Salvando...' : 'Salvar contribuição'}
            </button>
          </form>
        )}

        {/* Histórico */}
        {sorted.length > 0 && (
          <>
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Histórico</h2>
            <div className="space-y-2">
              {sorted.map((c) => (
                <div key={c.id} className="bg-white rounded-xl px-4 py-3 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-sm font-semibold text-emerald-600">+{formatCurrency(c.amount)}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {formatDate(c.date)}{c.note ? ` · ${c.note}` : ''}{c.receivable_id ? ' · via receita' : ''}
                    </p>
                  </div>
                  <button
                    onClick={() => removeContribution(c.id)}
                    className="text-xs text-slate-300 hover:text-red-400 px-2 py-1"
                  >
                    Remover
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
