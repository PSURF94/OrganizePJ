'use client'
import { useState } from 'react'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import Link from 'next/link'
import BrandIcon from '@/components/BrandIcon'

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
    <div className="min-h-screen flex" style={{ background: '#1A1A1D' }}>

      {/* Left — brand panel (desktop only) */}
      <div className="hidden lg:flex flex-col justify-between w-96 flex-shrink-0 p-10"
        style={{ borderRight: '1px solid rgba(255,255,255,0.07)' }}>
        <Link href="/" className="flex items-center gap-2.5">
          <BrandIcon size={36} />
          <span style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontWeight: 700, fontSize: 18 }}>
            Organize<span style={{ color: '#FF8A00' }}>PJ</span>
          </span>
        </Link>

        <div>
          <p style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontSize: 28, fontWeight: 700, lineHeight: 1.3, marginBottom: 16 }}>
            Finanças organizadas.<br />
            <span style={{ color: '#FF8A00' }}>Lucro real.</span>
          </p>
          <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, lineHeight: 1.6 }}>
            Controle clientes, receitas, despesas e impostos em uma plataforma feita para quem trabalha por conta própria.
          </p>
        </div>

        <p style={{ color: 'rgba(255,255,255,0.18)', fontSize: 12 }}>
          © 2026 OrganizePJ · organizepj.com.br
        </p>
      </div>

      {/* Right — form */}
      <div className="flex-1 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">

          {/* Mobile logo */}
          <div className="flex lg:hidden justify-center mb-8">
            <Link href="/" className="flex items-center gap-2.5">
              <BrandIcon size={34} />
              <span style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontWeight: 700, fontSize: 17 }}>
                Organize<span style={{ color: '#FF8A00' }}>PJ</span>
              </span>
            </Link>
          </div>

          <div style={{ background: '#222226', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 20, padding: 32 }}>
            <h2 style={{ fontFamily: 'var(--font-poppins, sans-serif)', color: 'white', fontWeight: 700, fontSize: 20, marginBottom: 6 }}>
              Entrar
            </h2>
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 13, marginBottom: 24 }}>
              Acesse sua conta e retome o controle.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500, display: 'block', marginBottom: 6 }}>
                  E-mail
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="seu@email.com"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#FF8A00' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label style={{ color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 500 }}>
                    Senha
                  </label>
                  <Link href="/esqueci-senha"
                    style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}
                    onMouseEnter={(e) => { (e.target as HTMLElement).style.color = '#FF8A00' }}
                    onMouseLeave={(e) => { (e.target as HTMLElement).style.color = 'rgba(255,255,255,0.3)' }}>
                    Esqueci a senha
                  </Link>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '11px 14px',
                    fontSize: 14,
                    color: 'white',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                  onFocus={(e) => { e.target.style.borderColor = '#FF8A00' }}
                  onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.1)' }}
                />
              </div>

              {error && (
                <p style={{ color: '#E50914', fontSize: 12, background: 'rgba(229,9,20,0.08)', padding: '8px 12px', borderRadius: 8 }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  background: loading ? 'rgba(255,138,0,0.5)' : '#FF8A00',
                  color: 'white',
                  border: 'none',
                  borderRadius: 12,
                  padding: '13px',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-poppins, sans-serif)',
                  transition: 'opacity 0.15s',
                }}
              >
                {loading ? 'Entrando...' : 'Entrar'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.28)' }}>
              Não tem conta?{' '}
              <Link href="/cadastro"
                style={{ color: '#FF8A00', fontWeight: 600 }}>
                Experimente 7 dias grátis
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
