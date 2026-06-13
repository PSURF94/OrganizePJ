import { getServerSupabase } from '@/lib/supabase-server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowRight, CheckCircle, ChevronDown } from 'lucide-react'
import BrandIcon from '@/components/BrandIcon'
import AnimateOnScroll from '@/components/AnimateOnScroll'

const C = {
  dark:    '#1A1A1D',
  orange:  '#FF8A00',
  red:     '#E50914',
  light:   '#FF3B30',
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
      <Reveal />
      <HowItWorks />
      <FAQ />
      <FinalCTA />
      <Footer />
    </div>
  )
}

/* ─── NAV ─────────────────────────────────────────────────────────── */
function Nav() {
  return (
    <nav style={{ background: C.dark, borderBottom: '1px solid rgba(255,255,255,0.06)' }}
      className="sticky top-0 z-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-2">
          <Link href="/login"
            style={{ color: 'rgba(255,255,255,0.38)', fontSize: 14, fontWeight: 500, padding: '8px 14px' }}>
            Entrar
          </Link>
          <Link href="/cadastro"
            style={{ background: C.orange, borderRadius: 10, color: 'white', fontSize: 14, fontWeight: 700, padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 6 }}>
            Começar grátis <ArrowRight size={13} />
          </Link>
        </div>
      </div>
    </nav>
  )
}

/* ─── HERO ────────────────────────────────────────────────────────── */
function Hero() {
  return (
    <section style={{ background: C.dark, minHeight: '92vh', position: 'relative', overflow: 'hidden' }}
      className="flex items-center">
      <div style={{ position:'absolute', top:-100, left:-60, width:500, height:500, background:'radial-gradient(circle, rgba(255,138,0,0.11) 0%, transparent 70%)', pointerEvents:'none' }} />
      <div style={{ position:'absolute', bottom:-80, right:80, width:380, height:380, background:'radial-gradient(circle, rgba(229,9,20,0.07) 0%, transparent 70%)', pointerEvents:'none' }} />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-24 w-full">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(255,138,0,0.09)', border:'1px solid rgba(255,138,0,0.22)', borderRadius:100, padding:'5px 14px', marginBottom:28 }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:C.orange }} />
              <span style={{ color:C.orange, fontSize:13, fontWeight:500 }}>7 dias grátis · Sem cartão de crédito</span>
            </div>

            <h1 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontSize:'clamp(32px,5vw,54px)', fontWeight:800, lineHeight:1.1, marginBottom:20 }}>
              Quanto do que você faturou<br />
              <span style={{ color:C.orange }}>virou lucro de verdade?</span>
            </h1>

            <p style={{ color:'#64748b', fontSize:17, lineHeight:1.65, marginBottom:36, maxWidth:460 }}>
              O OrganizePJ responde essa pergunta — e todas as outras que seu negócio precisa de resposta.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link href="/cadastro"
                style={{ background:`linear-gradient(135deg,${C.orange},${C.light})`, borderRadius:12, padding:'14px 26px', color:'white', fontWeight:700, fontSize:16, display:'inline-flex', alignItems:'center', gap:8, textDecoration:'none', boxShadow:'0 8px 24px rgba(255,138,0,0.28)' }}>
                Descobrir meu lucro real <ArrowRight size={17} />
              </Link>
              <Link href="/login"
                style={{ border:'1px solid rgba(255,255,255,0.1)', borderRadius:12, padding:'14px 26px', color:'#64748b', fontWeight:600, fontSize:16, display:'inline-flex', alignItems:'center', textDecoration:'none' }}>
                Já tenho conta
              </Link>
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

/* ─── REVEAL — perguntas que o produto responde ───────────────────── */
function Reveal() {
  const items = [
    {
      q: 'Quanto posso retirar este mês sem comprometer o caixa?',
      a: 'O OrganizePJ calcula seu pró-labore ideal e distribuição de lucros com base no seu regime tributário — sem precisar de contador para isso.',
    },
    {
      q: 'Meu negócio está crescendo ou só faturando mais?',
      a: 'Relatórios de receitas vs despesas mês a mês mostram se o crescimento é real. Você vê, em segundos, se lucrou ou só girou dinheiro.',
    },
    {
      q: 'Estou pagando o imposto certo?',
      a: 'O diagnóstico tributário compara MEI, Simples e Lucro Presumido automaticamente e aponta o regime mais vantajoso para o seu faturamento atual.',
    },
    {
      q: 'Meu caixa aguenta os próximos 30 dias?',
      a: 'A timeline de fluxo mostra quando o dinheiro entra e sai nos próximos 90 dias — e avisa antes de apertar.',
    },
    {
      q: 'Tenho reserva suficiente para emergências?',
      a: 'Crie metas de reserva e veja o termômetro avançar automaticamente a cada receita recebida.',
    },
  ]

  return (
    <section style={{ background: 'white' }} className="py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll>
          <div style={{ textAlign:'center', marginBottom:40 }}>
            <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>O que você vai descobrir</p>
            <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(24px,3vw,36px)', fontWeight:700, color:C.dark, lineHeight:1.2 }}>
              As perguntas que todo empresário<br />deveria conseguir responder
            </h2>
          </div>
        </AnimateOnScroll>

        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {items.map(({ q, a }, i) => (
            <AnimateOnScroll key={i} delay={i * 60}>
              <details
                style={{ background:C.gray, borderRadius:16, overflow:'hidden' }}
                {...(i === 0 ? { open: true } : {})}
              >
                <summary style={{
                  padding:'18px 22px',
                  fontWeight:700,
                  color:C.dark,
                  fontSize:15,
                  cursor:'pointer',
                  display:'flex',
                  justifyContent:'space-between',
                  alignItems:'center',
                  gap:12,
                  listStyle:'none',
                }}>
                  {q}
                  <ChevronDown size={16} color="#94a3b8" style={{ flexShrink:0 }} />
                </summary>
                <p style={{ padding:'0 22px 20px', color:'#475569', lineHeight:1.7, fontSize:14, borderTop:'1px solid rgba(0,0,0,0.04)', paddingTop:14, margin:0 }}>
                  {a}
                </p>
              </details>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── HOW IT WORKS ────────────────────────────────────────────────── */
function HowItWorks() {
  const steps = [
    { num:'01', title:'Crie sua conta', desc:'4 minutos. Nome da empresa, faturamento, regime tributário. O painel já está funcional.' },
    { num:'02', title:'Lance receitas e despesas', desc:'O OrganizePJ calcula impostos, disponível real e retiradas seguras automaticamente.' },
    { num:'03', title:'Tome decisões com clareza', desc:'Posso retirar? Meu caixa está saudável? Estou crescendo? Tudo respondido em tempo real.' },
  ]

  return (
    <section style={{ background: C.dark }} className="py-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll>
          <div style={{ textAlign:'center', marginBottom:56 }}>
            <p style={{ color:C.orange, fontSize:12, fontWeight:700, letterSpacing:'0.12em', textTransform:'uppercase', marginBottom:10 }}>Como funciona</p>
            <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(24px,3vw,38px)', fontWeight:700, color:'white', lineHeight:1.2 }}>
              Simples por design
            </h2>
          </div>
        </AnimateOnScroll>

        <div className="grid md:grid-cols-3 gap-10">
          {steps.map(({ num, title, desc }, i) => (
            <AnimateOnScroll key={i} delay={i * 100}>
              <div>
                <div style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:48, fontWeight:800, color:'rgba(255,138,0,0.18)', lineHeight:1, marginBottom:16 }}>{num}</div>
                <h3 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontWeight:700, fontSize:18, color:'white', marginBottom:10 }}>{title}</h3>
                <p style={{ color:'#475569', lineHeight:1.65, fontSize:14 }}>{desc}</p>
              </div>
            </AnimateOnScroll>
          ))}
        </div>

        <AnimateOnScroll delay={300} style={{ textAlign:'center', marginTop:52 }}>
          <Link href="/cadastro"
            style={{ display:'inline-flex', alignItems:'center', gap:8, background:`linear-gradient(135deg,${C.orange},${C.light})`, borderRadius:12, padding:'14px 30px', color:'white', fontWeight:700, fontSize:16, textDecoration:'none', boxShadow:'0 8px 24px rgba(255,138,0,0.25)' }}>
            Começar agora — é grátis <ArrowRight size={17} />
          </Link>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* ─── FAQ ─────────────────────────────────────────────────────────── */
function FAQ() {
  const faqs = [
    { q:'É difícil de usar?', a:'Se você usa WhatsApp, você usa o OrganizePJ. Não tem módulos escondidos nem terminologia de contador.' },
    { q:'Serve para MEI, Simples e Lucro Presumido?', a:'Sim. O diagnóstico tributário considera os limites e regras de cada regime e calcula automaticamente o que você deve pagar.' },
    { q:'Quanto tempo leva para configurar?', a:'Menos de 4 minutos. Você preenche os dados básicos e o painel já está funcional. Não tem migração nem planilha para importar.' },
    { q:'E se eu não gostar?', a:'7 dias de acesso completo, sem cartão. Se não fizer sentido, é só não continuar. Sem multa.' },
  ]

  return (
    <section style={{ background: C.gray }} className="py-24">
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <AnimateOnScroll>
          <div style={{ textAlign:'center', marginBottom:36 }}>
            <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', fontSize:'clamp(22px,3vw,32px)', fontWeight:700, color:C.dark, lineHeight:1.2 }}>
              Dúvidas rápidas
            </h2>
          </div>
        </AnimateOnScroll>

        <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
          {faqs.map(({ q, a }, i) => (
            <AnimateOnScroll key={i} delay={i * 50}>
              <details style={{ background:'white', borderRadius:14, border:'1px solid #e8ecf1', overflow:'hidden' }}>
                <summary style={{ padding:'16px 20px', fontWeight:700, color:C.dark, fontSize:14, cursor:'pointer', listStyle:'none', display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
                  {q}
                  <ChevronDown size={15} color="#94a3b8" style={{ flexShrink:0 }} />
                </summary>
                <p style={{ padding:'0 20px 16px', color:'#64748b', lineHeight:1.7, fontSize:13, borderTop:'1px solid #f0f4f8', paddingTop:14, margin:0 }}>
                  {a}
                </p>
              </details>
            </AnimateOnScroll>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ─── FINAL CTA ───────────────────────────────────────────────────── */
function FinalCTA() {
  return (
    <section style={{ background:C.dark, position:'relative', overflow:'hidden' }} className="py-28">
      <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:600, height:360, background:'radial-gradient(circle, rgba(255,138,0,0.11) 0%, transparent 65%)', pointerEvents:'none' }} />

      <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center relative">
        <AnimateOnScroll>
          <h2 style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontSize:'clamp(26px,4vw,46px)', fontWeight:800, lineHeight:1.15, marginBottom:16 }}>
            A partir de hoje, você vai saber<br />
            <span style={{ color:C.orange }}>exatamente o que seu negócio está dizendo.</span>
          </h2>
          <p style={{ color:'#475569', fontSize:16, marginBottom:36 }}>
            7 dias grátis · Sem cartão · Cancele quando quiser
          </p>

          <Link href="/cadastro"
            style={{ display:'inline-flex', alignItems:'center', gap:10, background:`linear-gradient(135deg,${C.orange},${C.light})`, borderRadius:14, padding:'16px 36px', color:'white', fontWeight:700, fontSize:17, textDecoration:'none', boxShadow:'0 12px 30px rgba(255,138,0,0.32)' }}>
            Quero entender meu negócio <ArrowRight size={19} />
          </Link>

          <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8">
            {['Sem cartão de crédito', 'Configure em 4 minutos', 'MEI · ME · Simples · Lucro Presumido'].map((t) => (
              <div key={t} style={{ display:'flex', alignItems:'center', gap:5 }}>
                <CheckCircle size={12} color={C.orange} />
                <span style={{ color:'#334155', fontSize:13 }}>{t}</span>
              </div>
            ))}
          </div>
        </AnimateOnScroll>
      </div>
    </section>
  )
}

/* ─── FOOTER ──────────────────────────────────────────────────────── */
function Footer() {
  return (
    <footer style={{ background:'#111113', borderTop:'1px solid rgba(255,255,255,0.05)' }} className="py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <Logo />
          <p style={{ color:'rgba(255,255,255,0.18)', fontSize:13 }}>
            Clareza para decidir. Lucro real. · © 2026 organizepj.com.br
          </p>
          <div className="flex gap-5">
            <Link href="/login"     style={{ color:'rgba(255,255,255,0.28)', fontSize:13 }}>Entrar</Link>
            <Link href="/cadastro"  style={{ color:C.orange, fontSize:13, fontWeight:600 }}>Começar grátis</Link>
          </div>
        </div>
        <div style={{ borderTop:'1px solid rgba(255,255,255,0.05)', paddingTop:16, display:'flex', justifyContent:'center', gap:24 }}>
          <Link href="/privacidade" style={{ color:'rgba(255,255,255,0.2)', fontSize:12 }}>Política de Privacidade</Link>
          <Link href="/termos"      style={{ color:'rgba(255,255,255,0.2)', fontSize:12 }}>Termos de Uso</Link>
          <a href="mailto:contato@organizepj.com.br" style={{ color:'rgba(255,255,255,0.2)', fontSize:12 }}>Contato</a>
        </div>
      </div>
    </footer>
  )
}

/* ─── LOGO ────────────────────────────────────────────────────────── */
function Logo() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:9 }}>
      <BrandIcon size={32} />
      <span style={{ fontFamily:'var(--font-poppins,sans-serif)', color:'white', fontWeight:700, fontSize:17 }}>
        Organize<span style={{ color:C.orange }}>PJ</span>
      </span>
    </div>
  )
}

/* ─── DASHBOARD MOCK ──────────────────────────────────────────────── */
function DashboardMock() {
  return (
    <div style={{ background:'#222226', border:'1px solid rgba(255,255,255,0.08)', borderRadius:22, padding:24, width:330, boxShadow:'0 30px 70px rgba(0,0,0,0.55)' }}>
      <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20, paddingBottom:16, borderBottom:'1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ width:7, height:7, borderRadius:'50%', background:C.orange }} />
        <span style={{ color:'#64748b', fontSize:12 }}>Dashboard · Jun 2026</span>
      </div>

      <div style={{ marginBottom:20 }}>
        <p style={{ color:'#475569', fontSize:11, marginBottom:4 }}>Disponível em Conta</p>
        <p style={{ color:'white', fontSize:30, fontWeight:700, lineHeight:1, marginBottom:8, fontFamily:'var(--font-poppins,sans-serif)' }}>R$ 18.750</p>
        <span style={{ color:'#22c55e', fontSize:12, background:'rgba(34,197,94,0.1)', padding:'3px 10px', borderRadius:100 }}>↑ +12% vs mês anterior</span>
      </div>

      <div style={{ marginBottom:20 }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
          <span style={{ color:'#475569', fontSize:12 }}>Saúde Financeira</span>
          <span style={{ color:C.orange, fontSize:13, fontWeight:700 }}>78 / 100</span>
        </div>
        <div style={{ background:'rgba(255,255,255,0.07)', borderRadius:6, height:7 }}>
          <div style={{ width:'78%', background:`linear-gradient(to right,${C.orange},${C.light})`, height:'100%', borderRadius:6 }} />
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:9, marginBottom:18 }}>
        {[
          { label:'Receitas',      value:'R$ 32.000', color:'#22c55e' },
          { label:'Impostos',      value:'R$ 4.160',  color:C.red },
          { label:'Despesas',      value:'R$ 8.500',  color:'#f59e0b' },
          { label:'Lucro líquido', value:'R$ 19.340', color:C.orange },
        ].map(({ label, value, color }, i) => (
          <div key={i} style={{ background:'rgba(255,255,255,0.03)', borderRadius:10, padding:'9px 12px' }}>
            <p style={{ color:'#334155', fontSize:10, marginBottom:3 }}>{label}</p>
            <p style={{ color, fontSize:14, fontWeight:700 }}>{value}</p>
          </div>
        ))}
      </div>

      <div style={{ background:'rgba(34,197,94,0.07)', border:'1px solid rgba(34,197,94,0.16)', borderRadius:10, padding:'10px 12px' }}>
        <div style={{ display:'flex', justifyContent:'space-between', marginBottom:5 }}>
          <span style={{ color:'#64748b', fontSize:11 }}>Posso retirar este mês?</span>
          <span style={{ color:'#22c55e', fontSize:10, fontWeight:700 }}>SIM ✓</span>
        </div>
        <div style={{ display:'flex', justifyContent:'space-between' }}>
          <div>
            <p style={{ color:'#334155', fontSize:10, marginBottom:2 }}>Pró-labore</p>
            <p style={{ color:'#22c55e', fontSize:13, fontWeight:700 }}>R$ 1.621</p>
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
