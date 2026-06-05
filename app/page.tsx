import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  Target, TrendingUp, Rocket, DollarSign,
  Users, FileText, BarChart3, Wallet,
  PiggyBank, Shield, CheckCircle, ArrowRight,
} from 'lucide-react'
import BrandIcon from '@/components/BrandIcon'

const C = {
  dark: '#1A1A1D',
  red: '#E50914',
  orange: '#FF8A00',
  lightRed: '#FF3B30',
  gray: '#F6F6F6',
} as const

export default async function LandingPage() {
  const supabase = await getServerSupabase()
  const { data: { session } } = await supabase.auth.getSession()
  if (session) redirect('/dashboard')

  return (
    <div style={{ fontFamily: 'var(--font-inter, sans-serif)' }}>
      <Nav />
      <Hero />
      <Pain />
      <Solution />
      <Features />
      <HowItWorks />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ─── NAV ─────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{ background: C.dark, borderBottom: '1px solid rgba(255,255,255,0.07)' }}
      className="sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login"
            className="text-slate-400 hover:text-white transition-colors text-sm font-medium px-3 py-2">
            Entrar
          </Link>
          <Link href="/cadastro"
            style={{ background: C.orange, borderRadius: 10 }}
            className="text-white text-sm font-semibold px-4 py-2 hover:opacity-90 transition-opacity flex items-center gap-1.5">
            Começar grátis <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── HERO ─────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background: C.dark, minHeight: '92vh' }}
      className="relative flex items-center overflow-hidden">
      {/* Glow effects */}
      <div style={{ position: 'absolute', top: -120, left: -80, width: 520, height: 520, background: 'radial-gradient(circle, rgba(255,138,0,0.13) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -60, right: 160, width: 420, height: 420, background: 'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          {/* Copy */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,138,0,0.1)', border: '1px solid rgba(255,138,0,0.25)', borderRadius: 100, padding: '6px 16px', marginBottom: 28 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.orange }} />
              <span style={{ color: C.orange, fontSize: 13, fontWeight: 500 }}>Trial 7 dias grátis · Sem cartão de crédito</span>
            </div>

            <h1 style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontSize: 'clamp(36px, 5vw, 58px)', fontWeight: 800, lineHeight: 1.1, marginBottom: 22 }}>
              Finanças organizadas.<br />
              <span style={{ color: C.orange }}>Lucro real.</span>
            </h1>

            <p style={{ color: '#94a3b8', fontSize: 18, lineHeight: 1.65, marginBottom: 38, maxWidth: 490 }}>
              Descubra quanto você realmente lucra, separe o dinheiro da empresa do seu pessoal e tome decisões com segurança.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro"
                style={{ background: `linear-gradient(135deg, ${C.orange}, ${C.lightRed})`, borderRadius: 12, padding: '14px 28px', color: 'white', fontWeight: 700, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', boxShadow: '0 8px 24px rgba(255,138,0,0.3)' }}>
                Começar agora — é grátis <ArrowRight size={18} />
              </Link>
              <Link href="/login"
                style={{ border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '14px 28px', color: '#94a3b8', fontWeight: 600, fontSize: 16, display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none' }}>
                Já tenho conta
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-9">
              {['MEI', 'Simples Nacional', 'Lucro Presumido'].map((label) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <CheckCircle size={14} color={C.orange} />
                  <span style={{ color: '#475569', fontSize: 13 }}>{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dashboard mock */}
          <div className="hidden lg:flex justify-end">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── PAIN ─────────────────────────────────────────────────────────── */
function Pain() {
  const items = [
    { icon: <DollarSign size={22} />, text: 'Não sabem exatamente quanto lucram todo mês' },
    { icon: <Wallet size={22} />, text: 'Misturam o dinheiro pessoal com o da empresa' },
    { icon: <BarChart3 size={22} />, text: 'Não têm visibilidade real do fluxo de caixa' },
    { icon: <Rocket size={22} />, text: 'Querem crescer mas falta controle financeiro' },
  ]

  return (
    <section style={{ background: C.gray }} className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color: C.red, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Você se identifica?</p>
          <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, color: C.dark, lineHeight: 1.2 }}>
            Para empresários que ainda não têm<br />controle financeiro real
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon, text }, i) => (
            <div key={i} style={{ background: 'white', borderRadius: 18, padding: 24, border: '1px solid #e8ecf1' }}>
              <div style={{ width: 46, height: 46, borderRadius: 12, background: 'rgba(229,9,20,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, color: C.red }}>
                {icon}
              </div>
              <p style={{ color: C.dark, fontWeight: 500, lineHeight: 1.5, fontSize: 15 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── SOLUTION ──────────────────────────────────────────────────────── */
function Solution() {
  const pillars = [
    {
      icon: <Target size={28} />,
      label: 'Clareza para decidir',
      desc: 'Saiba o que é lucro, o que é receita e qual é o dinheiro disponível de verdade — sem confusão.',
      color: C.orange,
    },
    {
      icon: <TrendingUp size={28} />,
      label: 'Controle para crescer',
      desc: 'Clientes, serviços, receitas e despesas em um único lugar. Tudo atualizado, tudo no controle.',
      color: C.red,
    },
    {
      icon: <Rocket size={28} />,
      label: 'Estratégia para alavancar',
      desc: 'Diagnóstico tributário, metas financeiras e score de saúde para tomar as decisões certas.',
      color: C.orange,
    },
  ]

  return (
    <section style={{ background: C.dark }} className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>A solução</p>
          <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
            O OrganizePJ resolve isso
          </h2>
          <p style={{ color: '#475569', fontSize: 17, marginTop: 14, maxWidth: 520, margin: '14px auto 0' }}>
            Trazemos clareza, controle e estratégia para a gestão financeira do seu negócio.
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {pillars.map(({ icon, label, desc, color }, i) => (
            <div key={i} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 20, padding: 30 }}>
              <div style={{ width: 54, height: 54, borderRadius: 14, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 22, color }}>
                {icon}
              </div>
              <h3 style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{label}</h3>
              <p style={{ color: '#475569', lineHeight: 1.65, fontSize: 15 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FEATURES ──────────────────────────────────────────────────────── */
function Features() {
  const items = [
    { icon: <Users size={20} />, label: 'Controle de clientes', desc: 'Cadastro e histórico completo dos seus clientes' },
    { icon: <FileText size={20} />, label: 'Gestão de serviços', desc: 'Serviços contratados, status e pagamentos' },
    { icon: <TrendingUp size={20} />, label: 'Receitas e recebimentos', desc: 'Controle do que entra com confirmação de recebimento' },
    { icon: <Wallet size={20} />, label: 'Despesas e parcelamentos', desc: 'Saídas organizadas por categoria' },
    { icon: <BarChart3 size={20} />, label: 'Fluxo de caixa', desc: 'Visão em tempo real do dinheiro disponível' },
    { icon: <PiggyBank size={20} />, label: 'Metas e reservas', desc: 'Crie metas e aloque receitas automaticamente' },
    { icon: <Shield size={20} />, label: 'Diagnóstico tributário', desc: 'MEI, Simples ou Lucro Presumido — o certo para você' },
    { icon: <Target size={20} />, label: 'Score de saúde financeira', desc: 'Nota 0–100 com indicadores financeiros reais' },
  ]

  return (
    <section style={{ background: 'white' }} className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color: C.red, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Funcionalidades</p>
          <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, color: C.dark }}>
            Tudo em uma plataforma
          </h2>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon, label, desc }, i) => (
            <div key={i} style={{ padding: 22, border: '1px solid #f0f4f8', borderRadius: 16 }}
              className="hover:shadow-md hover:border-orange-100 transition-all duration-200">
              <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,138,0,0.09)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14, color: C.orange }}>
                {icon}
              </div>
              <p style={{ fontWeight: 700, color: C.dark, marginBottom: 5, fontSize: 14 }}>{label}</p>
              <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.45 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── HOW IT WORKS ──────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num: '01', title: 'Cadastre sua empresa', desc: 'Crie sua conta gratuitamente, configure os dados da empresa e faça o diagnóstico tributário — leva menos de 4 minutos.' },
    { num: '02', title: 'Organize as finanças', desc: 'Cadastre clientes, serviços, receitas e despesas. O sistema calcula o disponível e os impostos automaticamente.' },
    { num: '03', title: 'Tome decisões com clareza', desc: 'Veja seu lucro real, acompanhe o score de saúde e use as metas para crescer com estratégia e segurança.' },
  ]

  return (
    <section style={{ background: C.gray }} className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color: C.red, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Como funciona</p>
          <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 'clamp(26px, 3vw, 40px)', fontWeight: 700, color: C.dark }}>
            Comece a controlar em minutos
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(({ num, title, desc }, i) => (
            <div key={i} className="text-center">
              <div style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontSize: 52, fontWeight: 800, color: 'rgba(255,138,0,0.18)', lineHeight: 1, marginBottom: 14 }}>{num}</div>
              <h3 style={{ fontFamily: 'var(--font-poppins, sans-serif)', fontWeight: 700, fontSize: 18, color: C.dark, marginBottom: 10 }}>{title}</h3>
              <p style={{ color: '#64748b', lineHeight: 1.65, fontSize: 14 }}>{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ background: C.dark, position: 'relative', overflow: 'hidden' }} className="py-28">
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 400, background: 'radial-gradient(circle, rgba(255,138,0,0.12) 0%, transparent 65%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: '40%', right: '10%', width: 300, height: 300, background: 'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 65%)', pointerEvents: 'none' }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
        <p style={{ color: C.orange, fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 16 }}>Comece hoje</p>
        <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontSize: 'clamp(30px, 4vw, 50px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 18 }}>
          Organize agora.<br />
          <span style={{ color: C.orange }}>Cresça com estratégia.</span>
        </h2>
        <p style={{ color: '#64748b', fontSize: 17, marginBottom: 38 }}>
          7 dias grátis. Sem cartão de crédito. Sem compromisso.
        </p>
        <Link href="/cadastro"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 10, background: `linear-gradient(135deg, ${C.orange}, ${C.lightRed})`, borderRadius: 14, padding: '16px 36px', color: 'white', fontWeight: 700, fontSize: 18, textDecoration: 'none', boxShadow: '0 12px 30px rgba(255,138,0,0.35)' }}>
          Começar trial gratuito <ArrowRight size={20} />
        </Link>
        <p style={{ color: '#1e293b', fontSize: 13, marginTop: 18 }}>Finanças Organizadas. Lucro Real.</p>
      </div>
    </section>
  )
}

/* ─── FOOTER ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background: '#111113', borderTop: '1px solid rgba(255,255,255,0.05)' }} className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p style={{ color: '#1e293b', fontSize: 13 }}>
          Finanças Organizadas. Lucro Real. · © 2026 organizepj.com.br
        </p>
        <div className="flex gap-5">
          <Link href="/login" style={{ color: '#334155', fontSize: 13 }}>Entrar</Link>
          <Link href="/cadastro" style={{ color: C.orange, fontSize: 13, fontWeight: 600 }}>Começar grátis</Link>
        </div>
      </div>
    </footer>
  )
}

/* ─── LOGO ───────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
      <BrandIcon size={34} />
      <span style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontWeight: 700, fontSize: 18 }}>
        Organize<span style={{ color: C.orange }}>PJ</span>
      </span>
    </div>
  )
}

/* ─── DASHBOARD MOCK ─────────────────────────────────────────────────── */
function DashboardMock() {
  return (
    <div style={{ background: '#222226', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 22, padding: 26, width: 345, boxShadow: '0 30px 70px rgba(0,0,0,0.55)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 22, paddingBottom: 18, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: C.orange }} />
          <span style={{ color: '#64748b', fontSize: 12 }}>Dashboard · Jun 2026</span>
        </div>
        <span style={{ color: '#1e293b', fontSize: 11 }}>OrganizePJ</span>
      </div>

      {/* Disponível */}
      <div style={{ marginBottom: 22 }}>
        <p style={{ color: '#475569', fontSize: 11, marginBottom: 5 }}>Disponível em Conta</p>
        <p style={{ color: 'white', fontSize: 32, fontWeight: 700, lineHeight: 1, marginBottom: 8, fontFamily: 'var(--font-poppins, sans-serif)' }}>R$ 18.750</p>
        <span style={{ color: '#22c55e', fontSize: 12, background: 'rgba(34,197,94,0.1)', padding: '3px 10px', borderRadius: 100 }}>↑ +12% vs mês anterior</span>
      </div>

      {/* Score */}
      <div style={{ marginBottom: 22 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#475569', fontSize: 12 }}>Saúde Financeira</span>
          <span style={{ color: C.orange, fontSize: 13, fontWeight: 700 }}>78 / 100</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 8 }}>
          <div style={{ width: '78%', background: `linear-gradient(to right, ${C.orange}, ${C.lightRed})`, height: '100%', borderRadius: 6 }} />
        </div>
      </div>

      {/* Numbers */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 22 }}>
        {[
          { label: 'Receitas', value: 'R$ 32.000', color: '#22c55e' },
          { label: 'Impostos', value: 'R$ 4.160', color: C.red },
          { label: 'Despesas', value: 'R$ 8.500', color: '#f59e0b' },
          { label: 'Lucro líquido', value: 'R$ 19.340', color: C.orange },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{ background: 'rgba(255,255,255,0.03)', borderRadius: 10, padding: '10px 13px' }}>
            <p style={{ color: '#334155', fontSize: 10, marginBottom: 4 }}>{label}</p>
            <p style={{ color, fontSize: 15, fontWeight: 700 }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Meta */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <span style={{ color: '#475569', fontSize: 12 }}>Meta: Reserva Emergência</span>
          <span style={{ color: '#475569', fontSize: 12 }}>65%</span>
        </div>
        <div style={{ background: 'rgba(255,255,255,0.07)', borderRadius: 6, height: 8 }}>
          <div style={{ width: '65%', background: C.orange, height: '100%', borderRadius: 6 }} />
        </div>
      </div>
    </div>
  )
}
