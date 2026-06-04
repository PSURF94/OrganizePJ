'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Company, TaxRegime } from '@/lib/constants'
import { TAX_REGIMES } from '@/lib/constants'
import { SERVICE_CATEGORIES } from '@/lib/tax-engine'

export default function ConfiguracoesPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({ name: '', cnpj: '', tax_regime: 'simples' as TaxRegime, simples_rate: '', saldo_inicial: '', service_category: '', folha_mensal: '' })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d) => {
        setCompany(d)
        setForm({ name: d.name, cnpj: d.cnpj || '', tax_regime: d.tax_regime, simples_rate: String(d.simples_rate), saldo_inicial: d.saldo_inicial ? String(d.saldo_inicial) : '', service_category: d.service_category || '', folha_mensal: d.folha_mensal ? String(d.folha_mensal) : '' })
      })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!company) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Configurações</h1>

        <form onSubmit={handleSave} className="bg-white rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Nome da empresa *</label>
            <input required value={form.name} onChange={(e) => set('name', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">CNPJ</label>
            <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)}
              placeholder="00.000.000/0001-00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Regime tributário</label>
            <select value={form.tax_regime} onChange={(e) => set('tax_regime', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
              {Object.entries(TAX_REGIMES).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de serviço</label>
            <select value={form.service_category} onChange={(e) => set('service_category', e.target.value)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">— Não informado —</option>
              {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <p className="text-xs text-slate-400 mt-1">Define se você usa Anexo III ou V no Simples Nacional.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Folha de pagamento mensal (R$)</label>
            <input type="number" min="0" step="0.01" value={form.folha_mensal}
              onChange={(e) => set('folha_mensal', e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-slate-400 mt-1">Salários pagos. Usado no cálculo do Fator R (Simples Nacional).</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Alíquota de imposto (%)</label>
            <input type="number" min="0" max="100" step="0.01" value={form.simples_rate}
              onChange={(e) => set('simples_rate', e.target.value)}
              placeholder="6.00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-slate-400 mt-1">Calculada automaticamente pelo diagnóstico. Ajuste aqui se seu contador confirmar valor diferente.</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">
              Saldo inicial em conta <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input type="number" min="0" step="0.01" value={form.saldo_inicial}
              onChange={(e) => set('saldo_inicial', e.target.value)}
              placeholder="0.00"
              className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <p className="text-xs text-slate-400 mt-1">Dinheiro que você já tinha antes de começar a usar o sistema. Somado ao seu disponível.</p>
          </div>

          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <p>Status da licença: <strong className="text-slate-700">{company.status === 'trial' ? 'Trial' : company.status === 'active' ? 'Ativa' : 'Expirada'}</strong></p>
            {company.status === 'trial' && company.trial_ends_at && (
              <p className="mt-0.5">Trial expira em: <strong className="text-slate-700">{new Date(company.trial_ends_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
            {company.status === 'active' && company.license_expires_at && (
              <p className="mt-0.5">Licença até: <strong className="text-slate-700">{new Date(company.license_expires_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>
      </div>
    </AppShell>
  )
}
