import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = ['/', '/login', '/cadastro', '/assinar', '/esqueci-senha', '/redefinir-senha', '/api/auth']

export async function proxy(req: NextRequest) {
  const res = NextResponse.next()
  const pathname = req.nextUrl.pathname

  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) return res

  try {
    const supabase = createServerClient(
      'https://ylasrgswpybznngjhrmc.supabase.co',
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsYXNyZ3N3cHliem5uZ2pocm1jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0NTE4NDMsImV4cCI6MjA5NjAyNzg0M30.huqPr3ZDyHQC6F0Ef_1cUKiPFkRXPB2NfaIZiwASZGQ',
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
      return NextResponse.redirect(new URL('/login', req.url))
    }
  } catch {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|manifest.json|icon-.*\\.png|api/webhook).*)'],
}
