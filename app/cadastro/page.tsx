'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { TAX_REGIMES } from '@/lib/constants'
import Link from 'next/link'

export default function CadastroPage() {
  const [step, setStep] = useState<'account' | 'company'>('account')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [cnpj, setCnpj] = useState('')
  const [taxRegime, setTaxRegime] = useState<string>('simples')
  const [simplesRate, setSimplesRate] = useState('6')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleAccount(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Senha deve ter pelo menos 6 caracteres.'); return }
    setStep('company')
  }

  async function handleCompany(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getBrowserSupabase()

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password })
    if (signUpError || !data.user) {
      setError(signUpError?.message || 'Erro ao criar conta.')
      setLoading(false)
      return
    }

    const trialEnds = new Date()
    trialEnds.setDate(trialEnds.getDate() + 7)

    const { error: companyError } = await supabase.from('companies').insert([{
      owner_id: data.user.id,
      name: companyName,
      cnpj: cnpj || null,
      tax_regime: taxRegime,
      simples_rate: Number(simplesRate),
      trial_ends_at: trialEnds.toISOString(),
      status: 'trial',
    }])

    if (companyError) {
      setError('Conta criada mas erro ao salvar empresa. Faça login e configure em Ajustes.')
    }

    window.location.href = '/dashboard'
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Organize PJ</h1>
          <p className="text-sm text-slate-500 mt-1">7 dias grátis, sem cartão de crédito</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {step === 'account' ? (
            <>
              <h2 className="font-semibold text-slate-800 mb-4">Criar conta</h2>
              <form onSubmit={handleAccount} className="space-y-4">
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
                <button type="submit"
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold">
                  Continuar
                </button>
              </form>
            </>
          ) : (
            <>
              <h2 className="font-semibold text-slate-800 mb-4">Dados da empresa</h2>
              <form onSubmit={handleCompany} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nome da empresa ou seu nome</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: João Silva Engenharia" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">CNPJ (opcional)</label>
                  <input type="text" value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="00.000.000/0001-00" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Regime tributário</label>
                  <select value={taxRegime} onChange={(e) => setTaxRegime(e.target.value)}
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                    {Object.entries(TAX_REGIMES).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Alíquota média de impostos (%)</label>
                  <input type="number" value={simplesRate} onChange={(e) => setSimplesRate(e.target.value)}
                    min="0" max="100" step="0.1"
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ex: 6" />
                </div>
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button type="submit" disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                  {loading ? 'Criando conta...' : 'Começar teste grátis'}
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
