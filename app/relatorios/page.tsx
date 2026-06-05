'use client'
import { useEffect, useState, type ElementType } from 'react'
import Link from 'next/link'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, BarChart3, PieChart as PieIcon, Target } from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts'

type ChartType = 'fluxo' | 'mensal' | 'categorias' | 'metas'

interface TlEvent {
  date: string
  type: string
  amount: number
  running_balance: number
}
interface Expense { category: string; amount: number }
interface Goal { name: string; target_amount: number; accumulated_amount: number }

const PALETTE = ['#FF8A00', '#3b82f6', '#10b981', '#8b5cf6', '#f43f5e', '#14b8a6', '#f59e0b']

const OPTIONS: { key: ChartType; label: string; icon: ElementType }[] = [
  { key: 'fluxo',      label: 'Fluxo de caixa',     icon: TrendingUp },
  { key: 'mensal',     label: 'Rec. × Desp.',        icon: BarChart3  },
  { key: 'categorias', label: 'Por categoria',       icon: PieIcon    },
  { key: 'metas',      label: 'Metas',               icon: Target     },
]

const CHART_COLOR: Record<ChartType, string> = {
  fluxo:      '#FF8A00',
  mensal:     '#10b981',
  categorias: '#3b82f6',
  metas:      '#8b5cf6',
}

function fMonth(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString('pt-BR', { month: 'short' })
}

function fDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

function CurrencyTooltip({ active, payload, label }: { active?: boolean; payload?: { color: string; name: string; value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white rounded-xl shadow-lg border border-slate-100 px-3 py-2 text-xs">
      {label && <p className="text-slate-400 mb-1.5 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {formatCurrency(p.value)}
        </p>
      ))}
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="w-full flex items-center justify-center h-[260px]">
      <p className="text-sm text-slate-400">{msg}</p>
    </div>
  )
}

export default function RelatoriosPage() {
  const [chart, setChart] = useState<ChartType>('fluxo')
  const [events, setEvents] = useState<TlEvent[]>([])
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [goals, setGoals] = useState<Goal[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      fetch('/api/timeline').then((r) => r.json()),
      fetch('/api/expenses').then((r) => r.json()),
      fetch('/api/goals').then((r) => r.json()),
    ]).then(([tl, exp, gl]) => {
      setEvents((tl.events ?? []) as TlEvent[])
      setExpenses(Array.isArray(exp) ? (exp as Expense[]) : [])
      setGoals(Array.isArray(gl) ? (gl as Goal[]) : [])
      setLoading(false)
    })
  }, [])

  // ── Derived datasets ──
  const fluxoData = events.slice(-40).map((ev) => ({
    date: fDate(ev.date),
    Saldo: ev.running_balance,
  }))

  const monthMap: Record<string, { month: string; Receitas: number; Despesas: number }> = {}
  events.forEach((ev) => {
    const m = ev.date.slice(0, 7)
    if (!monthMap[m]) monthMap[m] = { month: fMonth(m), Receitas: 0, Despesas: 0 }
    if (ev.type === 'receita') monthMap[m].Receitas += Math.abs(ev.amount)
    else monthMap[m].Despesas += Math.abs(ev.amount)
  })
  const mensalData = Object.values(monthMap).slice(-6)

  const catMap: Record<string, number> = {}
  expenses.forEach((e) => {
    const cat = e.category || 'Outros'
    catMap[cat] = (catMap[cat] || 0) + Number(e.amount)
  })
  const catData = Object.entries(catMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)

  const metasData = goals.map((g) => ({
    name: g.name.length > 16 ? g.name.slice(0, 14) + '…' : g.name,
    Realizado: g.accumulated_amount,
    Meta: g.target_amount,
  }))

  // ── Chart renderer ──
  function renderChart() {
    if (chart === 'fluxo') {
      if (!fluxoData.length) return <Empty msg="Sem eventos de fluxo de caixa" />
      return (
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={fluxoData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Line type="monotone" dataKey="Saldo" stroke="#FF8A00" strokeWidth={2.5}
              dot={false} activeDot={{ r: 5, fill: '#FF8A00' }} />
          </LineChart>
        </ResponsiveContainer>
      )
    }

    if (chart === 'mensal') {
      if (!mensalData.length) return <Empty msg="Sem dados mensais" />
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={mensalData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar dataKey="Receitas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={28} />
            <Bar dataKey="Despesas" fill="#FF8A00" radius={[4, 4, 0, 0]} maxBarSize={28} />
          </BarChart>
        </ResponsiveContainer>
      )
    }

    if (chart === 'categorias') {
      if (!catData.length) return <Empty msg="Sem despesas registradas" />
      const total = catData.reduce((s, d) => s + d.value, 0)
      return (
        <div className="w-full">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Despesas · por categoria</p>
              <p className="text-sm font-semibold text-slate-700 mt-0.5">Total: {formatCurrency(total)}</p>
            </div>
          </div>
          <div className="flex items-center gap-4" style={{ height: 220 }}>
            <div className="flex-shrink-0" style={{ width: '45%', height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={catData} dataKey="value" cx="50%" cy="50%"
                    innerRadius={55} outerRadius={90} paddingAngle={3}>
                    {catData.map((_, i) => (
                      <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CurrencyTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[220px] pr-1">
              {catData.map((d, i) => {
                const pct = total > 0 ? ((d.value / total) * 100).toFixed(1) : '0'
                return (
                  <div key={i} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ background: PALETTE[i % PALETTE.length] }} />
                      <span className="text-xs text-slate-600 truncate">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-[10px] text-slate-400">{pct}%</span>
                      <span className="text-xs font-semibold text-slate-800">{formatCurrency(d.value)}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )
    }

    if (chart === 'metas') {
      if (!metasData.length) return <Empty msg="Nenhuma meta cadastrada" />
      return (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={metasData} layout="vertical" margin={{ top: 8, right: 20, left: 8, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
            <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} axisLine={false}
              tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} />
            <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} width={80} />
            <Tooltip content={<CurrencyTooltip />} />
            <Bar dataKey="Realizado" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={14} />
            <Bar dataKey="Meta" fill="#e2e8f0" radius={[0, 4, 4, 0]} maxBarSize={14} />
          </BarChart>
        </ResponsiveContainer>
      )
    }
  }

  return (
    <AppShell>
      <div className="px-4 pt-6 pb-10 max-w-2xl mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-5">Relatórios</h1>

        {/* Chart card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: '1px solid #eef0f3',
          borderTop: `3px solid ${CHART_COLOR[chart]}`,
          padding: '24px 20px',
          marginBottom: 12,
          minHeight: 340,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 2px 16px rgba(0,0,0,0.04)',
          transition: 'border-top-color 0.3s',
        }}>
          {loading
            ? <p className="text-sm text-slate-400">Carregando dados...</p>
            : <div className="w-full">{renderChart()}</div>
          }
        </div>

        {/* Selector */}
        <div className="grid grid-cols-4 gap-2">
          {OPTIONS.map((o) => {
            const active = chart === o.key
            const Icon = o.icon
            return (
              <button key={o.key} onClick={() => setChart(o.key)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                  padding: '14px 6px',
                  borderRadius: 16,
                  border: active ? `1px solid ${CHART_COLOR[o.key]}33` : '1px solid transparent',
                  background: active ? '#1A1A1D' : 'white',
                  color: active ? CHART_COLOR[o.key] : '#94a3b8',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}>
                <Icon size={18} strokeWidth={active ? 2.2 : 1.8} />
                <span style={{ fontSize: 11, fontWeight: 600, lineHeight: 1.2, textAlign: 'center' }}>{o.label}</span>
              </button>
            )
          })}
        </div>

        {/* PRO: Relatório com IA */}
        <Link href="/em-breve?f=relatorio-ia" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 12, border: '1.5px dashed rgba(255,138,0,0.35)', borderRadius: 16, padding: '14px 18px', textDecoration: 'none', background: 'rgba(255,138,0,0.03)', transition: 'background 0.15s' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,138,0,0.07)' }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(255,138,0,0.03)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1D', marginBottom: 2 }}>Relatório com IA</p>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Saúde financeira, projeções e insights automáticos</p>
          </div>
          <span style={{ flexShrink: 0, background: 'linear-gradient(135deg,#FF8A00,#FF3B30)', borderRadius: 100, padding: '5px 12px', color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            USE NO PRO
          </span>
        </Link>
      </div>
    </AppShell>
  )
}
