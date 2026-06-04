'use client'
import { useState, useEffect } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

type Status = 'loading' | 'ready' | 'error' | 'done'

export default function RedefinirSenhaPage() {
  const router = useRouter()
  const [status, setStatus] = useState<Status>('loading')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    // The server callback already exchanged the code and set the session in cookies.
    // Just verify the session exists before showing the form.
    const supabase = getBrowserSupabase()
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setStatus('ready')
      } else {
        setStatus('error')
      }
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 6) { setFormError('A senha deve ter pelo menos 6 caracteres.'); return }
    if (password !== confirm) { setFormError('As senhas não coincidem.'); return }
    setSaving(true)
    setFormError('')
    const supabase = getBrowserSupabase()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setFormError('Erro ao redefinir senha: ' + error.message)
      setSaving(false)
    } else {
      setStatus('done')
      setTimeout(() => router.push('/dashboard'), 2000)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Organize PJ</h1>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm">

          {status === 'loading' && (
            <div className="text-center py-6 text-slate-400 text-sm">Verificando...</div>
          )}

          {status === 'error' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">⚠️</div>
              <h2 className="font-semibold text-slate-800 mb-2">Link inválido ou expirado</h2>
              <p className="text-sm text-slate-500 mb-4">Solicite um novo link de redefinição.</p>
              <Link href="/esqueci-senha" className="text-sm text-blue-600 font-medium">
                Solicitar novo link
              </Link>
            </div>
          )}

          {status === 'done' && (
            <div className="text-center py-4">
              <div className="text-4xl mb-3">✅</div>
              <h2 className="font-semibold text-slate-800 mb-2">Senha redefinida!</h2>
              <p className="text-sm text-slate-500">Redirecionando para o painel...</p>
            </div>
          )}

          {status === 'ready' && (
            <>
              <h2 className="font-semibold text-slate-800 mb-1">Nova senha</h2>
              <p className="text-sm text-slate-500 mb-5">Escolha uma senha nova para sua conta.</p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Nova senha</label>
                  <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="mínimo 6 caracteres" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-600 block mb-1">Confirmar senha</label>
                  <input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} required
                    className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="repita a senha" />
                </div>
                {formError && <p className="text-red-500 text-xs">{formError}</p>}
                <button type="submit" disabled={saving}
                  className="w-full bg-blue-600 text-white rounded-xl py-2.5 text-sm font-semibold disabled:opacity-60">
                  {saving ? 'Salvando...' : 'Salvar nova senha'}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
