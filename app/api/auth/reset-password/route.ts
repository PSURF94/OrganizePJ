import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const SUPABASE_URL = 'https://ylasrgswpybznngjhrmc.supabase.co'

function adminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!)
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export async function POST(req: NextRequest) {
  const { email } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email obrigatório' }, { status: 400 })

  // Always return ok to avoid email enumeration
  const ok = NextResponse.json({ ok: true })

  const supabase = adminClient()
  const { data: { users } } = await supabase.auth.admin.listUsers({ perPage: 1000 })
  const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
  if (!user) return ok

  const tempPassword = generateTempPassword()
  const { error } = await supabase.auth.admin.updateUserById(user.id, { password: tempPassword })
  if (error) {
    console.error('[reset-password] updateUserById error:', error.message)
    return ok
  }

  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({
    from: 'Organize PJ <noreply@organizepj.com.br>',
    to: email,
    subject: 'Sua senha temporária — Organize PJ',
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px;">
        <h2 style="color:#1e293b;margin:0 0 8px">Organize PJ</h2>
        <p style="color:#475569;margin:0 0 24px">Recebemos seu pedido de recuperação de senha.</p>

        <div style="background:#f1f5f9;border-radius:12px;padding:20px;margin-bottom:24px;text-align:center;">
          <p style="color:#64748b;font-size:13px;margin:0 0 8px">Sua senha temporária:</p>
          <p style="color:#1e293b;font-size:26px;font-weight:bold;letter-spacing:3px;margin:0;font-family:monospace">${tempPassword}</p>
        </div>

        <p style="color:#475569;font-size:14px;margin:0 0 8px">
          Acesse <a href="https://www.organizepj.com.br/login" style="color:#2563eb">organizepj.com.br/login</a>
          com este e-mail e a senha acima.
        </p>
        <p style="color:#475569;font-size:14px;margin:0 0 32px">
          Após entrar, troque a senha em <strong>Configurações → Segurança</strong>.
        </p>

        <p style="color:#94a3b8;font-size:12px;margin:0">
          Se você não solicitou isso, ignore este e-mail. Sua conta permanece segura.
        </p>
      </div>
    `,
  })

  return ok
}
