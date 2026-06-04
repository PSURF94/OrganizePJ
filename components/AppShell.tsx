'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { getBrowserSupabase } from '@/lib/supabase-browser'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',       icon: '📊' },
  { href: '/receitas',   label: 'Receitas',         icon: '💰' },
  { href: '/objetivos',  label: 'Metas e Reservas', icon: '🎯' },
  { href: '/despesas',   label: 'Despesas',         icon: '💸' },
  { href: '/clientes',   label: 'Clientes',         icon: '👥' },
  { href: '/servicos',   label: 'Serviços',         icon: '📋' },
  { href: '/timeline',   label: 'Timeline',         icon: '📅' },
]

const MOBILE_NAV = NAV.slice(0, 5)

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  async function handleLogout() {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar desktop */}
      <aside className="hidden md:flex flex-col w-56 bg-white border-r border-slate-200 fixed h-full z-10">
        <div className="px-4 py-5 border-b border-slate-100">
          <p className="font-bold text-slate-900 text-sm">Organize PJ</p>
          <p className="text-xs text-slate-400">Gestão simplificada</p>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                pathname.startsWith(item.href)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <span>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-slate-100">
          <Link href="/configuracoes"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-50">
            <span>⚙️</span> Configurações
          </Link>
          <button onClick={handleLogout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-400 hover:text-red-500 w-full text-left mt-1">
            <span>→</span> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 md:ml-56 pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom nav mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 flex justify-around z-10">
        {MOBILE_NAV.map((item) => (
          <Link key={item.href} href={item.href}
            className={`flex flex-col items-center py-2 px-1 text-xs flex-1 ${
              pathname.startsWith(item.href) ? 'text-blue-600' : 'text-slate-400'
            }`}>
            <span className="text-lg">{item.icon}</span>
            <span className="text-[10px] mt-0.5">
              {item.label === 'Metas e Reservas' ? 'Metas' : item.label}
            </span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
