'use client'
import { getBrowserSupabase } from '@/lib/supabase-browser'

export default function AssinarPage() {
  async function handleLogout() {
    const supabase = getBrowserSupabase()
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl p-8 max-w-sm w-full text-center shadow-sm">
        <div className="text-5xl mb-4">🔒</div>
        <h1 className="text-xl font-bold text-slate-900 mb-2">Licença expirada</h1>
        <p className="text-sm text-slate-500 mb-6">
          Seu período de acesso ao Organize PJ chegou ao fim. Renove sua licença para continuar usando todas as funcionalidades.
        </p>
        <a
          href="https://pay.hotmart.com/organizepj"
          className="block w-full bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm mb-3">
          Renovar licença — R$ 197/ano
        </a>
        <button onClick={handleLogout} className="text-sm text-slate-400 hover:text-slate-600">
          Sair da conta
        </button>
      </div>
    </div>
  )
}
