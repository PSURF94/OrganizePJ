export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { Resend } from 'resend'
import { createHash, timingSafeEqual } from 'crypto'

function safeEqual(a: string, b: string): boolean {
  const ha = createHash('sha256').update(a).digest()
  const hb = createHash('sha256').update(b).digest()
  return timingSafeEqual(ha, hb)
}

const resend = new Resend(process.env.RESEND_API_KEY)

export async function GET(req: NextRequest) {
  const cronSecret = process.env.CRON_SECRET
  if (!cronSecret) return NextResponse.json({ error: 'Not configured' }, { status: 503 })

  const auth = req.headers.get('authorization') ?? ''
  if (!safeEqual(auth, `Bearer ${cronSecret}`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? '').trim()
  )

  // Empresas com trial expirando amanhã (janela do dia inteiro)
  const tomorrowStart = new Date()
  tomorrowStart.setDate(tomorrowStart.getDate() + 1)
  tomorrowStart.setHours(0, 0, 0, 0)

  const tomorrowEnd = new Date()
  tomorrowEnd.setDate(tomorrowEnd.getDate() + 1)
  tomorrowEnd.setHours(23, 59, 59, 999)

  const { data: companies, error } = await supabase
    .from('companies')
    .select('id, name, owner_id, trial_ends_at')
    .eq('status', 'trial')
    .gte('trial_ends_at', tomorrowStart.toISOString())
    .lte('trial_ends_at', tomorrowEnd.toISOString())

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const results: { id: string; sent: boolean; error?: string }[] = []

  for (const company of companies ?? []) {
    const { data: { user } } = await supabase.auth.admin.getUserById(company.owner_id)
    if (!user?.email) {
      results.push({ id: company.id, sent: false, error: 'No email' })
      continue
    }

    const trialEnds = new Date(company.trial_ends_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })
    const companyName = (company.name as string | undefined) ?? 'sua empresa'

    try {
      await resend.emails.send({
        from: 'OrganizePJ <oi@organizepj.com.br>',
        to: user.email,
        subject: `${companyName}, seu trial expira amanhã`,
        html: `<!DOCTYPE html>
<html lang="pt-BR">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F6F6F6;font-family:Inter,Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 16px">
<table width="100%" style="max-width:560px;border-radius:20px;overflow:hidden">

  <!-- Header -->
  <tr><td style="background:#1A1A1D;padding:36px 40px;text-align:center">
    <p style="margin:0 0 4px;font-size:22px;font-weight:800;color:white;letter-spacing:-0.5px">
      Organize<span style="color:#FF8A00">PJ</span>
    </p>
    <p style="margin:0;font-size:12px;color:rgba(255,255,255,0.3)">Gestão simplificada</p>
  </td></tr>

  <!-- Body -->
  <tr><td style="background:white;padding:40px 40px 32px">
    <h1 style="margin:0 0 16px;font-size:22px;font-weight:800;color:#1A1A1D;line-height:1.3">
      Seu trial expira amanhã, ${companyName}
    </h1>
    <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.7">
      Você tem até <strong>${trialEnds}</strong> com acesso completo ao OrganizePJ. Para não perder o histórico e continuar acompanhando seu negócio, assine antes do prazo expirar.
    </p>

    <!-- Alerta -->
    <div style="background:#fff1f2;border:1px solid rgba(229,9,20,0.2);border-radius:12px;padding:16px 20px;margin-bottom:28px">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.1em;color:#e50914">Trial expirando</p>
      <p style="margin:0;font-size:15px;font-weight:700;color:#1A1A1D">Acesso encerra em <span style="color:#e50914">${trialEnds}</span></p>
    </div>

    <!-- Planos -->
    <p style="margin:0 0 14px;font-size:13px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.08em">Escolha seu plano</p>
    <div style="display:flex;gap:12px;margin-bottom:28px">
      <div style="flex:1;background:#f8fafc;border-radius:12px;padding:16px;border:1px solid #e2e8f0">
        <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;color:#64748b;letter-spacing:0.08em">Basic</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#1A1A1D">R$ 197<span style="font-size:13px;font-weight:400;color:#94a3b8">/ano</span></p>
        <p style="margin:4px 0 0;font-size:11px;color:#94a3b8">Menos de R$ 17/mês</p>
      </div>
      <div style="flex:1;background:#fff7ed;border-radius:12px;padding:16px;border:1px solid rgba(255,138,0,0.25)">
        <p style="margin:0 0 2px;font-size:11px;font-weight:700;text-transform:uppercase;color:#FF8A00;letter-spacing:0.08em">Pro</p>
        <p style="margin:0;font-size:22px;font-weight:800;color:#1A1A1D">R$ 497<span style="font-size:13px;font-weight:400;color:#94a3b8">/ano</span></p>
        <p style="margin:4px 0 0;font-size:11px;color:#FF8A00">Preço de fundador garantido</p>
      </div>
    </div>

    <!-- CTA -->
    <div style="text-align:center;margin-top:8px">
      <a href="https://www.organizepj.com.br/assinar"
        style="display:inline-block;background:#FF8A00;color:white;font-weight:700;font-size:15px;padding:14px 32px;border-radius:12px;text-decoration:none">
        Escolher meu plano →
      </a>
    </div>
  </td></tr>

  <!-- Footer -->
  <tr><td style="background:#F6F6F6;padding:20px 40px;text-align:center">
    <p style="margin:0;font-size:12px;color:#94a3b8">
      Dúvidas? Escreva para
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
      })
      results.push({ id: company.id, sent: true })
    } catch (e) {
      results.push({ id: company.id, sent: false, error: String(e) })
    }
  }

  return NextResponse.json({ processed: results.length, results })
}
