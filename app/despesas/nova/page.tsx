'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import AppShell from '@/components/AppShell'
import { EXPENSE_CATEGORIES } from '@/lib/constants'
import { todayISO, formatCurrency, formatDate, capFirst } from '@/lib/utils'
import Link from 'next/link'
import { Plus, Trash2 } from 'lucide-react'

type ManualRow = { date: string; amount: string }

export default function NovaDespesaPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    category: EXPENSE_CATEGORIES[0],
    description: '',
    amount: '',
    date: todayISO(),
    installment_total: '1',
  })

  const [payType, setPayType] = useState<'single' | 'installment'>('single')
  const [installMode, setInstallMode] = useState<'auto' | 'manual'>('auto')
  const [manualRows, setManualRows] = useState<ManualRow[]>([{ date: todayISO(), amount: '' }])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const autoCount = Math.max(1, Math.min(60, parseInt(form.installment_total) || 1))
  const manualTotal = manualRows.reduce((s, r) => s + (Number(r.amount) || 0), 0)

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
    setManualRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: value } : r))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.description.trim()) return
    setSaving(true)

    if (payType === 'single') {
      if (!form.amount || !form.date) { setSaving(false); return }
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, installment_total: 1 }),
      })
    } else if (installMode === 'auto') {
      if (!form.amount || !form.date) { setSaving(false); return }
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, installment_total: autoCount }),
      })
    } else {
      const installments = manualRows
        .filter((r) => r.date && Number(r.amount) > 0)
        .map((r) => ({ date: r.date, amount: Number(r.amount) }))
      if (installments.length === 0) { setSaving(false); return }
      await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: form.category,
          description: form.description,
          installments,
        }),
      })
    }

    router.push('/despesas')
  }

  const inputCls = 'w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]'

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto pb-10">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/despesas" className="text-slate-400 hover:text-slate-600 text-sm">← Voltar</Link>
          <h1 className="text-xl font-bold text-slate-900">Nova Despesa</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">

          {/* Campos base */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Categoria</label>
              <select value={form.category} onChange={(e) => set('category', e.target.value)}
                className={inputCls + ' bg-white'}>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Descrição *</label>
              <input required value={form.description} onChange={(e) => set('description', capFirst(e.target.value))}
                placeholder="Ex: Assinatura Adobe CC"
                autoCapitalize="sentences"
                className={inputCls} />
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
                {mode === 'single' ? 'Único' : 'Parcelado / Recorrente'}
              </button>
            ))}
          </div>

          {/* ── Modo ÚNICO ── */}
          {payType === 'single' && (
            <div className="bg-white rounded-2xl p-5 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Valor (R$) *</label>
                <input required type="number" min="0" step="0.01" value={form.amount}
                  onChange={(e) => set('amount', e.target.value)} placeholder="0,00"
                  className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Data *</label>
                <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
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
                    {m === 'auto' ? 'Automático (mensal)' : 'Manual'}
                  </button>
                ))}
              </div>

              {/* ── AUTO ── */}
              {installMode === 'auto' && (
                <div className="bg-white rounded-2xl p-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Valor por parcela (R$) *</label>
                      <input required type="number" min="0" step="0.01" value={form.amount}
                        onChange={(e) => set('amount', e.target.value)} placeholder="0,00"
                        className={inputCls} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Nº de parcelas</label>
                      <input type="number" min="1" max="60" value={form.installment_total}
                        onChange={(e) => set('installment_total', e.target.value)}
                        className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Data (1ª parcela) *</label>
                    <input required type="date" value={form.date} onChange={(e) => set('date', e.target.value)}
                      className={inputCls} />
                  </div>
                  {autoCount > 1 && Number(form.amount) > 0 && (
                    <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
                      Serão criadas <strong className="text-slate-700">{autoCount} parcelas</strong> de{' '}
                      <strong className="text-slate-700">{formatCurrency(Number(form.amount))}</strong> mensais.
                      Total: <strong className="text-slate-700">{formatCurrency(Number(form.amount) * autoCount)}</strong>
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
                          type="number" min="0" step="0.01" value={row.amount} placeholder="0,00"
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
                  <button type="button" onClick={addManualRow}
                    className="flex items-center gap-1.5 text-xs text-[#FF8A00] font-semibold mt-1">
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
            {saving ? 'Salvando...' : payType === 'single'
              ? 'Lançar Despesa'
              : installMode === 'auto'
                ? `Criar ${autoCount} parcela${autoCount > 1 ? 's' : ''}`
                : `Criar ${manualRows.filter(r => Number(r.amount) > 0).length} parcelas`}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
