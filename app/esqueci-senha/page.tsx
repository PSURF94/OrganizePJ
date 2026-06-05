'use client'
import { useState } from 'react'
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
    try {
      await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      setSent(true)
    } catch {
      setError('Erro ao processar. Tente novamente.')
      setLoading(false)
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
                Se <strong>{email}</strong> estiver cadastrado, você receberá uma senha temporária em instantes.
              </p>
              <p className="text-sm text-slate-400 mt-2 leading-relaxed">
                Após entrar, troque a senha em <strong>Configurações → Segurança</strong>.
              </p>
              <Link href="/login" className="block mt-5 text-sm text-blue-600 font-medium">
                Ir para o login
              </Link>
            </div>
          ) : (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Esqueceu a senha?</h2>
              <p className="text-sm text-slate-500 mb-5">
                Informe seu e-mail e enviaremos uma senha temporária. Depois você pode alterar em Configurações.
              </p>
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
                  {loading ? 'Enviando...' : 'Enviar senha temporária'}
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
