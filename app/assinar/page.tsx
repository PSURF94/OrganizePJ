'use client'
import { useState, useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import BrandIcon from '@/components/BrandIcon'
import { CheckCircle, Lock, AlertCircle } from 'lucide-react'

const C = { bg: '#1A1A1D', orange: '#FF8A00', red: '#E50914' }

const BASIC_FEATURES = [
  'Dashboard financeiro em tempo real',
  'Receitas e despesas parceladas',
  'Clientes e serviços',
  'Metas e reservas financeiras',
  'Diagnóstico tributário automático',
  'Relatórios e gráficos',
  'Timeline de fluxo de caixa',
  'Retiradas e pró-labore otimizados',
]

const PRO_EXTRA = [
  'Relatório com IA — saúde e projeções',
  'Link de pagamento (PIX / boleto)',
  'Cobrança automática via WhatsApp',
  'Proposta comercial em PDF',
  'Emissão de NF-e integrada',
  'Contrato digital com assinatura',
  'Multi-empresa (vários CNPJs)',
]

function formatCNPJ(v: string) {
  const d = v.replace(/\D/g, '').slice(0, 14)
  if (d.length <= 2) return d
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12)}`
}

function validateCNPJ(v: string) {
  const d = v.replace(/\D/g, '')
  if (d.length !== 14 || /^(\d)\1{13}$/.test(d)) return false
  const calc = (digits: string, weights: number[]) =>
    digits.split('').reduce((s, c, i) => s + Number(c) * weights[i], 0)
  const w1 = [5,4,3,2,9,8,7,6,5,4,3,2]
  const w2 = [6,5,4,3,2,9,8,7,6,5,4,3,2]
  const r1 = calc(d.slice(0,12), w1) % 11
  const d1 = r1 < 2 ? 0 : 11 - r1
  if (d1 !== Number(d[12])) return false
  const r2 = calc(d.slice(0,13), w2) % 11
  const d2 = r2 < 2 ? 0 : 11 - r2
  return d2 === Number(d[13])
}

const INPUT: React.CSSProperties = {
  width: '100%', padding: '11px 14px', borderRadius: 10,
  background: '#2a2a2e', border: '1px solid rgba(255,255,255,0.1)',
  color: 'white', fontSize: 15, fontFamily: 'var(--font-inter,sans-serif)',
  outline: 'none', boxSizing: 'border-box',
}

export default function AssinarPage() {
  const [loading, setLoading] = useState<'basic' | 'pro' | null>(null)
  const [error, setError] = useState<string | null>(null)

  const [cnpjNeeded, setCnpjNeeded] = useState(false)
  const [cnpjValue, setCnpjValue] = useState('')
  const [cnpjSaving, setCnpjSaving] = useState(false)
  const [cnpjError, setCnpjError] = useState<string | null>(null)
  const [configLoading, setConfigLoading] = useState(true)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d) => {
        if (!d.cnpj || d.cnpj.replace(/\D/g, '').length < 14) {
          setCnpjNeeded(true)
        }
      })
      .catch(() => {})
      .finally(() => setConfigLoading(false))
  }, [])

  async function handleSaveCNPJ() {
    if (!validateCNPJ(cnpjValue)) {
      setCnpjError('CNPJ inválido. Verifique e tente novamente.')
      return
    }
    setCnpjSaving(true)
    setCnpjError(null)
    try {
      const configRes = await fetch('/api/configuracoes')
      const config = await configRes.json()
      if (!configRes.ok) throw new Error(config.error || 'Erro ao buscar configurações')

      const putRes = await fetch('/api/configuracoes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: config.name ?? '',
          cnpj: cnpjValue,
          tax_regime: config.tax_regime ?? 'simples',
          simples_rate: config.simples_rate ?? 6,
          das_fixo_mensal: config.das_fixo_mensal ?? null,
          saldo_inicial: config.saldo_inicial ?? 0,
          service_category: config.service_category ?? '',
          folha_mensal: config.folha_mensal ?? null,
          faturamento_mensal: config.faturamento_mensal ?? null,
          num_funcionarios: config.num_funcionarios ?? null,
          prolabore_mensal: config.prolabore_mensal ?? null,
          retirada_desejada_mensal: config.retirada_desejada_mensal ?? null,
        }),
      })
      if (!putRes.ok) {
        const d = await putRes.json()
        throw new Error(d.error || `Erro ${putRes.status}`)
      }
      setCnpjNeeded(false)
    } catch (e) {
      setCnpjError(e instanceof Error ? e.message : String(e))
    } finally {
      setCnpjSaving(false)
    }
  }

  async function handleLogout() {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleCheckout(plan: 'basic' | 'pro') {
    setLoading(plan)
    setError(null)
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      })
      const data = await res.json()
      if (data.invoiceUrl) {
        window.location.href = data.invoiceUrl
      } else {
        setError(data.error || `Erro ${res.status} — verifique os logs do servidor.`)
        setLoading(null)
      }
    } catch (e) {
      setError(`Erro ao conectar: ${e instanceof Error ? e.message : String(e)}`)
      setLoading(null)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 32 }}>
        <BrandIcon size={36} />
        <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontWeight: 700, fontSize: 20 }}>
          Organize<span style={{ color: C.orange }}>PJ</span>
        </span>
      </div>

      <div style={{ maxWidth: 580, width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(229,9,20,0.12)', border: '1px solid rgba(229,9,20,0.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 16 }}>
            <Lock size={12} color={C.red} />
            <span style={{ color: C.red, fontSize: 12, fontWeight: 700 }}>Licença expirada</span>
          </div>
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontSize: 'clamp(20px,4vw,26px)', fontWeight: 800, lineHeight: 1.25, marginBottom: 10 }}>
            Escolha seu plano e continue
          </h1>
          <p style={{ color: '#64748b', fontSize: 14, lineHeight: 1.6 }}>
            Preços de lançamento — vitalícios para os primeiros parceiros.
          </p>
        </div>

        {/* CNPJ inline block */}
        {!configLoading && cnpjNeeded && (
          <div style={{ background: '#222226', border: `1px solid rgba(255,138,0,0.25)`, borderRadius: 16, padding: '20px 20px', marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <AlertCircle size={16} color={C.orange} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ color: 'white', fontWeight: 700, fontSize: 14, marginBottom: 2 }}>Informe seu CNPJ para continuar</p>
                <p style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
                  Necessário para emitir a cobrança. Será salvo nas suas Configurações.
                </p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                placeholder="00.000.000/0000-00"
                value={cnpjValue}
                onChange={(e) => { setCnpjValue(formatCNPJ(e.target.value)); setCnpjError(null) }}
                onKeyDown={(e) => e.key === 'Enter' && handleSaveCNPJ()}
                style={{ ...INPUT, flex: 1 }}
              />
              <button
                onClick={handleSaveCNPJ}
                disabled={cnpjSaving || cnpjValue.replace(/\D/g, '').length < 14}
                style={{ padding: '11px 18px', background: C.orange, color: 'white', fontWeight: 700, fontSize: 13, borderRadius: 10, border: 'none', cursor: cnpjSaving || cnpjValue.replace(/\D/g, '').length < 14 ? 'not-allowed' : 'pointer', opacity: cnpjSaving || cnpjValue.replace(/\D/g, '').length < 14 ? 0.5 : 1, whiteSpace: 'nowrap' }}>
                {cnpjSaving ? 'Salvando…' : 'Salvar'}
              </button>
            </div>
            {cnpjError && (
              <p style={{ color: C.red, fontSize: 12, marginTop: 8 }}>{cnpjError}</p>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 gap-4">

          {/* Basic */}
          <div style={{ background: '#222226', borderRadius: 20, padding: '24px 20px', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', flexDirection: 'column' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Basic</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 34, fontWeight: 800, color: 'white' }}>R$&nbsp;100</span>
              <span style={{ color: '#475569', fontSize: 13 }}>/ano</span>
            </div>
            <p style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>Preço de lançamento</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
              {BASIC_FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={13} color="#10b981" style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <button
              onClick={() => handleCheckout('basic')}
              disabled={loading !== null || cnpjNeeded || configLoading}
              style={{ width: '100%', background: C.orange, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 12, border: 'none', cursor: loading !== null || cnpjNeeded || configLoading ? 'not-allowed' : 'pointer', opacity: loading !== null || cnpjNeeded || configLoading ? 0.5 : 1, transition: 'opacity 0.15s' }}>
              {loading === 'basic' ? 'Aguarde...' : 'Assinar Basic — R$ 100/ano'}
            </button>
          </div>

          {/* Pro */}
          <div style={{ background: '#222226', borderRadius: 20, padding: '24px 20px', border: `2px solid rgba(255,138,0,0.4)`, position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, background: 'radial-gradient(circle, rgba(255,138,0,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 14, right: 14, background: `linear-gradient(135deg,${C.orange},${C.red})`, borderRadius: 100, padding: '3px 10px' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Em breve</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pro</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 34, fontWeight: 800, color: 'white' }}>R$&nbsp;500</span>
              <span style={{ color: '#475569', fontSize: 13 }}>/ano</span>
            </div>
            <p style={{ color: '#475569', fontSize: 12, marginBottom: 20 }}>Preço de lançamento vitalício</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24, flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <CheckCircle size={13} color="#475569" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: '#475569' }}>Tudo do plano Basic</span>
              </div>
              {PRO_EXTRA.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={13} color={C.orange} style={{ flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
            <a href="mailto:contato@organizepj.com.br?subject=Interesse no Plano Pro&body=Olá! Tenho interesse no plano Pro do OrganizePJ."
              style={{ display: 'block', textAlign: 'center', background: 'rgba(255,138,0,0.08)', color: C.orange, fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 12, border: `1px solid rgba(255,138,0,0.2)`, textDecoration: 'none' }}>
              Quero ser parceiro Pro
            </a>
          </div>
        </div>

        {error && (
          <p style={{ textAlign: 'center', color: C.red, fontSize: 13, marginTop: 16 }}>{error}</p>
        )}

        <div style={{ textAlign: 'center', marginTop: 20 }}>
          <button onClick={handleLogout}
            style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: 'rgba(255,255,255,0.35)', fontSize: 13, cursor: 'pointer', padding: '8px 20px' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
