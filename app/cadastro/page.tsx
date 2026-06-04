'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { calcTaxRecommendation } from '@/lib/tax-engine'
import Link from 'next/link'

type Step = 'conta' | 'perfil' | 'empresa' | 'situacao'

const STEPS: Step[] = ['conta', 'perfil', 'empresa', 'situacao']

const PROFISSOES = [
  'Advogado', 'Arquiteto', 'Consultor', 'Contador', 'Designer',
  'Engenheiro', 'Fotógrafo', 'Médico', 'Professor', 'Programador',
  'Psicólogo', 'Terapeuta', 'Veterinário', 'Outro',
]

const CONTROLE_OPTIONS = [
  'Planilha (Excel ou Google Sheets)',
  'Caderno ou papel',
  'Aplicativo financeiro',
  'Não controlo',
  'Outro',
]

function parseCurrencyInput(value: string): number {
  const digits = value.replace(/\D/g, '')
  if (!digits) return 0
  return Number(digits) / 100
}

function formatCurrencyInput(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (!digits) return ''
  const num = Number(digits) / 100
  return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CadastroPage() {
  const [step, setStep] = useState<Step>('conta')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [companyName, setCompanyName] = useState('')
  const [profissao, setProfissao] = useState('')

  const [sozinho, setSozinho] = useState<boolean | null>(null)
  const [numFuncionarios, setNumFuncionarios] = useState('')
  const [faturamentoMensal, setFaturamentoMensal] = useState('')
  const [faturamentoEsperado, setFaturamentoEsperado] = useState('')
  const [saldoInicial, setSaldoInicial] = useState('')

  const [emiteNF, setEmiteNF] = useState<boolean | null>(null)
  const [temContador, setTemContador] = useState<boolean | null>(null)
  const [controleAtual, setControleAtual] = useState('')

  const stepIndex = STEPS.indexOf(step)
  const progress = ((stepIndex + 1) / STEPS.length) * 100

  function goNext() {
    const next = STEPS[stepIndex + 1]
    if (next) { setError(''); setStep(next) }
  }

  function handleConta(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    goNext()
  }

  function handlePerfil(e: React.FormEvent) {
    e.preventDefault()
    if (!companyName.trim()) { setError('Informe o nome da empresa ou seu nome.'); return }
    goNext()
  }

  function handleEmpresa(e: React.FormEvent) {
    e.preventDefault()
    if (sozinho === null) { setError('Informe se você trabalha sozinho.'); return }
    if (!faturamentoMensal) { setError('Informe seu faturamento mensal estimado.'); return }
    goNext()
  }

  async function handleFinal(e: React.FormEvent) {
    e.preventDefault()
    if (emiteNF === null) { setError('Informe se você emite nota fiscal.'); return }
    if (temContador === null) { setError('Informe se possui contador.'); return }
    setLoading(true)
    setError('')

    try {
      const supabase = getBrowserSupabase()
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password })

      if (signUpError) {
        setError(signUpError.message || 'Erro ao criar conta.')
        setLoading(false)
        return
      }
      if (!data.user || !data.session) {
        setError('Confirme seu e-mail ou desative a confirmação de e-mail no Supabase (Authentication → Settings).')
        setLoading(false)
        return
      }

      const mensal = parseCurrencyInput(faturamentoMensal)
      const esperado = parseCurrencyInput(faturamentoEsperado) || mensal * 12
      const nFuncionarios = sozinho ? 0 : (Number(numFuncionarios) || 1)
      const rec = calcTaxRecommendation(mensal, nFuncionarios)

      const trialEnds = new Date()
      trialEnds.setDate(trialEnds.getDate() + 7)

      const { error: companyError } = await supabase.from('companies').insert([{
        owner_id: data.user.id,
        name: companyName.trim(),
        tax_regime: rec.regime,
        simples_rate: rec.rate,
        trial_ends_at: trialEnds.toISOString(),
        status: 'trial',
        profissao: profissao.trim() || null,
        tem_funcionarios: !sozinho,
        num_funcionarios: nFuncionarios,
        faturamento_mensal: mensal,
        faturamento_esperado_12m: esperado,
        emite_nf: emiteNF,
        tem_contador: temContador,
        controle_atual: controleAtual || null,
        diagnostico_feito: true,
        saldo_inicial: parseCurrencyInput(saldoInicial) || 0,
      }])

      if (companyError) {
        setError(`Conta criada mas erro ao salvar perfil: ${companyError.message}`)
        setLoading(false)
        return
      }

      window.location.href = '/diagnostico'
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(`Erro inesperado: ${msg}`)
      setLoading(false)
    }
  }

  const YesNoToggle = ({
    value, onChange,
  }: { value: boolean | null; onChange: (v: boolean) => void }) => (
    <div className="flex gap-2">
      {([true, false] as const).map((v) => (
        <button
          key={String(v)}
          type="button"
          onClick={() => onChange(v)}
          className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
            value === v
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300'
          }`}
        >
          {v ? 'Sim' : 'Não'}
        </button>
      ))}
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Organize PJ</h1>
          <p className="text-sm text-slate-500 mt-1">7 dias grátis, sem cartão de crédito</p>
        </div>

        <div className="mb-5">
          <div className="flex justify-between text-xs text-slate-400 mb-1.5">
            <span>Etapa {stepIndex + 1} de {STEPS.length}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-slate-200 rounded-full">
            <div
              className="h-1.5 bg-blue-600 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">

          {step === 'conta' && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Criar sua conta</h2>
              <p className="text-sm text-slate-500 mb-5">Comece com 7 dias gratuitos</p>
              <form onSubmit={handleConta} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="seu@email.com" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Senha</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="mínimo 6 caracteres" />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                  Continuar
                </button>
              </form>
            </>
          )}

          {step === 'perfil' && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Sobre você</h2>
              <p className="text-sm text-slate-500 mb-5">Vamos personalizar sua experiência</p>
              <form onSubmit={handlePerfil} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nome da empresa ou seu nome</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: João Silva Engenharia" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Qual é sua profissão?</label>
                  <input
                    list="profissoes-list"
                    type="text"
                    value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: Engenheiro, Arquiteto..."
                  />
                  <datalist id="profissoes-list">
                    {PROFISSOES.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                  Continuar
                </button>
              </form>
            </>
          )}

          {step === 'empresa' && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Sua empresa</h2>
              <p className="text-sm text-slate-500 mb-5">Isso define seu diagnóstico tributário</p>
              <form onSubmit={handleEmpresa} className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Você trabalha sozinho?</label>
                  <YesNoToggle value={sozinho} onChange={(v) => { setSozinho(v); if (v) setNumFuncionarios('') }} />
                  {sozinho === false && (
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-600 block mb-1">Quantos funcionários?</label>
                      <input
                        type="number" min="1" max="999"
                        value={numFuncionarios}
                        onChange={(e) => setNumFuncionarios(e.target.value)}
                        className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 2"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Faturamento mensal atual</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input
                      type="text" inputMode="numeric"
                      value={faturamentoMensal}
                      onChange={(e) => setFaturamentoMensal(formatCurrencyInput(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Aproximado — pode ajustar depois</p>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Expectativa de faturamento nos próximos 12 meses
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input
                      type="text" inputMode="numeric"
                      value={faturamentoEsperado}
                      onChange={(e) => setFaturamentoEsperado(formatCurrencyInput(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">
                    Você já tem algum valor disponível em conta?{' '}
                    <span className="text-slate-400 font-normal">(opcional)</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">R$</span>
                    <input
                      type="text" inputMode="numeric"
                      value={saldoInicial}
                      onChange={(e) => setSaldoInicial(formatCurrencyInput(e.target.value))}
                      className="w-full border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0,00"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">Saldo que você já tem antes de começar a usar o sistema</p>
                </div>

                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                  Continuar
                </button>
              </form>
            </>
          )}

          {step === 'situacao' && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Situação atual</h2>
              <p className="text-sm text-slate-500 mb-5">Últimas perguntas — seu diagnóstico está quase pronto</p>
              <form onSubmit={handleFinal} className="space-y-5">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Você emite nota fiscal?</label>
                  <YesNoToggle value={emiteNF} onChange={setEmiteNF} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-2">Possui contador?</label>
                  <YesNoToggle value={temContador} onChange={setTemContador} />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Como você controla suas finanças hoje?</label>
                  <select
                    value={controleAtual}
                    onChange={(e) => setControleAtual(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Selecione...</option>
                    {CONTROLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {error && <p className="text-red-500 text-xs bg-red-50 p-2 rounded-lg">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                  {loading ? 'Criando sua conta...' : 'Ver meu diagnóstico'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-xs text-slate-500 mt-4">
            Já tem conta?{' '}
            <Link href="/login" className="text-blue-600 font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
