'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const supabase = getBrowserSupabase()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/redefinir-senha`,
    })
    if (error) {
      setError('Erro ao enviar e-mail. Verifique o endereço informado.')
      setLoading(false)
    } else {
      setSent(true)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Organize PJ</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">📬</div>
              <h2 className="font-semibold text-slate-800 mb-2">E-mail enviado!</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Enviamos um link de redefinição para <strong>{email}</strong>. Verifique sua caixa de entrada.
              </p>
              <Link href="/login" className="block mt-5 text-sm text-blue-600 font-medium">
                Voltar ao login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Esqueceu a senha?</h2>
              <p className="text-sm text-slate-500 mb-5">Informe seu e-mail e enviamos um link para criar uma nova senha.</p>
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
                {error && <p className="text-red-500 text-xs">{error}</p>}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {loading ? 'Enviando...' : 'Enviar link'}
                </button>
              </form>
              <p className="text-center text-xs text-slate-500 mt-4">
                <Link href="/login" className="text-blue-600 font-medium">Voltar ao login</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
