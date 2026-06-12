import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/assinar', '/esqueci-senha', '/redefinir-senha',
  '/privacidade', '/termos', '/api/auth', '/api/cron']

// ── Rate limiter in-memory (por instância Edge) ──────────────────────────────
const rl = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const rec = rl.get(key)
  if (!rec || now > rec.resetAt) {
    rl.set(key, { count: 1, resetAt: now + windowMs })
    return false
  }
  if (rec.count >= limit) return true
  rec.count++
  return false
}

// Rotas protegidas por rate limit: [path, limite, janela em ms]
const RATE_RULES: [string, number, number][] = [
  ['/api/setup-company',       5,  60 * 60 * 1000],  // 5 cadastros / hora
  ['/api/auth/reset-password', 3,  60 * 60 * 1000],  // 3 resets / hora
  ['/api/checkout',            5,  60 * 60 * 1000],  // 5 checkouts / hora
  ['/api/payment-link',       10, 60 * 60 * 1000],  // 10 links / hora (cria recursos no Asaas)
]

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  // Rate limiting — antes de qualquer outra verificação
  if (req.method === 'POST') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
    for (const [path, limit, window] of RATE_RULES) {
      if (pathname.startsWith(path)) {
        if (isRateLimited(`${ip}:${path}`, limit, window)) {
          return NextResponse.json(
            { error: 'Muitas tentativas. Aguarde alguns minutos e tente novamente.' },
            { status: 429 }
          )
        }
        break
      }
    }
  }

  if (PUBLIC_PATHS.some((p) => p === '/' ? pathname === '/' : pathname.startsWith(p))) return res

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => req.cookies.getAll(),
          setAll: (toSet) =>
            toSet.forEach(({ name, value, options }) =>
              res.cookies.set(name, value, options)
            ),
        },
      }
    )

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
      }
      return NextResponse.redirect(new URL('/login', req.url))
    }

    // Rotas de API que precisam funcionar mesmo com licença expirada (fluxo de pagamento)
    const LICENSE_EXEMPT = ['/api/checkout', '/api/configuracoes']
    if (!LICENSE_EXEMPT.some((p) => pathname.startsWith(p))) {
      const { data: company } = await supabase
        .from('companies')
        .select('status, trial_ends_at, license_expires_at')
        .eq('owner_id', session.user.id)
        .single()

      const now = new Date()
      const isExpired =
        company?.status === 'expired' ||
        (company?.status === 'trial' && company?.trial_ends_at && new Date(company.trial_ends_at) < now) ||
        (company?.status === 'active' && company?.license_expires_at && new Date(company.license_expires_at) < now)

      if (isExpired) {
        if (pathname.startsWith('/api/')) {
          return NextResponse.json({ error: 'Licença expirada' }, { status: 402 })
        }
        return NextResponse.redirect(new URL('/assinar', req.url))
      }
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|api/webhook).*)'],
}
