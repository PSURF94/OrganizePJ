'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import type { Client, Service } from '@/lib/constants'
import { todayISO, formatCurrency, formatDate, capFirst, formatCurrencyInput, parseCurrencyInput } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'

type InstallInterval = 'monthly' | 'weekly' | 'biweekly'
type ManualRow = { date: string; amount: string }

function generateInstallDates(start: string, count: number, interval: InstallInterval): string[] {
  const dates: string[] = []
  const d = new Date(start + 'T12:00:00')
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().split('T')[0])
    if (interval === 'monthly') d.setMonth(d.getMonth() + 1)
    else if (interval === 'weekly') d.setDate(d.getDate() + 7)
    else d.setDate(d.getDate() + 14)
  }
  return dates
}

const INTERVAL_LABEL: Record<InstallInterval, string> = {
  monthly: 'Mensal',
  weekly: 'Semanal',
  biweekly: 'Quinzenal',
}

export default function NovaReceitaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [services, setServices] = useState<Service[]>([])

  const [form, setForm] = useState({
    description: '',
    amount: '',
    due_date: todayISO(),
    client_id: '',
    service_id: '',
  })

  const [payType, setPayType] = useState<'single' | 'installment'>('single')
  const [installMode, setInstallMode] = useState<'auto' | 'manual'>('auto')
  const [autoCount, setAutoCount] = useState('3')
  const [autoInterval, setAutoInterval] = useState<InstallInterval>('monthly')
  const [manualRows, setManualRows] = useState<ManualRow[]>([{ date: todayISO(), amount: '' }])

  useEffect(() => {
    Promise.all([
      fetch('/api/clients').then((r) => r.json()),
      fetch('/api/services').then((r) => r.json()),
    ]).then(([cls, svcs]) => {
      setClients(Array.isArray(cls) ? cls : [])
      setServices(Array.isArray(svcs) ? svcs : [])
    })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const autoTotal = parseCurrencyInput(form.amount)
  const countNum = Math.max(1, Math.min(24, parseInt(autoCount) || 1))
  const amountEach = countNum > 0 ? Math.round((autoTotal / countNum) * 100) / 100 : 0
  const autoPreview = form.due_date && autoTotal > 0
    ? generateInstallDates(form.due_date, countNum, autoInterval)
    : []

  const manualTotal = manualRows.reduce((s, r) => s + parseCurrencyInput(r.amount), 0)

  function addManualRow() {
    const lastDate = manualRows[manualRows.length - 1]?.date || todayISO()
    const next = new Date(lastDate + 'T12:00:00')
    next.setMonth(next.getMonth() + 1)
    setManualRows((prev) => [...prev, { date: next.toISOString().split('T')[0], amount: '' }])
  }

  function removeManualRow(i: number) {
    setManualRows((prev) => prev.filter((_, idx) => idx !== i))
  }

  function updateManualRow(i: number, field: keyof ManualRow, value: string) {
    setManualRows((prev) => prev.map((r, idx) => idx === i
      ? { ...r, [field]: field === 'amount' ? formatCurrencyInput(value) : value }
      : r
    ))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) return
    setSaving(true)

    if (payType === 'single') {
      if (!form.amount || !form.due_date) { setSaving(false); return }
      await fetch('/api/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          amount: parseCurrencyInput(form.amount),
          due_date: form.due_date,
          client_id: form.client_id || null,
          service_id: form.service_id || null,
        }),
      })
    } else if (installMode === 'auto') {
      if (!form.amount || !form.due_date || countNum < 1) { setSaving(false); return }
      const installments = generateInstallDates(form.due_date, countNum, autoInterval)
        .map((due_date) => ({ due_date, amount: amountEach }))
      await fetch('/api/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          client_id: form.client_id || null,
          service_id: form.service_id || null,
          installments,
        }),
      })
    } else {
      const installments = manualRows
        .filter((r) => r.date && parseCurrencyInput(r.amount) > 0)
        .map((r) => ({ due_date: r.date, amount: parseCurrencyInput(r.amount) }))
      if (installments.length === 0) { setSaving(false); return }
      await fetch('/api/receivables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: form.description,
          client_id: form.client_id || null,
          service_id: form.service_id || null,
          installments,
        }),
      })
    }

    router.push('/receitas')
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]'

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-2xl mx-auto pb-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/receitas" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Nova Receita</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campos base */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
              <input required value={form.description} onChange={(e) => set('description', capFirst(e.target.value))}
                placeholder="Ex: Honorários — Projeto X"
                autoCapitalize="sentences"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Cliente (opcional)</label>
              <select value={form.client_id} onChange={(e) => set('client_id', e.target.value)}
                className={inputCls + ' bg-white'}>
                <option value="">— Nenhum —</option>
                {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Serviço vinculado (opcional)</label>
              <select value={form.service_id} onChange={(e) => set('service_id', e.target.value)}
                className={inputCls + ' bg-white'}>
                <option value="">— Nenhum —</option>
                {services.map((s) => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </div>
          </div>

          {/* Toggle Único / Parcelado */}
          <div className="flex rounded-xl overflow-hidden border border-slate-200">
            {(['single', 'installment'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setPayType(mode)}
                className="flex-1 py-2.5 text-sm font-semibold transition-colors"
                style={{
                  background: payType === mode ? '#FF8A00' : 'white',
                  color: payType === mode ? 'white' : '#64748b',
                }}
              >
                {mode === 'single' ? 'Único' : 'Parcelado'}
              </button>
            ))}
          </div>

          {/* ── Modo ÚNICO ── */}
          {payType === 'single' && (
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
                <input required type="text" inputMode="numeric" value={form.amount}
                  onChange={(e) => set('amount', formatCurrencyInput(e.target.value))} placeholder="0,00"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data de vencimento *</label>
                <input required type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
                  className={inputCls} />
              </div>
            </div>
          )}

          {/* ── Modo PARCELADO ── */}
          {payType === 'installment' && (
            <>
              {/* Sub-toggle Auto / Manual */}
              <div className="flex gap-2">
                {(['auto', 'manual'] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setInstallMode(m)}
                    className="flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors"
                    style={{
                      background: installMode === m ? '#1A1A1D' : 'white',
                      color: installMode === m ? 'white' : '#64748b',
                      borderColor: installMode === m ? '#1A1A1D' : '#e2e8f0',
                    }}
                  >
                    {m === 'auto' ? 'Automático' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* ── AUTO ── */}
              {installMode === 'auto' && (
                <div className="bg-white rounded-2xl p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Valor total (R$) *</label>
                    <input required type="text" inputMode="numeric" value={form.amount}
                      onChange={(e) => set('amount', formatCurrencyInput(e.target.value))} placeholder="0,00"
                      className={inputCls} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nº de parcelas</label>
                      <input required type="number" min="2" max="24" value={autoCount}
                        onChange={(e) => setAutoCount(e.target.value)} placeholder="3"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Intervalo</label>
                      <select value={autoInterval} onChange={(e) => setAutoInterval(e.target.value as InstallInterval)}
                        className={inputCls + ' bg-white'}>
                        {(Object.keys(INTERVAL_LABEL) as InstallInterval[]).map((k) => (
                          <option key={k} value={k}>{INTERVAL_LABEL[k]}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data da 1ª parcela *</label>
                    <input required type="date" value={form.due_date} onChange={(e) => set('due_date', e.target.value)}
                      className={inputCls} />
                  </div>

                  {/* Preview */}
                  {autoPreview.length > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 space-y-1.5">
                      <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                        Preview · {formatCurrency(amountEach)}/parcela
                      </p>
                      {autoPreview.map((date, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-600">
                          <span className="text-slate-400">{i + 1}/{countNum}</span>
                          <span>{formatDate(date)}</span>
                          <span className="font-medium text-slate-700">{formatCurrency(amountEach)}</span>
                        </div>
                      ))}
                      <div className="border-t border-slate-200 pt-1.5 mt-1 flex justify-between text-xs font-semibold">
                        <span className="text-slate-500">Total</span>
                        <span className="text-slate-800">{formatCurrency(autoTotal)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── MANUAL ── */}
              {installMode === 'manual' && (
                <div className="bg-white rounded-2xl p-5 space-y-3">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parcelas</p>

                  {manualRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <span className="text-xs text-slate-400 w-5 flex-shrink-0">{i + 1}</span>
                      <input
                        type="date" value={row.date}
                        onChange={(e) => updateManualRow(i, 'date', e.target.value)}
                        className="border border-slate-200 rounded-xl px-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] flex-1"
                      />
                      <div className="relative flex-1">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400">R$</span>
                        <input
                          type="text" inputMode="numeric" value={row.amount} placeholder="0,00"
                          onChange={(e) => updateManualRow(i, 'amount', e.target.value)}
                          className="border border-slate-200 rounded-xl pl-8 pr-2.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] w-full"
                        />
                      </div>
                      {manualRows.length > 1 && (
                        <button type="button" onClick={() => removeManualRow(i)}
                          className="text-slate-300 hover:text-red-400 flex-shrink-0">
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addManualRow}
                    className="flex items-center gap-1.5 text-xs text-[#FF8A00] font-semibold mt-1"
                  >
                    <Plus size={14} /> Adicionar parcela
                  </button>

                  {manualTotal > 0 && (
                    <div className="pt-3 border-t border-slate-100 flex justify-between text-sm font-semibold">
                      <span className="text-slate-500">Total</span>
                      <span className="text-slate-800">{formatCurrency(manualTotal)}</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saving ? 'Salvando...' : payType === 'single' ? 'Lançar Receita' : `Criar ${payType === 'installment' && installMode === 'auto' ? countNum : manualRows.filter(r => parseCurrencyInput(r.amount) > 0).length} parcelas`}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
