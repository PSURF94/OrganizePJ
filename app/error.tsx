'use client'
import { useEffect } from 'react'
import Link from 'next/link'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => { console.error(error) }, [error])

  return (
    <div style={{ minHeight: '100vh', background: '#F6F6F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1A1A1D', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
        <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(229,9,20,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 26 }}>
          ⚠
        </div>
        <p style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontSize: 20, fontWeight: 800, marginBottom: 10 }}>
          Algo deu errado
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          Ocorreu um erro inesperado. Você pode tentar novamente ou voltar ao painel.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button
            onClick={reset}
            style={{ background: '#FF8A00', color: 'white', fontWeight: 700, fontSize: 14, padding: '10px 22px', borderRadius: 12, border: 'none', cursor: 'pointer' }}
          >
            Tentar novamente
          </button>
          <Link
            href="/dashboard"
            style={{ background: 'rgba(255,255,255,0.06)', color: 'rgba(255,255,255,0.6)', fontWeight: 600, fontSize: 14, padding: '10px 22px', borderRadius: 12, textDecoration: 'none' }}
          >
            Ir ao painel
          </Link>
        </div>
      </div>
    </div>
  )
}
