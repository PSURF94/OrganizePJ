import Link from 'next/link'

export default function NotFound() {
  return (
    <div style={{ minHeight: '100vh', background: '#F6F6F6', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ background: '#1A1A1D', borderRadius: 24, padding: '48px 40px', maxWidth: 420, width: '100%', textAlign: 'center', border: '1px solid rgba(255,255,255,0.07)' }}>
        <p style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: '#FF8A00', fontSize: 64, fontWeight: 800, lineHeight: 1, marginBottom: 12 }}>
          404
        </p>
        <p style={{ fontFamily: 'var(--font-poppins,sans-serif)', color: 'white', fontSize: 20, fontWeight: 700, marginBottom: 10 }}>
          Página não encontrada
        </p>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14, lineHeight: 1.6, marginBottom: 28 }}>
          O endereço que você acessou não existe ou foi movido.
        </p>
        <Link
          href="/dashboard"
          style={{ display: 'inline-block', background: '#FF8A00', color: 'white', fontWeight: 700, fontSize: 14, padding: '12px 28px', borderRadius: 12, textDecoration: 'none' }}
        >
          Voltar ao painel
        </Link>
      </div>
    </div>
  )
}
