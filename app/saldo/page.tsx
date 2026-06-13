'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'
import { useRouter } from 'next/navigation'

type Data = {
  saldo_inicial: number
  total_received_ever: number
  total_expenses_ever: number
  total_goals_ever: number
  disponivel: number
}

function Row({ label, value, sign, highlight }: { label: string; value: number; sign?: '+' | '-'; highlight?: boolean }) {
  const color = sign === '+' ? 'text-emerald-600' : sign === '-' ? 'text-red-500' : highlight ? (value >= 0 ? 'text-slate-900' : 'text-red-600') : 'text-slate-700'
  return (
    <div className={`flex justify-between items-center py-3 ${highlight ? 'border-t-2 border-slate-200' : 'border-t border-slate-100'}`}>
      <span className={`text-sm ${highlight ? 'font-bold text-slate-900' : 'text-slate-600'}`}>{label}</span>
      <span className={`text-sm font-semibold ${color}`}>
        {sign && sign}{formatCurrency(value)}
      </span>
    </div>
  )
}

export default function SaldoPage() {
  const router = useRouter()
  const [data, setData] = useState<Data | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = now.getFullYear()
    fetch(`/api/dashboard?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="text-xs text-slate-400 hover:text-slate-600">← Voltar</button>
          <h1 className="text-xl font-bold text-slate-900">Como chegamos nesse saldo</h1>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            <div className="bg-white rounded-2xl p-5 shadow-sm mb-4">
              <p className="text-xs text-slate-400 mb-4 uppercase tracking-wider">Composição do saldo acumulado</p>

              <Row label="Saldo inicial informado" value={data.saldo_inicial} sign="+" />
              <Row label="Total recebido (todas as receitas)" value={data.total_received_ever} sign="+" />
              <Row label="Total de despesas pagas" value={data.total_expenses_ever} sign="-" />
              <Row label="Total alocado em metas" value={data.total_goals_ever} sign="-" />
              <Row label="Disponível hoje" value={data.disponivel} highlight />
            </div>

            <div className="bg-orange-50 border border-orange-100 rounded-2xl p-4 text-sm text-orange-700 leading-relaxed">
              <p className="font-semibold mb-1">Como é calculado</p>
              <p className="text-xs">
                Saldo inicial + receitas recebidas − despesas pagas − valores alocados em metas.
                Impostos ainda não pagos não são descontados automaticamente — use a timeline para prever os próximos pagamentos de DAS.
              </p>
            </div>
          </>
        )}
      </div>
    </AppShell>
  )
}
