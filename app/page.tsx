import type React from 'react'
import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import {
  CheckCircle, ArrowRight, X,
  DollarSign, TrendingUp, Users, Wallet,
  Shield, PiggyBank, Target, BarChart3,
  Zap, Clock, HelpCircle, Rocket, FileText,
} from 'lucide-react'
import BrandIcon from '@/components/BrandIcon'

const C = {
  dark:    '#1A1A1D',
  orange:  '#FF8A00',
  red:     '#E50914',
  lightRed:'#FF3B30',
  gray:    '#F6F6F6',
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
      <Questions />
      <Comparison />
      <Benefits />
      <HowItWorks />
      <Objections />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ─── NAV ──────────────────────────────────────────────────────────── */
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
    <section style={{ background: C.dark, minHeight: '94vh' }}
      className="relative flex items-center overflow-hidden">
      <div style={{ position:'absolute', top:-120, left:-80, width:520, height:520, background:'radial-gradient(circle, rgba(255,138,0,0.13) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-60, right:160, width:420, height:420, background:'radial-gradient(circle, rgba(229,9,20,0.08) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-14 items-center">

          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, background:'rgba(255,138,0,0.1)', border:'1px solid rgba(255,138,0,0.25)', borderRadius:100, padding:'6px 16px', marginBottom:28 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.orange }} />
              <span style={{ color:C.orange, fontSize:13, fontWeight:500 }}>Acesso especial · 7 dias grátis · Sem cartão</span>
            </div>

            <h1 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontSize:'clamp(34px,5vw,56px)', fontWeight:800, lineHeight:1.1, marginBottom:22 }}>
              Quanto do que você faturou<br />
              <span style={{ color:C.orange }}>virou lucro de verdade?</span>
            </h1>

            <p style={{ color:'#94a3b8', fontSize:18, lineHeight:1.7, marginBottom:14, maxWidth:490 }}>
              A maioria dos empresários fatura, paga contas, reinveste — e no final não sabe se lucrou ou só sobreviveu.
            </p>
            <p style={{ color:'#64748b', fontSize:16, lineHeight:1.65, marginBottom:38, maxWidth:490 }}>
              O OrganizePJ mostra o que realmente importa para você decidir, crescer e lucrar com mais segurança.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro"
                style={{ background:`linear-gradient(135deg,${C.orange},${C.lightRed})`, borderRadius:12, padding:'15px 28px', color:'white', fontWeight:700, fontSize:16, display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', boxShadow:'0 8px 24px rgba(255,138,0,0.3)' }}>
                Descobrir meu lucro real <ArrowRight size={18} />
              </Link>
              <Link href="/login"
                style={{ border:'1px solid rgba(255,255,255,0.12)', borderRadius:12, padding:'15px 28px', color:'#94a3b8', fontWeight:600, fontSize:16, display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none' }}>
                Já tenho conta
              </Link>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8">
              {['Sem cartão de crédito', 'Configure em 4 minutos', 'Cancele quando quiser'].map((t) => (
                <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
                  <CheckCircle size={13} color={C.orange} />
                  <span style={{ color:'#475569', fontSize:13 }}>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hidden lg:flex justify-end">
            <DashboardMock />
          </div>
        </div>
      </div>
    </section>
  )
}

/* ─── PAIN ──────────────────────────────────────────────────────────── */
function Pain() {
  const pains = [
    { icon: <DollarSign size={20} />, text: 'Tem dinheiro na conta, mas não sabe se pode contratar sem correr riscos' },
    { icon: <Wallet size={20} />,     text: 'Faturou bem esse mês, mas no final sobrou muito menos do que deveria' },
    { icon: <TrendingUp size={20} />, text: 'Você tira dinheiro da empresa quando precisa e depois não sabe quanto realmente lucrou' },
    { icon: <Rocket size={20} />,     text: 'Quer retirar dinheiro da empresa mas tem medo de comprometer o caixa' },
    { icon: <Shield size={20} />,     text: 'Paga imposto todo mês mas não tem certeza se está pagando o correto' },
    { icon: <BarChart3 size={20} />,  text: 'Não sabe se está crescendo de verdade ou apenas faturando mais' },
  ]

  return (
    <section style={{ background:'white' }} className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color:C.red, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Você se reconhece?</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(26px,3vw,40px)', fontWeight:700, color:C.dark, lineHeight:1.2, marginBottom:16 }}>
            Faturando, mas sem saber<br />se está lucrando de verdade
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {pains.map(({ icon, text }, i) => (
            <div key={i} style={{ background:C.gray, borderRadius:18, padding:'22px 24px', display:'flex', gap:16, alignItems:'flex-start' }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(229,9,20,0.07)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, color:C.red }}>
                {icon}
              </div>
              <p style={{ color:'#334155', fontWeight:500, lineHeight:1.55, fontSize:14 }}>{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── QUESTIONS ─────────────────────────────────────────────────────── */
function Questions() {
  const qs = [
    { q:'Quanto realmente sobrou para mim este mês?',  a:'O dashboard mostra seu lucro líquido real — depois de impostos, despesas e separação de caixa.' },
    { q:'Posso retirar dinheiro da empresa agora?',    a:'A calculadora de retiradas te diz exatamente quanto você pode tirar sem prejudicar o caixa.' },
    { q:'Posso contratar alguém ou investir?',         a:'Veja a projeção de fluxo dos próximos 30 dias e decida com base em dados, não em intuição.' },
    { q:'Minha empresa está saudável?',                a:'O painel de saúde financeira traduz todos os números em um status simples e visual.' },
    { q:'Estou pagando imposto correto?',              a:'O diagnóstico tributário compara MEI, Simples e Lucro Presumido e aponta o regime mais vantajoso.' },
    { q:'Estou crescendo ou só faturando mais?',       a:'Relatórios de receitas vs despesas mês a mês mostram se o crescimento é real e sustentável.' },
  ]

  return (
    <section style={{ background:C.gray }} className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>As respostas que importam</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(26px,3vw,40px)', fontWeight:700, color:C.dark, lineHeight:1.2, marginBottom:16 }}>
            O OrganizePJ responde as perguntas<br />que todo empresário faz
          </h2>
          <p style={{ color:'#64748b', fontSize:16, maxWidth:480, margin:'0 auto' }}>
            Você não precisa de mais relatórios. Precisa de clareza para agir.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qs.map(({ q, a }, i) => (
            <div key={i} style={{ background:'white', borderRadius:20, padding:26, border:'1px solid #e8ecf1', borderTop:`4px solid ${C.orange}` }}>
              <p style={{ fontFamily:'var(--font-poppins,sans-serif)', fontWeight:700, color:C.dark, fontSize:15, marginBottom:12, lineHeight:1.4 }}>
                "{q}"
              </p>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.6 }}>{a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── COMPARISON ────────────────────────────────────────────────────── */
function Comparison() {
  const criteria = [
    'Responde quanto você pode retirar',
    'Mostra seu lucro líquido real',
    'Diagnóstico tributário automático',
    'Feito para o dono do negócio',
    'Configure em menos de 5 minutos',
    'Recomenda o que fazer',
  ]

  const dim: React.CSSProperties = {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid rgba(255,255,255,0.07)',
    borderRadius: 20,
    padding: 28,
    opacity: 0.55,
  }

  return (
    <section style={{ background:C.dark }} className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Por que o OrganizePJ?</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(26px,3vw,40px)', fontWeight:700, color:'white', lineHeight:1.2 }}>
            Planilhas não pensam.<br />ERPs complicam. O OrganizePJ decide com você.
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-5 items-start">

          {/* Planilha */}
          <div style={dim}>
            <p style={{ color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Planilha</p>
            <p style={{ color:'#334155', fontSize:13, marginBottom:24, lineHeight:1.4 }}>Você faz o trabalho todo</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {criteria.map((c) => (
                <div key={c} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <X size={15} color="#334155" strokeWidth={2.5} style={{ flexShrink:0 }} />
                  <span style={{ color:'#334155', fontSize:13, lineHeight:1.3 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Software de Gestão */}
          <div style={dim}>
            <p style={{ color:'#64748b', fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>Software de Gestão</p>
            <p style={{ color:'#334155', fontSize:13, marginBottom:24, lineHeight:1.4 }}>Feito para quem tem contador</p>
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {criteria.map((c) => (
                <div key={c} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <X size={15} color="#334155" strokeWidth={2.5} style={{ flexShrink:0 }} />
                  <span style={{ color:'#334155', fontSize:13, lineHeight:1.3 }}>{c}</span>
                </div>
              ))}
            </div>
          </div>

          {/* OrganizePJ — destaque */}
          <div style={{ position:'relative', background:'rgba(255,138,0,0.07)', border:'2px solid rgba(255,138,0,0.45)', borderRadius:20, padding:28, boxShadow:'0 24px 64px rgba(255,138,0,0.18)', transform:'translateY(-12px)' }}>
            {/* Badge */}
            <div style={{ position:'absolute', top:-16, left:'50%', transform:'translateX(-50%)', background:`linear-gradient(135deg,${C.orange},${C.lightRed})`, borderRadius:100, padding:'5px 18px', whiteSpace:'nowrap', boxShadow:'0 4px 14px rgba(255,138,0,0.4)' }}>
              <span style={{ color:'white', fontSize:11, fontWeight:800, letterSpacing:'0.06em', textTransform:'uppercase' }}>Melhor escolha</span>
            </div>

            <p style={{ color:C.orange, fontSize:11, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:8 }}>OrganizePJ</p>
            <p style={{ color:'#94a3b8', fontSize:13, marginBottom:24, lineHeight:1.4 }}>Feito para você decidir</p>

            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
              {criteria.map((c) => (
                <div key={c} style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <CheckCircle size={15} color={C.orange} strokeWidth={2.5} style={{ flexShrink:0 }} />
                  <span style={{ color:'white', fontSize:13, fontWeight:500, lineHeight:1.3 }}>{c}</span>
                </div>
              ))}
            </div>

            <Link href="/cadastro" style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8, marginTop:28, background:`linear-gradient(135deg,${C.orange},${C.lightRed})`, borderRadius:12, padding:'12px 20px', color:'white', fontWeight:700, fontSize:14, textDecoration:'none', boxShadow:'0 6px 20px rgba(255,138,0,0.3)' }}>
              Começar grátis <ArrowRight size={15} />
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}

/* ─── BENEFITS ──────────────────────────────────────────────────────── */
function Benefits() {
  const items = [
    {
      icon: <DollarSign size={20} />,
      q: 'Quanto posso retirar este mês?',
      desc: 'Calcula pró-labore e distribuição de lucros otimizados pelo seu regime tributário — sem precisar de contador para isso.',
    },
    {
      icon: <BarChart3 size={20} />,
      q: 'Meu caixa aguenta os próximos 30 dias?',
      desc: 'A timeline de fluxo mostra, com precisão, quando o dinheiro entra e sai — e avisa antes de apertar.',
    },
    {
      icon: <Shield size={20} />,
      q: 'Estou pagando imposto correto?',
      desc: 'O diagnóstico tributário compara regimes e mostra o caminho mais vantajoso para o seu faturamento atual.',
    },
    {
      icon: <TrendingUp size={20} />,
      q: 'Onde foi o dinheiro esse mês?',
      desc: 'Receitas parceladas, despesas recorrentes e retiradas — tudo consolidado em um painel que você entende em segundos.',
    },
    {
      icon: <Target size={20} />,
      q: 'Minha meta está evoluindo?',
      desc: 'Crie reservas e objetivos financeiros. A cada receita recebida, o OrganizePJ aloca a porcentagem automaticamente.',
    },
    {
      icon: <Users size={20} />,
      q: 'Quanto cada cliente representa?',
      desc: 'Veja o peso de cada cliente no seu faturamento e tome decisões sobre em quem investir mais energia.',
    },
    {
      icon: <FileText size={20} />,
      q: 'Esse serviço vale a pena cobrar?',
      desc: 'Acompanhe o ciclo completo: orçamento → aprovado → faturado → recebido. Saiba o que converte e o que trava.',
    },
    {
      icon: <PiggyBank size={20} />,
      q: 'Tenho reserva para emergências?',
      desc: 'Visualize sua reserva de capital e saiba exatamente o que falta para atingir a segurança que você precisa.',
    },
  ]

  return (
    <section style={{ background:'white' }} className="py-24">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color:C.red, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>O que você ganha</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(26px,3vw,40px)', fontWeight:700, color:C.dark, lineHeight:1.2, marginBottom:16 }}>
            Cada decisão que você precisar tomar,<br />o OrganizePJ tem a resposta
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {items.map(({ icon, q, desc }, i) => (
            <div key={i}
              style={{ padding:24, border:'1px solid #f0f4f8', borderRadius:18 }}
              className="hover:shadow-md hover:border-orange-100 transition-all duration-200">
              <div style={{ width:40, height:40, borderRadius:10, background:'rgba(255,138,0,0.09)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:14, color:C.orange }}>
                {icon}
              </div>
              <p style={{ fontWeight:700, color:C.dark, fontSize:14, marginBottom:8, lineHeight:1.35 }}>{q}</p>
              <p style={{ color:'#64748b', fontSize:13, lineHeight:1.5 }}>{desc}</p>
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
    {
      num:'01',
      title:'Crie sua conta em 2 minutos',
      desc:'Sem burocracia. Preencha os dados básicos da empresa e responda 4 perguntas sobre seu regime tributário. Tudo pronto.',
    },
    {
      num:'02',
      title:'Lance suas receitas e despesas',
      desc:'Adicione o que recebe e o que paga. O OrganizePJ calcula automaticamente impostos, disponível real e retiradas seguras.',
    },
    {
      num:'03',
      title:'Tome decisões com tranquilidade',
      desc:'Seu painel responde, em tempo real: posso retirar? Meu caixa está saudável? Estou crescendo? Chega de incerteza.',
    },
  ]

  return (
    <section style={{ background:'white' }} className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-16">
          <p style={{ color:C.red, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Como funciona</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(26px,3vw,40px)', fontWeight:700, color:C.dark, lineHeight:1.2, marginBottom:10 }}>
            Pronto para tomar decisões melhores<br />em menos de 4 minutos
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(({ num, title, desc }, i) => (
            <div key={i}>
              <div style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:52, fontWeight:800, color:'rgba(255,138,0,0.15)', lineHeight:1, marginBottom:14 }}>{num}</div>
              <h3 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontWeight:700, fontSize:18, color:C.dark, marginBottom:10 }}>{title}</h3>
              <p style={{ color:'#64748b', lineHeight:1.65, fontSize:14 }}>{desc}</p>
            </div>
          ))}
        </div>

        <div className="text-center mt-14">
          <Link href="/cadastro"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:`linear-gradient(135deg,${C.orange},${C.lightRed})`, borderRadius:12, padding:'14px 32px', color:'white', fontWeight:700, fontSize:16, textDecoration:'none', boxShadow:'0 8px 24px rgba(255,138,0,0.25)' }}>
            Começar agora — é grátis <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </section>
  )
}

/* ─── OBJECTIONS ────────────────────────────────────────────────────── */
function Objections() {
  const faqs = [
    {
      q:'É difícil de usar?',
      a:'Não. Se você sabe usar WhatsApp, você usa o OrganizePJ. Não tem módulos escondidos, não tem terminologia de contador. Tudo foi pensado para quem administra o próprio negócio, sem suporte técnico do lado.',
    },
    {
      q:'Preciso entender finanças para usar?',
      a:'Não precisa. O OrganizePJ traduz os números do seu negócio em respostas simples. Você não vai ver "DRE" ou "fluxo de caixa projetado" sem explicação — vai ver "Você pode retirar R$3.200 com segurança este mês".',
    },
    {
      q:'Serve para MEI?',
      a:'Sim. O OrganizePJ foi construído especialmente para MEI, ME e pequenas empresas. O diagnóstico tributário considera os limites e regras específicas do MEI.',
    },
    {
      q:'Serve para Simples Nacional e Lucro Presumido?',
      a:'Sim para ambos. O sistema calcula automaticamente a alíquota correta, projeta o DAS (no caso do Simples) e otimiza suas retiradas dentro das regras do seu regime.',
    },
    {
      q:'Quanto tempo leva para configurar?',
      a:'Menos de 4 minutos. Você preenche o nome da empresa, CNPJ, faturamento médio e regime tributário. Pronto — o painel já está funcional. Não tem migração, não tem planilha para importar.',
    },
    {
      q:'E se eu não gostar?',
      a:'7 dias de acesso completo, sem cartão de crédito. Se não fizer sentido para você, é só não continuar. Sem multa, sem complicação.',
    },
  ]

  return (
    <section style={{ background:C.gray }} className="py-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="text-center mb-14">
          <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:12 }}>Dúvidas frequentes</p>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(24px,3vw,36px)', fontWeight:700, color:C.dark, lineHeight:1.2 }}>
            Respostas diretas para quem ainda<br />está em dúvida
          </h2>
        </div>

        <div className="space-y-3">
          {faqs.map(({ q, a }, i) => (
            <details key={i}
              style={{ background:'white', borderRadius:16, border:'1px solid #e8ecf1', overflow:'hidden' }}
              {...(i === 0 ? { open: true } : {})}>
              <summary style={{ padding:'18px 22px', fontWeight:700, color:C.dark, fontSize:15, cursor:'pointer', display:'flex', justifyContent:'space-between', alignItems:'center', listStyle:'none' }}>
                {q}
                <HelpCircle size={16} color="#94a3b8" style={{ flexShrink:0 }} />
              </summary>
              <p style={{ padding:'0 22px 20px', color:'#64748b', lineHeight:1.7, fontSize:14, borderTop:'1px solid #f0f4f8', paddingTop:16, margin:0 }}>
                {a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ─────────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ background:C.dark, position:'relative', overflow:'hidden' }} className="py-28">
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:700, height:400, background:'radial-gradient(circle, rgba(255,138,0,0.12) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative">
        <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:16 }}>Comece hoje</p>
        <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontSize:'clamp(28px,4vw,48px)', fontWeight:800, lineHeight:1.15, marginBottom:18 }}>
          A partir de hoje, você vai saber<br />
          <span style={{ color:C.orange }}>exatamente o que seu negócio está dizendo.</span>
        </h2>
        <p style={{ color:'#475569', fontSize:17, marginBottom:14 }}>
          7 dias de acesso completo. Sem cartão. Sem compromisso.
        </p>
        <p style={{ color:'#334155', fontSize:14, marginBottom:36 }}>
          Se não fizer sentido para você, é só não continuar. Simples assim.
        </p>

        <Link href="/cadastro"
          style={{ display:'inline-flex', alignItems:'center', gap:10, background:`linear-gradient(135deg,${C.orange},${C.lightRed})`, borderRadius:14, padding:'17px 38px', color:'white', fontWeight:700, fontSize:18, textDecoration:'none', boxShadow:'0 12px 30px rgba(255,138,0,0.35)' }}>
          Quero entender meu negócio <ArrowRight size={20} />
        </Link>

        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
          {['Sem cartão de crédito', 'Configure em 4 minutos', 'MEI · ME · Simples Nacional · Lucro Presumido'].map((t) => (
            <div key={t} style={{ display:'flex', alignItems:'center', gap:6 }}>
              <CheckCircle size={13} color={C.orange} />
              <span style={{ color:'#334155', fontSize:13 }}>{t}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FOOTER ─────────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background:'#111113', borderTop:'1px solid rgba(255,255,255,0.05)' }} className="py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <Logo />
        <p style={{ color:'#1e293b', fontSize:13 }}>
          Clareza para decidir. Lucro real. · © 2026 organizepj.com.br
        </p>
        <div className="flex gap-5">
          <Link href="/login"  style={{ color:'#334155', fontSize:13 }}>Entrar</Link>
          <Link href="/cadastro" style={{ color:C.orange, fontSize:13, fontWeight:600 }}>Começar grátis</Link>
        </div>
      </div>
    </footer>
  )
}

/* ─── LOGO ──────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
      <BrandIcon size={34} />
      <span style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:18 }}>
        Organize<span style={{ color:C.orange }}>PJ</span>
      </span>
    </div>
  )
}

/* ─── DASHBOARD MOCK ─────────────────────────────────────────────────── */
function DashboardMock() {
  return (
    <div style={{ background:'#222226', border:'1px solid rgba(255,255,255,0.09)', borderRadius:22, padding:26, width:345, boxShadow:'0 30px 70px rgba(0,0,0,0.55)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:22, paddingBottom:18, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <div style={{ width:8, height:8, borderRadius:'50%', background:C.orange }} />
          <span style={{ color:'#64748b', fontSize:12 }}>Dashboard · Jun 2026</span>
        </div>
        <span style={{ color:'#1e293b', fontSize:11 }}>OrganizePJ</span>
      </div>

      <div style={{ marginBottom:22 }}>
        <p style={{ color:'#475569', fontSize:11, marginBottom:5 }}>Disponível em Conta</p>
        <p style={{ color:'white', fontSize:32, fontWeight:700, lineHeight:1, marginBottom:8, fontFamily:'var(--font-poppins,sans-serif)' }}>R$ 18.750</p>
        <span style={{ color:'#22c55e', fontSize:12, background:'rgba(34,197,94,0.1)', padding:'3px 10px', borderRadius:100 }}>↑ +12% vs mês anterior</span>
      </div>

      <div style={{ marginBottom:22 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:8 }}>
          <span style={{ color:'#475569', fontSize:12 }}>Saúde Financeira</span>
          <span style={{ color:C.orange, fontSize:13, fontWeight:700 }}>78 / 100</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:6, height:8 }}>
          <div style={{ width:'78%', background:`linear-gradient(to right,${C.orange},${C.lightRed})`, height:'100%', borderRadius:6 }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:22 }}>
        {[
          { label:'Receitas',      value:'R$ 32.000', color:'#22c55e' },
          { label:'Impostos',      value:'R$ 4.160',  color:C.red },
          { label:'Despesas',      value:'R$ 8.500',  color:'#f59e0b' },
          { label:'Lucro líquido', value:'R$ 19.340', color:C.orange },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'10px 13px' }}>
            <p style={{ color:'#334155', fontSize:10, marginBottom:4 }}>{label}</p>
            <p style={{ color, fontSize:15, fontWeight:700 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.18)', borderRadius:10, padding:'10px 12px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:6 }}>
          <span style={{ color:'#64748b', fontSize:11 }}>Posso retirar este mês?</span>
          <span style={{ color:'#22c55e', fontSize:10, fontWeight:700 }}>SIM ✓</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#334155', fontSize:10, marginBottom:2 }}>Pró-labore</p>
            <p style={{ color:'#22c55e', fontSize:13, fontWeight:700 }}>R$ 1.518</p>
          </div>
          <div style={{ textAlign:'right' }}>
            <p style={{ color:'#334155', fontSize:10, marginBottom:2 }}>Distribuição</p>
            <p style={{ color:C.orange, fontSize:13, fontWeight:700 }}>R$ 13.822</p>
          </div>
        </div>
      </div>
    </div>
  )
}
