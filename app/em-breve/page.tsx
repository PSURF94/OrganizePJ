import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import AppShell from '@/components/AppShell'
import Link from 'next/link'
import { Lock, CheckCircle, Zap, ArrowRight } from 'lucide-react'

const FEATURES: Record<string, { name: string; desc: string }> = {
  'relatorio-ia':       { name: 'Relatório com IA',       desc: 'Análise de saúde financeira e projeções geradas por inteligência artificial com base nos dados reais da sua empresa. Receba insights, alertas e recomendações automaticamente.' },
  'link-pagamento':     { name: 'Link de Pagamento',       desc: 'Gere links de cobrança por PIX ou boleto e envie direto para o cliente. O sistema dá baixa automaticamente quando o pagamento é confirmado.' },
  'cobranca-whatsapp':  { name: 'Cobrança via WhatsApp',   desc: 'Envie notificações e cobranças automáticas pelo WhatsApp do seu cliente quando uma receita está vencendo ou atrasada. Sem esforço manual.' },
  'proposta-comercial': { name: 'Proposta Comercial',      desc: 'Monte propostas profissionais com logo, escopo, valores e condições de pagamento. Compartilhe o link com o cliente ou exporte em PDF na hora.' },
  'nfe':                { name: 'Emissão de NF-e',         desc: 'Emita notas fiscais de serviço diretamente pela plataforma, integrado com a prefeitura da sua cidade. Sem acessar outro sistema.' },
  'contrato-digital':   { name: 'Contrato Digital',        desc: 'Crie e assine contratos digitalmente com validade jurídica. O cliente assina pelo link, você recebe o documento assinado automaticamente.' },
  'multi-empresa':      { name: 'Multi-Empresa',           desc: 'Gerencie mais de um CNPJ na mesma conta. Alterne entre empresas com um clique, cada uma com seus próprios dados, metas e relatórios.' },
}

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

const PRO_FEATURES = [
  'Tudo do plano Basic',
  'Relatório com IA — saúde e projeções',
  'Link de pagamento (PIX / boleto)',
  'Cobrança automática via WhatsApp',
  'Proposta comercial em PDF',
  'Emissão de NF-e integrada',
  'Contrato digital com assinatura',
  'Multi-empresa (vários CNPJs)',
]

export default async function EmBreve({
  searchParams,
}: {
  searchParams: Promise<{ f?: string }>
}) {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) redirect('/login')

  const { f } = await searchParams
  const feature = FEATURES[f ?? ''] ?? null

  return (
    <AppShell>
      <div className="px-4 pt-8 pb-16 max-w-2xl mx-auto">

        {/* Feature highlight */}
        <div style={{ background: '#1A1A1D', borderRadius: 24, padding: '36px 32px', marginBottom: 20, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -60, left: '50%', transform: 'translateX(-50%)', width: 320, height: 320, background: 'radial-gradient(circle, rgba(255,138,0,0.12) 0%, transparent 70%)', pointerEvents: 'none' }} />

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,138,0,0.12)', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 100, padding: '5px 14px', marginBottom: 20 }}>
            <Lock size={12} color="#FF8A00" />
            <span style={{ color: '#FF8A00', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Plano Pro</span>
          </div>

          {feature ? (
            <>
              <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontSize: 'clamp(22px,4vw,32px)', fontWeight: 800, lineHeight: 1.2, marginBottom: 14 }}>
                {feature.name}
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, lineHeight: 1.7, maxWidth: 440, margin: '0 auto 24px' }}>
                {feature.desc}
              </p>
            </>
          ) : (
            <>
              <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontSize: 28, fontWeight: 800, marginBottom: 14 }}>
                Funcionalidade Pro
              </h1>
              <p style={{ color: '#64748b', fontSize: 15, marginBottom: 24 }}>
                Esta funcionalidade está disponível no plano Pro.
              </p>
            </>
          )}

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '10px 18px' }}>
            <Zap size={14} color="#FF8A00" />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              Em breve — <strong style={{ color: '#FF8A00' }}>preço de lançamento vitalício</strong> para os primeiros parceiros
            </span>
          </div>
        </div>

        {/* Pricing */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">

          {/* Basic */}
          <div style={{ background: 'white', borderRadius: 20, padding: '28px 24px', border: '1px solid #eef0f3' }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Basic</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 32, fontWeight: 800, color: '#1A1A1D' }}>R$&nbsp;197</span>
              <span style={{ color: '#94a3b8', fontSize: 13 }}>/ano</span>
            </div>
            <p style={{ color: '#94a3b8', fontSize: 12, marginBottom: 20 }}>Menos de R$&nbsp;17/mês</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {BASIC_FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={14} color="#10b981" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: '#475569', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pro */}
          <div style={{ background: '#1A1A1D', borderRadius: 20, padding: '28px 24px', border: '2px solid rgba(255,138,0,0.35)', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, background: 'radial-gradient(circle, rgba(255,138,0,0.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
            <div style={{ position: 'absolute', top: 14, right: 16, background: '#FF8A00', borderRadius: 100, padding: '3px 10px' }}>
              <span style={{ color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Fundadores</span>
            </div>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#FF8A00', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Pro</p>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 32, fontWeight: 800, color: 'white' }}>R$&nbsp;497</span>
              <span style={{ color: '#475569', fontSize: 13 }}>/ano</span>
            </div>
            <p style={{ color: '#FF8A00', fontSize: 12, fontWeight: 600, marginBottom: 6 }}>R$497/ano · preço garantido para fundadores</p>
            <p style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, lineHeight: 1.6, marginBottom: 20 }}>Seu preço anual não muda com reajustes futuros. É como reconhecemos quem acredita no projeto.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {PRO_FEATURES.map((f) => (
                <div key={f} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <CheckCircle size={14} color="#FF8A00" style={{ flexShrink: 0, marginTop: 1 }} />
                  <span style={{ fontSize: 13, color: f === 'Tudo do plano Basic' ? '#475569' : '#94a3b8', lineHeight: 1.4 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA */}
        <div style={{ background: 'white', borderRadius: 20, padding: '24px', border: '1px solid #eef0f3', textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontWeight: 700, color: '#1A1A1D', fontSize: 16, marginBottom: 6 }}>
            Quer acesso ao plano Pro?
          </p>
          <p style={{ color: '#64748b', fontSize: 13, marginBottom: 18, lineHeight: 1.6 }}>
            Os primeiros parceiros terão acesso a preço de lançamento com validade vitalícia.<br />
            Entre em contato para garantir sua vaga.
          </p>
          <a href="mailto:contato@organizepj.com.br?subject=Interesse no Plano Pro&body=Olá! Tenho interesse no plano Pro do OrganizePJ."
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#FF8A00,#FF3B30)', borderRadius: 12, padding: '12px 28px', color: 'white', fontWeight: 700, fontSize: 15, textDecoration: 'none', boxShadow: '0 6px 20px rgba(255,138,0,0.25)' }}>
            Quero ser parceiro fundador <ArrowRight size={16} />
          </a>
          <div style={{ marginTop: 16 }}>
            <Link href="/dashboard" style={{ color: '#94a3b8', fontSize: 13, textDecoration: 'none' }}>
              ← Voltar ao dashboard
            </Link>
          </div>
        </div>

      </div>
    </AppShell>
  )
}
