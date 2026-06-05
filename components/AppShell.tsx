'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import {
  LayoutDashboard, TrendingUp, Target, Wallet,
  Users, FileText, CalendarDays, Settings, LogOut, BarChart3,
} from 'lucide-react'

const NAV = [
  { href: '/dashboard', label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/receitas',  label: 'Receitas',   icon: TrendingUp },
  { href: '/objetivos', label: 'Metas',      icon: Target },
  { href: '/despesas',  label: 'Despesas',   icon: Wallet },
  { href: '/clientes',  label: 'Clientes',   icon: Users },
  { href: '/servicos',  label: 'Serviços',   icon: FileText },
  { href: '/timeline',  label: 'Timeline',   icon: CalendarDays },
]

const MOBILE_NAV = NAV.slice(0, 5)

const C = {
  sidebar:  '#1A1A1D',
  border:   'rgba(255,255,255,0.07)',
  inactive: 'rgba(255,255,255,0.4)',
  hover:    'rgba(255,255,255,0.06)',
  active:   '#FF8A00',
  activeBg: 'rgba(255,138,0,0.12)',
} as const

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  function isActive(href: string) {
    return pathname.startsWith(href)
  }

  return (
    <div className="flex min-h-screen" style={{ background: '#F6F6F6' }}>

      {/* ── Sidebar desktop ── */}
      <aside
        className="hidden md:flex flex-col w-56 fixed h-full z-20"
        style={{ background: C.sidebar, borderRight: `1px solid ${C.border}` }}
      >
        {/* Logo */}
        <div className="px-4 py-5" style={{ borderBottom: `1px solid ${C.border}` }}>
          <div className="flex items-center gap-2.5">
            <div
              className="flex items-center justify-center w-8 h-8 rounded-lg flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #FF8A00, #E50914)' }}
            >
              <BarChart3 size={16} color="white" />
            </div>
            <div>
              <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontWeight: 700, fontSize: 15, lineHeight: 1 }}>
                Organize<span style={{ color: C.active }}>PJ</span>
              </p>
              <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: 10, marginTop: 2 }}>Gestão simplificada</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href)
            return (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors"
                style={{
                  color: active ? C.active : C.inactive,
                  background: active ? C.activeBg : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = C.hover
                    e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent'
                    e.currentTarget.style.color = C.inactive
                  }
                }}
              >
                <Icon size={17} strokeWidth={active ? 2.2 : 1.8} />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-2 py-3" style={{ borderTop: `1px solid ${C.border}` }}>
          <Link
            href="/configuracoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full"
            style={{ color: isActive('/configuracoes') ? C.active : C.inactive }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = C.hover
              e.currentTarget.style.color = 'rgba(255,255,255,0.75)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
              e.currentTarget.style.color = isActive('/configuracoes') ? C.active : C.inactive
            }}
          >
            <Settings size={17} strokeWidth={1.8} />
            Configurações
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left mt-0.5 transition-colors"
            style={{ color: 'rgba(255,255,255,0.25)' }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#FF3B30' }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.25)' }}
          >
            <LogOut size={17} strokeWidth={1.8} />
            Sair
          </button>
        </div>
      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>

      {/* ── Bottom nav mobile ── */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 flex justify-around z-20"
        style={{ background: C.sidebar, borderTop: `1px solid ${C.border}` }}
      >
        {MOBILE_NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href)
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center py-2.5 px-1 flex-1 transition-colors"
              style={{ color: active ? C.active : C.inactive }}
            >
              <Icon size={20} strokeWidth={active ? 2.2 : 1.7} />
              <span className="text-[10px] mt-1 font-medium">
                {label === 'Metas e Reservas' ? 'Metas' : label}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
