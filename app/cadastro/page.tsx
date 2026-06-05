'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { calcTaxRecommendation, SERVICE_CATEGORIES } from '@/lib/tax-engine'
import Link from 'next/link'
import BrandIcon from '@/components/BrandIcon'
import { ArrowRight } from 'lucide-react'

type Step = 'conta' | 'perfil' | 'empresa' | 'situacao'
const STEPS: Step[] = ['conta', 'perfil', 'empresa', 'situacao']

const STEP_LABELS: Record<Step, string> = {
  conta:    'Criar conta',
  perfil:   'Seu perfil',
  empresa:  'Sua empresa',
  situacao: 'Situação atual',
}

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

const INPUT = {
  width: '100%',
  background: 'rgba(255,255,255,0.05)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 12,
  padding: '11px 14px',
  color: 'white',
  fontSize: 14,
  outline: 'none',
  transition: 'border-color 0.15s',
} as const

const LABEL = {
  display: 'block',
  fontSize: 12,
  fontWeight: 600,
  color: 'rgba(255,255,255,0.45)',
  marginBottom: 6,
  letterSpacing: '0.02em',
} as const

const HINT = {
  fontSize: 11,
  color: '#334155',
  marginTop: 5,
} as const

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
  const [folhaMensal, setFolhaMensal] = useState('')
  const [serviceCategory, setServiceCategory] = useState('')
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

      if (signUpError) { setError(signUpError.message || 'Erro ao criar conta.'); setLoading(false); return }
      if (!data.user || !data.session) {
        setError('Confirme seu e-mail ou desative a confirmação de e-mail no Supabase (Authentication → Settings).')
        setLoading(false); return
      }

      const mensal    = parseCurrencyInput(faturamentoMensal)
      const esperado  = parseCurrencyInput(faturamentoEsperado) || mensal * 12
      const nFunc     = sozinho ? 0 : (Number(numFuncionarios) || 1)
      const folha     = sozinho ? 0 : parseCurrencyInput(folhaMensal)
      const rec       = calcTaxRecommendation(mensal, nFunc, serviceCategory || null, folha)
      const trialEnds = new Date()
      trialEnds.setDate(trialEnds.getDate() + 7)

      const companyRes = await fetch('/api/setup-company', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${data.session.access_token}` },
        body: JSON.stringify({
          name: companyName.trim(),
          tax_regime: rec.regime,
          simples_rate: rec.rate,
          das_fixo_mensal: rec.das_fixo_mensal ?? null,
          service_category: serviceCategory || null,
          folha_mensal: folha || null,
          trial_ends_at: trialEnds.toISOString(),
          status: 'trial',
          profissao: profissao.trim() || null,
          tem_funcionarios: !sozinho,
          num_funcionarios: nFunc,
          faturamento_mensal: mensal,
          faturamento_esperado_12m: esperado,
          emite_nf: emiteNF,
          tem_contador: temContador,
          controle_atual: controleAtual || null,
          diagnostico_feito: true,
          saldo_inicial: parseCurrencyInput(saldoInicial) || 0,
        }),
      })

      if (!companyRes.ok) {
        const { error: msg } = await companyRes.json()
        setError(`Conta criada mas erro ao salvar perfil: ${msg}`)
        setLoading(false); return
      }

      window.location.href = '/diagnostico'
    } catch (err: unknown) {
      setError(`Erro inesperado: ${err instanceof Error ? err.message : String(err)}`)
      setLoading(false)
    }
  }

  function YesNoToggle({ value, onChange }: { value: boolean | null; onChange: (v: boolean) => void }) {
    return (
      <div style={{ display:'flex', gap:8 }}>
        {([true, false] as const).map((v) => (
          <button key={String(v)} type="button" onClick={() => onChange(v)}
            style={{
              flex:1, padding:'11px 0', borderRadius:12, fontSize:14, fontWeight:600,
              cursor:'pointer', transition:'all 0.15s',
              background: value === v ? '#FF8A00' : 'rgba(255,255,255,0.05)',
              border: value === v ? '1px solid #FF8A00' : '1px solid rgba(255,255,255,0.1)',
              color: value === v ? 'white' : 'rgba(255,255,255,0.45)',
            }}>
            {v ? 'Sim' : 'Não'}
          </button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ minHeight:'100vh', background:'#1A1A1D', display:'flex', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'var(--font-inter,sans-serif)', position:'relative' }}>
      {/* Glow */}
      <div style={{ position:'fixed', top:0, left:0, right:0, bottom:0, pointerEvents:'none', background:'radial-gradient(ellipse at 50% 0%, rgba(255,138,0,0.09) 0%, transparent 60%)' }} />

      <div style={{ width:'100%', maxWidth:420, position:'relative', zIndex:1 }}>

        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', marginBottom:28 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
            <BrandIcon size={36} />
            <span style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:20 }}>
              Organize<span style={{ color:'#FF8A00' }}>PJ</span>
            </span>
          </div>
          <span style={{ color:'#475569', fontSize:13 }}>7 dias grátis · Sem cartão de crédito</span>
        </div>

        {/* Progress */}
        <div style={{ marginBottom:20 }}>
          <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
            <span style={{ color:'rgba(255,255,255,0.35)', fontSize:12 }}>
              {STEP_LABELS[step]}
            </span>
            <span style={{ color:'#FF8A00', fontSize:12, fontWeight:700 }}>
              {stepIndex + 1} / {STEPS.length}
            </span>
          </div>
          <div style={{ height:3, background:'rgba(255,255,255,0.07)', borderRadius:10 }}>
            <div style={{ height:3, background:'linear-gradient(to right,#FF8A00,#FF3B30)', borderRadius:10, width:`${progress}%`, transition:'width 0.4s ease' }} />
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
            {STEPS.map((s, i) => (
              <div key={s} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
                <div style={{ width:6, height:6, borderRadius:'50%', background: i <= stepIndex ? '#FF8A00' : 'rgba(255,255,255,0.1)', transition:'background 0.3s' }} />
              </div>
            ))}
          </div>
        </div>

        {/* Card */}
        <div style={{ background:'#222226', border:'1px solid rgba(255,255,255,0.07)', borderRadius:22, padding:'30px 28px' }}>

          {/* ── STEP 1: conta ── */}
          {step === 'conta' && (
            <>
              <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:20, marginBottom:4 }}>Criar sua conta</h2>
              <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Comece a entender seu negócio hoje</p>
              <form onSubmit={handleConta} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={LABEL}>E-mail</label>
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                    style={INPUT} placeholder="seu@email.com" />
                </div>
                <div>
                  <label style={LABEL}>Senha</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    style={INPUT} placeholder="mínimo 6 caracteres" />
                </div>
                {error && <p style={{ color:'#f87171', fontSize:13, background:'rgba(248,113,113,0.1)', padding:'10px 14px', borderRadius:10 }}>{error}</p>}
                <button type="submit"
                  style={{ background:'linear-gradient(135deg,#FF8A00,#FF3B30)', border:'none', borderRadius:12, padding:'13px', color:'white', fontWeight:700, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(255,138,0,0.28)' }}>
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ── STEP 2: perfil ── */}
          {step === 'perfil' && (
            <>
              <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:20, marginBottom:4 }}>Sobre você</h2>
              <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Vamos personalizar sua experiência</p>
              <form onSubmit={handlePerfil} style={{ display:'flex', flexDirection:'column', gap:16 }}>
                <div>
                  <label style={LABEL}>Nome da empresa ou seu nome</label>
                  <input type="text" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required
                    style={INPUT} placeholder="Ex: João Silva Engenharia" />
                </div>
                <div>
                  <label style={LABEL}>Qual é sua profissão?</label>
                  <input list="profissoes-list" type="text" value={profissao}
                    onChange={(e) => setProfissao(e.target.value)}
                    style={INPUT} placeholder="Ex: Engenheiro, Arquiteto..." />
                  <datalist id="profissoes-list">
                    {PROFISSOES.map((p) => <option key={p} value={p} />)}
                  </datalist>
                </div>
                {error && <p style={{ color:'#f87171', fontSize:13, background:'rgba(248,113,113,0.1)', padding:'10px 14px', borderRadius:10 }}>{error}</p>}
                <button type="submit"
                  style={{ background:'linear-gradient(135deg,#FF8A00,#FF3B30)', border:'none', borderRadius:12, padding:'13px', color:'white', fontWeight:700, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(255,138,0,0.28)' }}>
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ── STEP 3: empresa ── */}
          {step === 'empresa' && (
            <>
              <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:20, marginBottom:4 }}>Sua empresa</h2>
              <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Isso define seu diagnóstico tributário</p>
              <form onSubmit={handleEmpresa} style={{ display:'flex', flexDirection:'column', gap:18 }}>

                <div>
                  <label style={LABEL}>Tipo de serviço</label>
                  <select value={serviceCategory} onChange={(e) => setServiceCategory(e.target.value)}
                    style={{ ...INPUT, appearance:'none' as const }}>
                    <option value="">Selecione...</option>
                    {SERVICE_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                  <p style={HINT}>Usado para calcular sua alíquota corretamente</p>
                </div>

                <div>
                  <label style={{ ...LABEL, marginBottom:8 }}>Você trabalha sozinho?</label>
                  <YesNoToggle value={sozinho} onChange={(v) => { setSozinho(v); if (v) { setNumFuncionarios(''); setFolhaMensal('') } }} />
                  {sozinho === false && (
                    <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:12 }}>
                      <div>
                        <label style={LABEL}>Quantos funcionários?</label>
                        <input type="number" min="1" max="999" value={numFuncionarios}
                          onChange={(e) => setNumFuncionarios(e.target.value)}
                          style={INPUT} placeholder="Ex: 2" />
                      </div>
                      <div>
                        <label style={LABEL}>Folha mensal (salários)</label>
                        <div style={{ position:'relative' }}>
                          <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:14 }}>R$</span>
                          <input type="text" inputMode="numeric" value={folhaMensal}
                            onChange={(e) => setFolhaMensal(formatCurrencyInput(e.target.value))}
                            style={{ ...INPUT, paddingLeft:36 }} placeholder="0,00" />
                        </div>
                        <p style={HINT}>Influencia no cálculo do Fator R (Simples Nacional)</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label style={LABEL}>Faturamento mensal atual</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:14 }}>R$</span>
                    <input type="text" inputMode="numeric" value={faturamentoMensal}
                      onChange={(e) => setFaturamentoMensal(formatCurrencyInput(e.target.value))}
                      style={{ ...INPUT, paddingLeft:36 }} placeholder="0,00" />
                  </div>
                  <p style={HINT}>Aproximado — você pode ajustar depois</p>
                </div>

                <div>
                  <label style={LABEL}>Expectativa para os próximos 12 meses</label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:14 }}>R$</span>
                    <input type="text" inputMode="numeric" value={faturamentoEsperado}
                      onChange={(e) => setFaturamentoEsperado(formatCurrencyInput(e.target.value))}
                      style={{ ...INPUT, paddingLeft:36 }} placeholder="0,00" />
                  </div>
                </div>

                <div>
                  <label style={LABEL}>Saldo atual em conta <span style={{ fontWeight:400, opacity:0.5 }}>(opcional)</span></label>
                  <div style={{ position:'relative' }}>
                    <span style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'rgba(255,255,255,0.3)', fontSize:14 }}>R$</span>
                    <input type="text" inputMode="numeric" value={saldoInicial}
                      onChange={(e) => setSaldoInicial(formatCurrencyInput(e.target.value))}
                      style={{ ...INPUT, paddingLeft:36 }} placeholder="0,00" />
                  </div>
                  <p style={HINT}>Valor que você já tem antes de começar a usar</p>
                </div>

                {error && <p style={{ color:'#f87171', fontSize:13, background:'rgba(248,113,113,0.1)', padding:'10px 14px', borderRadius:10 }}>{error}</p>}
                <button type="submit"
                  style={{ background:'linear-gradient(135deg,#FF8A00,#FF3B30)', border:'none', borderRadius:12, padding:'13px', color:'white', fontWeight:700, fontSize:15, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(255,138,0,0.28)' }}>
                  Continuar <ArrowRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* ── STEP 4: situacao ── */}
          {step === 'situacao' && (
            <>
              <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:20, marginBottom:4 }}>Situação atual</h2>
              <p style={{ color:'#475569', fontSize:14, marginBottom:24 }}>Últimas perguntas — seu diagnóstico está quase pronto</p>
              <form onSubmit={handleFinal} style={{ display:'flex', flexDirection:'column', gap:18 }}>

                <div>
                  <label style={{ ...LABEL, marginBottom:8 }}>Você emite nota fiscal?</label>
                  <YesNoToggle value={emiteNF} onChange={setEmiteNF} />
                </div>

                <div>
                  <label style={{ ...LABEL, marginBottom:8 }}>Possui contador?</label>
                  <YesNoToggle value={temContador} onChange={setTemContador} />
                </div>

                <div>
                  <label style={LABEL}>Como você controla suas finanças hoje?</label>
                  <select value={controleAtual} onChange={(e) => setControleAtual(e.target.value)}
                    style={{ ...INPUT, appearance:'none' as const }}>
                    <option value="">Selecione...</option>
                    {CONTROLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>

                {error && <p style={{ color:'#f87171', fontSize:13, background:'rgba(248,113,113,0.1)', padding:'10px 14px', borderRadius:10 }}>{error}</p>}
                <button type="submit" disabled={loading}
                  style={{ background:'linear-gradient(135deg,#FF8A00,#FF3B30)', border:'none', borderRadius:12, padding:'13px', color:'white', fontWeight:700, fontSize:15, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.65 : 1, display:'flex', alignItems:'center', justifyContent:'center', gap:8, boxShadow:'0 6px 20px rgba(255,138,0,0.28)' }}>
                  {loading ? 'Criando sua conta...' : <> Ver meu diagnóstico <ArrowRight size={16} /></>}
                </button>
              </form>
            </>
          )}

          <p style={{ textAlign:'center', fontSize:13, color:'#334155', marginTop:20 }}>
            Já tem conta?{' '}
            <Link href="/login" style={{ color:'#FF8A00', fontWeight:600, textDecoration:'none' }}>Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
