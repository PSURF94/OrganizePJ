'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Company, TaxRegime } from '@/lib/constants'
import { TAX_REGIMES } from '@/lib/constants'
import { SERVICE_CATEGORIES, calcTaxRecommendation } from '@/lib/tax-engine'

export default function ConfiguracoesPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({
    name: '', cnpj: '',
    faturamento_mensal: '', num_funcionarios: '',
    tax_regime: 'simples' as TaxRegime,
    service_category: '', folha_mensal: '', saldo_inicial: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d: Company) => {
        setCompany(d)
        setForm({
          name: d.name,
          cnpj: d.cnpj || '',
          faturamento_mensal: d.faturamento_mensal ? String(d.faturamento_mensal) : '',
          num_funcionarios: d.num_funcionarios !== undefined ? String(d.num_funcionarios) : '',
          tax_regime: d.tax_regime,
          service_category: d.service_category || '',
          folha_mensal: d.folha_mensal ? String(d.folha_mensal) : '',
          saldo_inicial: d.saldo_inicial ? String(d.saldo_inicial) : '',
        })
      })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  // Recommendation derived from current form values
  const mensal = Number(form.faturamento_mensal) || 0
  const nFunc = Number(form.num_funcionarios) || 0
  const folha = Number(form.folha_mensal) || 0
  const rec = mensal > 0
    ? calcTaxRecommendation(mensal, nFunc, form.service_category || null, folha)
    : null

  const regimesDiffer = rec && rec.regime !== form.tax_regime
  const isMei = form.tax_regime === 'mei'

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const rate = rec ? rec.rate : Number(company?.simples_rate ?? 0)
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        simples_rate: rate,
        das_fixo_mensal: rec?.das_fixo_mensal ?? null,
      }),
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

        <form onSubmit={handleSave} className="space-y-4">

          {/* Empresa */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</p>
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
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Saldo inicial em conta <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.saldo_inicial}
                onChange={(e) => set('saldo_inicial', e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>

          {/* Tributação */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tributação</p>

            {/* Parâmetros de base */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Faturamento mensal (R$)</label>
                <input type="number" min="0" step="0.01" value={form.faturamento_mensal}
                  onChange={(e) => set('faturamento_mensal', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Funcionários</label>
                <input type="number" min="0" step="1" value={form.num_funcionarios}
                  onChange={(e) => set('num_funcionarios', e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de serviço</label>
              <select value={form.service_category} onChange={(e) => set('service_category', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">— Não informado —</option>
                {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Folha de pagamento mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.folha_mensal}
                onChange={(e) => set('folha_mensal', e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <p className="text-xs text-slate-400 mt-1">Salários pagos. Usado no Fator R (Simples Nacional).</p>
            </div>

            {/* Regime recomendado */}
            {rec && (
              <div className={`rounded-xl p-3 border ${regimesDiffer ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-0.5">Regime recomendado</p>
                    <p className={`text-base font-bold ${regimesDiffer ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {rec.label}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-0.5">{rec.faixa_tributacao}</p>
                  </div>
                  {regimesDiffer && (
                    <button
                      type="button"
                      onClick={() => set('tax_regime', rec.regime)}
                      className="text-xs bg-amber-600 text-white px-3 py-1.5 rounded-lg font-medium"
                    >
                      Usar
                    </button>
                  )}
                </div>
                {regimesDiffer && (
                  <p className="text-[11px] text-amber-600 mt-2">
                    Seu regime atual ({TAX_REGIMES[form.tax_regime]}) difere do recomendado para seu perfil.
                  </p>
                )}
              </div>
            )}

            {/* Regime selecionado */}
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Regime tributário</label>
              <select value={form.tax_regime} onChange={(e) => set('tax_regime', e.target.value as TaxRegime)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                {Object.entries(TAX_REGIMES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Confirme com seu contador antes de alterar.</p>
            </div>

            {/* Alíquota calculada — somente leitura */}
            <div className="bg-slate-50 rounded-xl p-3">
              <p className="text-xs font-medium text-slate-500 mb-1">Alíquota calculada automaticamente</p>
              {isMei ? (
                <p className="text-lg font-bold text-slate-800">DAS fixo ~R$ 80,90/mês</p>
              ) : rec ? (
                <p className="text-lg font-bold text-slate-800">{rec.rate}%</p>
              ) : (
                <p className="text-lg font-bold text-slate-800">{company.simples_rate}%</p>
              )}
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isMei ? 'Fixo — não varia com o faturamento' : 'Atualizada conforme regime, serviço e folha informados acima'}
              </p>
            </div>
          </div>

          {/* Status */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <p>Status: <strong className="text-slate-700">
              {company.status === 'trial' ? 'Trial' : company.status === 'active' ? 'Ativa' : 'Expirada'}
            </strong></p>
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
