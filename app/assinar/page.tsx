'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import BrandIcon from '@/components/BrandIcon'
import { CheckCircle, Lock } from 'lucide-react'

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

export default function AssinarPage() {
  const [loading, setLoading] = useState<'basic' | 'pro' | null>(null)
  const [error, setError] = useState<string | null>(null)

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
        setError('Não foi possível gerar o link de pagamento. Tente novamente.')
        setLoading(null)
      }
    } catch {
      setError('Erro ao conectar. Tente novamente.')
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
              disabled={loading !== null}
              style={{ width: '100%', background: C.orange, color: 'white', fontWeight: 700, fontSize: 14, padding: '13px', borderRadius: 12, border: 'none', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading && loading !== 'basic' ? 0.5 : 1, transition: 'opacity 0.15s' }}>
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
          <button onClick={handleLogout} style={{ background: 'none', border: 'none', color: '#334155', fontSize: 13, cursor: 'pointer' }}>
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  )
}
