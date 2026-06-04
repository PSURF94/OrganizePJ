'use client'
import { useEffect, useState, useRef } from 'react'
import AppShell from '@/components/AppShell'
import { formatCurrency } from '@/lib/utils'

interface TimelineEvent {
  date: string
  type: 'receita' | 'despesa' | 'imposto'
  description: string
  subtitle: string | null
  amount: number
  running_balance: number
  alert: 'ok' | 'warning' | 'critical'
}

interface TimelineData {
  current_balance: number
  events: TimelineEvent[]
}

function formatDateShort(iso: string) {
  const [year, month, day] = iso.split('-')
  return new Date(Number(year), Number(month) - 1, Number(day))
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const TYPE = {
  receita:  { dot: 'bg-emerald-500', border: 'border-emerald-500', text: 'text-emerald-600', label: 'Entrada', sign: '+' },
  despesa:  { dot: 'bg-red-500',     border: 'border-red-500',     text: 'text-red-500',     label: 'Despesa', sign: '−' },
  imposto:  { dot: 'bg-amber-500',   border: 'border-amber-400',   text: 'text-amber-600',   label: 'Imposto', sign: '−' },
}

export default function TimelinePage() {
  const [data, setData] = useState<TimelineData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<number | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/api/timeline')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false) })
  }, [])

  return (
    <AppShell>
      <div className="pt-6 pb-10">
        <div className="px-4 mb-5">
          <h1 className="text-xl font-bold text-slate-900">Timeline</h1>
          <p className="text-xs text-slate-400">Próximos 90 dias</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-slate-400 text-sm">Carregando...</div>
        ) : !data ? (
          <div className="text-center py-20 text-slate-400 text-sm">Erro ao carregar.</div>
        ) : (
          <>
            {/* Saldo atual */}
            <div className="px-4 mb-6">
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <p className="text-xs text-slate-400 mb-1">Saldo disponível agora</p>
                <p className={`text-2xl font-bold ${data.current_balance >= 0 ? 'text-slate-900' : 'text-red-600'}`}>
                  {formatCurrency(data.current_balance)}
                </p>
              </div>
            </div>

            {data.events.length === 0 ? (
              <div className="text-center py-16 text-slate-400 text-sm px-4">
                Nenhum evento financeiro nos próximos 90 dias.
              </div>
            ) : (
              <>
                {/* Timeline horizontal */}
                <div
                  ref={scrollRef}
                  className="overflow-x-auto pb-2"
                  style={{ WebkitOverflowScrolling: 'touch' }}
                >
                  <div className="flex items-end px-4" style={{ minWidth: `${Math.max(data.events.length * 140 + 80, 400)}px` }}>
                    {data.events.map((ev, i) => {
                      const t = TYPE[ev.type]
                      const nextEv = data.events[i + 1]
                      const lineColor = ev.running_balance < 0 ? 'bg-red-400' : 'bg-emerald-400'
                      const isSelected = selected === i

                      return (
                        <div key={i} className="flex items-end flex-shrink-0" style={{ width: 140 }}>
                          <div className="flex flex-col items-center w-full">
                            {/* Card do evento */}
                            <button
                              onClick={() => setSelected(isSelected ? null : i)}
                              className={`w-28 rounded-2xl p-3 text-left transition-all shadow-sm mb-3 border ${
                                isSelected
                                  ? `bg-white ${t.border} border-2`
                                  : 'bg-white border-slate-100 hover:border-slate-300'
                              }`}
                            >
                              <p className={`text-[10px] font-semibold uppercase tracking-wide mb-1 ${t.text}`}>{t.label}</p>
                              <p className="text-xs text-slate-700 font-medium leading-tight line-clamp-2">{ev.description}</p>
                              <p className={`text-sm font-bold mt-1 ${t.text}`}>
                                {t.sign}{formatCurrency(Math.abs(ev.amount))}
                              </p>
                              <p className="text-[10px] text-slate-400 mt-0.5">{formatDateShort(ev.date)}</p>
                            </button>

                            {/* Conector vertical */}
                            <div className={`w-0.5 h-5 ${t.dot}`} />

                            {/* Ponto na linha */}
                            <div className={`w-4 h-4 rounded-full ${t.dot} ring-2 ring-white shadow z-10`} />

                            {/* Linha horizontal até próximo evento */}
                            <div className="flex w-full items-center" style={{ height: 4 }}>
                              <div className={`flex-1 h-1 ${lineColor} rounded`} />
                              {!nextEv && <div className="w-3 h-1 bg-slate-200 rounded" />}
                            </div>

                            {/* Saldo após evento */}
                            <p className={`text-[10px] font-semibold mt-1 ${
                              ev.running_balance < 0 ? 'text-red-500' :
                              ev.alert === 'warning' ? 'text-amber-500' : 'text-slate-400'
                            }`}>
                              {formatCurrency(ev.running_balance)}
                            </p>
                            {ev.alert === 'critical' && (
                              <p className="text-[9px] text-red-500 font-bold">⚠ negativo</p>
                            )}
                            {ev.alert === 'warning' && (
                              <p className="text-[9px] text-amber-500 font-bold">⚠ baixo</p>
                            )}
                          </div>
                        </div>
                      )
                    })}

                    {/* Marcador de fim */}
                    <div className="flex flex-col items-center flex-shrink-0 w-10 pb-6">
                      <div className="w-3 h-3 rounded-full bg-slate-300 mt-auto mb-0.5" />
                      <p className="text-[9px] text-slate-300 rotate-0 whitespace-nowrap">90d</p>
                    </div>
                  </div>
                </div>

                {/* Detalhe do evento selecionado */}
                {selected !== null && (
                  <div className="px-4 mt-4">
                    <div className={`bg-white rounded-2xl p-4 shadow-sm border-l-4 ${
                      data.events[selected].type === 'receita' ? 'border-emerald-500' :
                      data.events[selected].type === 'despesa' ? 'border-red-500' : 'border-amber-400'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs text-slate-400 mb-0.5">{formatDateShort(data.events[selected].date)}</p>
                          <p className="text-sm font-semibold text-slate-800">{data.events[selected].description}</p>
                          {data.events[selected].subtitle && (
                            <p className="text-xs text-slate-400 mt-0.5">{data.events[selected].subtitle}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className={`text-base font-bold ${TYPE[data.events[selected].type].text}`}>
                            {TYPE[data.events[selected].type].sign}{formatCurrency(Math.abs(data.events[selected].amount))}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            saldo após: <span className={data.events[selected].running_balance < 0 ? 'text-red-500 font-semibold' : 'text-slate-600'}>
                              {formatCurrency(data.events[selected].running_balance)}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Legenda */}
                <div className="px-4 mt-5 flex gap-4 text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />Entrada</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500 inline-block" />Despesa</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />Imposto</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-1 rounded bg-red-400 inline-block" />Saldo negativo</span>
                </div>
              </>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}
