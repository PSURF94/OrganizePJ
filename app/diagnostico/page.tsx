import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import { calcTaxRecommendation } from '@/lib/tax-engine'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

const COMPLEXIDADE_STYLE: Record<string, string> = {
  Baixa: 'text-emerald-700 bg-emerald-100',
  Média: 'text-amber-700 bg-amber-100',
  Alta: 'text-red-700 bg-red-100',
}

export default async function DiagnosticoPage() {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { data: company } = await supabase
    .from('companies')
    .select('*')
    .eq('owner_id', session.user.id)
    .single()

  if (!company) redirect('/dashboard')

  const rec = calcTaxRecommendation(
    Number(company.faturamento_mensal) || 0,
    Number(company.num_funcionarios) || 0
  )

  const semContador = company.tem_contador === false

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="max-w-sm mx-auto">

        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-xl font-bold text-slate-900">Seu diagnóstico está pronto</h1>
          <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
            Analisamos seu perfil e identificamos a melhor estrutura tributária para você
          </p>
        </div>

        {/* Regime recomendado */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">Regime recomendado</p>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-2xl font-bold text-blue-600">{rec.label}</h2>
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COMPLEXIDADE_STYLE[rec.complexidade] || ''}`}>
              Complexidade {rec.complexidade}
            </span>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{rec.motivo}</p>
        </div>

        {/* Números */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Alíquota estimada</p>
            <p className="text-2xl font-bold text-slate-800">{rec.rate}%</p>
          </div>
          <div className="bg-white rounded-2xl p-4 shadow-sm">
            <p className="text-xs text-slate-400 mb-1">Imposto mensal estimado</p>
            <p className="text-lg font-bold text-amber-500">{formatCurrency(rec.monthly_tax)}</p>
          </div>
        </div>

        {/* Faixa */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 mb-4">
          <p className="text-xs font-semibold text-blue-600 mb-0.5">Faixa de tributação</p>
          <p className="text-sm font-bold text-blue-900">{rec.faixa_tributacao}</p>
        </div>

        {/* Pontos de atenção */}
        <div className="bg-white rounded-2xl p-5 mb-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Pontos de atenção</h3>
          <ul className="space-y-2.5">
            {rec.riscos.map((risco, i) => (
              <li key={i} className="flex gap-2.5 text-sm text-slate-600">
                <span className="text-amber-400 shrink-0 mt-0.5">⚠</span>
                <span className="leading-snug">{risco}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Dica contador */}
        {semContador && (
          <div className="bg-slate-800 rounded-2xl p-4 mb-4 text-white">
            <p className="text-xs font-semibold mb-1.5">Você não tem contador ainda</p>
            <p className="text-xs text-slate-300 leading-relaxed">
              O Organize PJ vai te ajudar a entender suas finanças no dia a dia. Para abertura de CNPJ e emissão de notas fiscais, você precisará de um contador. Muitos cobram a partir de R$150/mês para MEI.
            </p>
          </div>
        )}

        {/* Disclaimer */}
        <p className="text-xs text-slate-400 text-center mb-6 leading-relaxed px-2">
          Este diagnóstico é uma orientação baseada nas informações fornecidas. Para decisões definitivas, consulte um contador de sua confiança.
        </p>

        <Link
          href="/dashboard"
          className="block w-full bg-blue-600 text-white rounded-2xl py-3.5 text-sm font-semibold text-center"
        >
          Ir para o painel →
        </Link>
      </div>
    </div>
  )
}
