'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getBrowserSupabase()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('E-mail ou senha incorretos.')
      setLoading(false)
    } else {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Organize PJ</h1>
          <p className="text-sm text-slate-500 mt-1">Organize sua empresa. Simplifique sua gestão.</p>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-4">Entrar</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">E-mail</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-slate-600 block mb-1">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
          <div className="flex flex-col items-center gap-1 mt-4">
            <Link href="/esqueci-senha" className="text-xs text-slate-400 hover:text-blue-600">
              Esqueci minha senha
            </Link>
            <p className="text-xs text-slate-500">
              Não tem conta?{' '}
              <Link href="/cadastro" className="text-blue-600 font-medium">
                Experimente grátis por 7 dias
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
