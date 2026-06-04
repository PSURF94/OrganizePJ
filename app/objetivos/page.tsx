'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

type Goal = {
  id: string
  name: string
  target_amount: number
  accumulated_amount: number
  percentage_allocation: number
  is_active: boolean
  goal_contributions: Array<{ amount: number; date: string }>
}

function estimateCompletion(goal: Goal): string | null {
  const remaining = Number(goal.target_amount) - Number(goal.accumulated_amount)
  if (remaining <= 0) return 'Concluído!'
  const contributions = goal.goal_contributions || []
  if (contributions.length === 0) return null

  const since = new Date(); since.setDate(since.getDate() - 60)
  const sinceISO = since.toISOString().split('T')[0]
  const recent = contributions.filter((c) => c.date >= sinceISO)
  if (recent.length === 0) return null

  const total = recent.reduce((s, c) => s + Number(c.amount), 0)
  const monthlyAvg = total / 2
  if (monthlyAvg <= 0) return null

  const months = Math.ceil(remaining / monthlyAvg)
  const d = new Date(); d.setMonth(d.getMonth() + months)
  return d.toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
}

export default function ObjetivosPage() {
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/goals').then((r) => r.json()).then((d) => {
      setGoals(Array.isArray(d) ? d : [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const activeGoals = goals.filter((g) => g.is_active)
  const totalAccumulated = activeGoals.reduce((s, g) => s + Number(g.accumulated_amount), 0)
  const totalPerc = activeGoals.reduce((s, g) => s + Number(g.percentage_allocation), 0)

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Metas e Reservas</h1>
            <p className="text-sm text-slate-400">Construindo o futuro da empresa</p>
          </div>
          <Link href="/objetivos/novo"
            className="bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl">
            + Novo
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : activeGoals.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">🎯</p>
            <p className="text-slate-700 font-semibold mb-1">Nenhuma meta ainda</p>
            <p className="text-sm text-slate-400 mb-6">
              Crie sua primeira meta e comece a reservar parte de cada entrada automaticamente.
            </p>
            <Link href="/objetivos/novo"
              className="bg-blue-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl">
              Criar primeira meta
            </Link>
          </div>
        ) : (
          <>
            {/* Resumo */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400 mb-1">Total acumulado</p>
                <p className="text-lg font-bold text-blue-600">{formatCurrency(totalAccumulated)}</p>
              </div>
              <div className="bg-white rounded-2xl p-4 shadow-sm">
                <p className="text-xs text-slate-400 mb-1">% reservado por entrada</p>
                <p className="text-lg font-bold text-slate-800">{totalPerc.toFixed(1)}%</p>
              </div>
            </div>

            {/* Goals */}
            <div className="space-y-3">
              {activeGoals.map((goal) => {
                const pct = Math.min(100, Math.round((Number(goal.accumulated_amount) / Number(goal.target_amount)) * 100))
                const preview = estimateCompletion(goal)

                return (
                  <Link key={goal.id} href={`/objetivos/${goal.id}`}
                    className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-semibold text-slate-800">{goal.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {goal.percentage_allocation > 0 ? `${goal.percentage_allocation}% de cada entrada` : 'Sem alocação automática'}
                        </p>
                      </div>
                      <span className="text-xl font-bold text-slate-700">{pct}%</span>
                    </div>

                    {/* Thermometer */}
                    <div className="h-3 bg-slate-100 rounded-full mb-2 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${pct}%`,
                          background: pct >= 80 ? '#10b981' : pct >= 40 ? '#3b82f6' : '#6366f1',
                        }}
                      />
                    </div>

                    <div className="flex justify-between text-xs text-slate-500">
                      <span>{formatCurrency(goal.accumulated_amount)} acumulado</span>
                      <span>Meta: {formatCurrency(goal.target_amount)}</span>
                    </div>

                    {preview && (
                      <p className="text-xs text-slate-400 mt-2">
                        Previsão: <span className="font-medium text-slate-600">{preview}</span>
                      </p>
                    )}
                  </Link>
                )
              })}
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
