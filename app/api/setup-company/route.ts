export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const token = authHeader?.replace('Bearer ', '').trim()
  if (!token) return NextResponse.json({ error: 'No token' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    }
  )

  const { data: { user }, error: userError } = await supabase.auth.getUser(token)
  if (userError || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const body = await req.json()

  const { error } = await supabase.from('companies').insert([{
    owner_id: user.id,
    ...body,
  }])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Email de boas-vindas — fire and forget
  const companyName = (body.name as string | undefined) ?? 'sua empresa'
  const trialEnds = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })

  resend.emails.send({
    from: 'OrganizePJ <oi@organizepj.com.br>',
    to: user.email!,
    subject: 'Bem-vindo ao OrganizePJ — seu trial começa agora',
    html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F6F6;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" style="max-width:560px;border-radius:20px;overflow:hidden">

  <!-- Header dark -->
  <tr><td style="background:#1A1A1D;padding:36px 40px;text-align:center">
    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px">
      Organize<span style="color:#FF8A00">PJ</span>
    </p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3)">Gestão simplificada</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:white;padding:40px 40px 32px">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1A1A1D;line-height:1.3">
      Bem-vindo, ${companyName}!
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
      Sua conta está pronta. Você tem <strong>7 dias de trial completo</strong> — sem cartão, sem compromisso — para explorar tudo que o OrganizePJ oferece.
    </p>

    <!-- Trial badge -->
    <div style="background:#fff7ed;border:1px solid rgba(255,138,0,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#d97706">Trial ativo</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#1A1A1D">Acesso completo até <span style="color:#FF8A00">${trialEnds}</span></p>
    </div>

    <!-- Por onde começar -->
    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">Por onde começar</p>
    ${[
      ['Cadastre seus clientes', 'Menu → Clientes → Novo cliente'],
      ['Lance suas receitas', 'Menu → Receitas → Nova receita'],
      ['Veja o fluxo dos próximos 90 dias', 'Menu → Timeline'],
      ['Configure seu regime tributário', 'Menu → Configurações → Fiscal'],
    ].map(([title, hint]) => `
    <div style="display:flex;align-items:flex-start;gap:12px;margin-bottom:12px">
      <div style="width:8px;height:8px;border-radius:50%;background:#FF8A00;flex-shrink:0;margin-top:6px"></div>
      <div>
        <p style="margin:0;font-size:14px;font-weight:600;color:#1A1A1D">${title}</p>
        <p style="margin:0;font-size:12px;color:#94a3b8">${hint}</p>
      </div>
    </div>`).join('')}

    <!-- CTA -->
    <div style="text-align:center;margin-top:32px">
      <a href="https://www.organizepj.com.br/dashboard"
        style="display:inline-block;background:#FF8A00;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">
        Abrir meu painel →
      </a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F6F6F6;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:12px;color:#94a3b8">
      Dúvidas? Responda este e-mail ou escreva para
      <a href="mailto:contato@organizepj.com.br" style="color:#FF8A00">contato@organizepj.com.br</a>
    </p>
    <p style="margin:8px 0 0;font-size:11px;color:#cbd5e1">
      © 2026 OrganizePJ ·
      <a href="https://www.organizepj.com.br/privacidade" style="color:#cbd5e1">Privacidade</a> ·
      <a href="https://www.organizepj.com.br/termos" style="color:#cbd5e1">Termos</a>
    </p>
  </td></tr>

</table>
</td></tr></table>
</body></html>`,
  }).catch(() => {}) // não bloqueia o cadastro se o email falhar

  return NextResponse.json({ ok: true })
}
