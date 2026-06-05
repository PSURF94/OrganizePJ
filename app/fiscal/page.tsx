'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Company, TaxRegime } from '@/lib/constants'
import { TAX_REGIMES } from '@/lib/constants'
import { SERVICE_CATEGORIES, calcTaxRecommendation } from '@/lib/tax-engine'
import { calcWithdrawalRecommendation } from '@/lib/withdrawal-engine'
import { formatCurrency } from '@/lib/utils'

export default function FiscalPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({
    faturamento_mensal: '',
    num_funcionarios: '',
    tax_regime: 'simples' as TaxRegime,
    service_category: '',
    folha_mensal: '',
    retirada_desejada_mensal: '',
    prolabore_mensal: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d: Company) => {
        setCompany(d)
        setForm({
          faturamento_mensal: d.faturamento_mensal ? String(d.faturamento_mensal) : '',
          num_funcionarios: d.num_funcionarios !== undefined ? String(d.num_funcionarios) : '',
          tax_regime: d.tax_regime,
          service_category: d.service_category || '',
          folha_mensal: d.folha_mensal ? String(d.folha_mensal) : '',
          retirada_desejada_mensal: d.retirada_desejada_mensal ? String(d.retirada_desejada_mensal) : '',
          prolabore_mensal: d.prolabore_mensal ? String(d.prolabore_mensal) : '',
        })
      })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const mensal = Number(form.faturamento_mensal) || 0
  const nFunc = Number(form.num_funcionarios) || 0
  const folha = Number(form.folha_mensal) || 0
  const rec = mensal > 0
    ? calcTaxRecommendation(mensal, nFunc, form.service_category || null, folha)
    : null

  const regimesDiffer = rec && rec.regime !== form.tax_regime
  const isMei = form.tax_regime === 'mei'

  const retiradaNum = Number(form.retirada_desejada_mensal) || 0
  const prolaboreNum = form.prolabore_mensal ? Number(form.prolabore_mensal) : null
  const wRec = retiradaNum > 0
    ? calcWithdrawalRecommendation(form.tax_regime, retiradaNum, prolaboreNum)
    : null

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    const rate = rec ? rec.rate : Number(company?.simples_rate ?? 0)
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: company?.name ?? '',
        cnpj: company?.cnpj ?? '',
        saldo_inicial: company?.saldo_inicial ?? null,
        ...form,
        simples_rate: rate,
        das_fixo_mensal: rec?.das_fixo_mensal ?? null,
        prolabore_mensal: form.prolabore_mensal ? Number(form.prolabore_mensal) : null,
        retirada_desejada_mensal: form.retirada_desejada_mensal ? Number(form.retirada_desejada_mensal) : null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!company) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto pb-10">
        <h1 className="text-xl font-bold text-slate-900 mb-1">Fiscal &amp; Retiradas</h1>
        <p className="text-sm text-slate-400 mb-6">Diagnóstico tributário e estratégia de retiradas do sócio.</p>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Parâmetros fiscais */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Parâmetros</p>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Faturamento mensal (R$)</label>
                <input type="number" min="0" step="0.01" value={form.faturamento_mensal}
                  onChange={(e) => set('faturamento_mensal', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Funcionários</label>
                <input type="number" min="0" step="1" value={form.num_funcionarios}
                  onChange={(e) => set('num_funcionarios', e.target.value)}
                  placeholder="0"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Tipo de serviço</label>
              <select value={form.service_category} onChange={(e) => set('service_category', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#FF8A00]">
                <option value="">— Não informado —</option>
                {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Folha de pagamento mensal (R$)</label>
              <input type="number" min="0" step="0.01" value={form.folha_mensal}
                onChange={(e) => set('folha_mensal', e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
              <p className="text-xs text-slate-400 mt-1">Salários pagos. Usado no Fator R (Simples Nacional).</p>
            </div>
          </div>

          {/* Diagnóstico tributário */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diagnóstico Tributário</p>

            {rec && (
              <div className={`rounded-xl p-4 border ${regimesDiffer ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-xs font-semibold text-slate-600 mb-0.5">Regime recomendado</p>
                    <p className={`text-lg font-bold ${regimesDiffer ? 'text-amber-700' : 'text-emerald-700'}`}>
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
                  <p className="text-[11px] text-amber-600">
                    Seu regime atual ({TAX_REGIMES[form.tax_regime]}) difere do recomendado para seu perfil.
                  </p>
                )}
              </div>
            )}

            {!rec && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400">Informe o faturamento mensal para ver o diagnóstico.</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Regime tributário atual</label>
              <select value={form.tax_regime} onChange={(e) => set('tax_regime', e.target.value as TaxRegime)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00] bg-white">
                {Object.entries(TAX_REGIMES).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 mt-1">Confirme com seu contador antes de alterar.</p>
            </div>

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
                {isMei ? 'Fixo — não varia com o faturamento' : 'Atualizada conforme regime, serviço e folha'}
              </p>
            </div>
          </div>

          {/* Retiradas */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Retiradas do Sócio</p>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Quanto quer retirar por mês? (R$)</label>
              <input type="number" min="0" step="0.01" value={form.retirada_desejada_mensal}
                onChange={(e) => set('retirada_desejada_mensal', e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
              <p className="text-xs text-slate-400 mt-1">Total que deseja tirar da empresa todo mês.</p>
            </div>

            {!isMei && (
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Pró-labore atual (R$/mês)</label>
                <input type="number" min="0" step="0.01" value={form.prolabore_mensal}
                  onChange={(e) => set('prolabore_mensal', e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
                <p className="text-xs text-slate-400 mt-1">Salário que você já registra formalmente como pró-labore.</p>
              </div>
            )}

            {!wRec && (
              <div className="bg-slate-50 rounded-xl p-4 text-center">
                <p className="text-sm text-slate-400">Informe o valor de retirada para ver a recomendação.</p>
              </div>
            )}

            {wRec && (
              <div className={`rounded-xl p-4 border space-y-3 ${wRec.annual_waste ? 'bg-amber-50 border-amber-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1">
                    {wRec.annual_waste ? 'Estratégia pode ser otimizada' : 'Estratégia otimizada'}
                  </p>
                  <p className="text-[11px] text-slate-600 leading-relaxed">{wRec.reason}</p>
                </div>

                {!isMei && (
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { label: 'Pró-labore ideal', value: formatCurrency(wRec.optimal_prolabore), color: '#64748b' },
                      { label: 'Distribuição de lucros', value: formatCurrency(wRec.optimal_distribution), color: '#10b981' },
                      { label: 'INSS mensal', value: formatCurrency(wRec.inss_cost), color: '#d97706' },
                      { label: 'Custo total', value: `${formatCurrency(wRec.total_tax_cost)}/mês (${wRec.effective_rate}%)`, color: '#64748b' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="bg-white bg-opacity-70 rounded-lg p-2.5">
                        <p className="text-[10px] text-slate-400 mb-0.5">{label}</p>
                        <p className="text-xs font-bold" style={{ color }}>{value}</p>
                      </div>
                    ))}
                  </div>
                )}

                {wRec.annual_waste && (
                  <div className="bg-amber-100 rounded-lg p-2.5">
                    <p className="text-xs font-semibold text-amber-700">
                      Com pró-labore de {formatCurrency(prolaboreNum || 0)}, você paga {formatCurrency((wRec.current_tax_cost || 0) - wRec.total_tax_cost)} a mais de INSS/mês — {formatCurrency(wRec.annual_waste!)}/ano.
                    </p>
                    <p className="text-[11px] text-amber-600 mt-1">
                      Reduzir para {formatCurrency(wRec.optimal_prolabore)} elimina esse custo mantendo a cobertura previdenciária.
                    </p>
                  </div>
                )}

                {wRec.alert && (
                  <p className="text-[11px] text-red-500 font-medium">{wRec.alert}</p>
                )}

                <p className="text-[11px] text-slate-400 italic">{wRec.tip}</p>
              </div>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Parâmetros Fiscais'}
          </button>
        </form>

        {/* PRO: NF-e */}
        <a href="/em-breve?f=nfe" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, border: '1.5px dashed rgba(255,138,0,0.35)', borderRadius: 16, padding: '14px 18px', textDecoration: 'none', background: 'rgba(255,138,0,0.03)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1D', marginBottom: 2 }}>Emissão de NF-e</p>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Emita notas fiscais direto pela plataforma, integrado com a prefeitura</p>
          </div>
          <span style={{ flexShrink: 0, background: 'linear-gradient(135deg,#FF8A00,#FF3B30)', borderRadius: 100, padding: '5px 12px', color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            USE NO PRO
          </span>
        </a>
      </div>
    </AppShell>
  )
}
