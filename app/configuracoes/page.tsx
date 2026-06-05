'use client'
import { useEffect, useState } from 'react'
import AppShell from '@/components/AppShell'
import type { Company } from '@/lib/constants'
import { getBrowserSupabase } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function ConfiguracoesPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [form, setForm] = useState({
    name: '', cnpj: '', saldo_inicial: '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const [passwordForm, setPasswordForm] = useState({ nova: '', confirmar: '' })
  const [savingPassword, setSavingPassword] = useState(false)
  const [passwordMsg, setPasswordMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    fetch('/api/configuracoes')
      .then((r) => r.json())
      .then((d: Company) => {
        setCompany(d)
        setForm({
          name: d.name,
          cnpj: d.cnpj || '',
          saldo_inicial: d.saldo_inicial ? String(d.saldo_inicial) : '',
        })
      })
  }, [])

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault()
    if (passwordForm.nova.length < 6) {
      setPasswordMsg({ ok: false, text: 'A senha deve ter pelo menos 6 caracteres.' })
      return
    }
    if (passwordForm.nova !== passwordForm.confirmar) {
      setPasswordMsg({ ok: false, text: 'As senhas não coincidem.' })
      return
    }
    setSavingPassword(true)
    setPasswordMsg(null)
    const supabase = getBrowserSupabase()
    const { error } = await supabase.auth.updateUser({ password: passwordForm.nova })
    setSavingPassword(false)
    if (error) {
      setPasswordMsg({ ok: false, text: 'Erro ao alterar senha. Tente novamente.' })
    } else {
      setPasswordForm({ nova: '', confirmar: '' })
      setPasswordMsg({ ok: true, text: 'Senha alterada com sucesso!' })
      setTimeout(() => setPasswordMsg(null), 3000)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    await fetch('/api/configuracoes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        cnpj: form.cnpj,
        saldo_inicial: form.saldo_inicial ? Number(form.saldo_inicial) : null,
        tax_regime: company?.tax_regime ?? 'simples',
        faturamento_mensal: company?.faturamento_mensal ?? null,
        num_funcionarios: company?.num_funcionarios ?? null,
        service_category: company?.service_category ?? null,
        folha_mensal: company?.folha_mensal ?? null,
        simples_rate: company?.simples_rate ?? 0,
        prolabore_mensal: company?.prolabore_mensal ?? null,
        retirada_desejada_mensal: company?.retirada_desejada_mensal ?? null,
      }),
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  if (!company) return <AppShell><div className="text-center py-20 text-slate-400 text-sm">Carregando...</div></AppShell>

  return (
    <AppShell>
      <div className="px-4 pt-6 max-w-lg mx-auto pb-10">
        <h1 className="text-xl font-bold text-slate-900 mb-6">Configurações</h1>

        <form onSubmit={handleSave} className="space-y-4">

          {/* Empresa */}
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Empresa</p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nome da empresa *</label>
              <input required value={form.name} onChange={(e) => set('name', e.target.value)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">CNPJ</label>
              <input value={form.cnpj} onChange={(e) => set('cnpj', e.target.value)}
                placeholder="00.000.000/0001-00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">
                Saldo inicial em conta <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <input type="number" min="0" step="0.01" value={form.saldo_inicial}
                onChange={(e) => set('saldo_inicial', e.target.value)}
                placeholder="0.00"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]" />
            </div>
          </div>

          {/* Link para Fiscal */}
          <Link href="/fiscal"
            className="flex items-center justify-between bg-white rounded-2xl p-4 hover:bg-orange-50 transition-colors border border-transparent hover:border-orange-100">
            <div>
              <p className="text-sm font-semibold text-slate-700">Fiscal &amp; Retiradas</p>
              <p className="text-xs text-slate-400 mt-0.5">Diagnóstico tributário e otimização de pró-labore</p>
            </div>
            <span className="text-[#FF8A00] text-sm font-semibold">→</span>
          </Link>

          {/* Status */}
          <div className="bg-slate-50 rounded-xl p-3 text-xs text-slate-500">
            <p>Status: <strong className="text-slate-700">
              {company.status === 'trial' ? 'Trial' : company.status === 'active' ? 'Ativa' : 'Expirada'}
            </strong></p>
            {company.status === 'trial' && company.trial_ends_at && (
              <p className="mt-0.5">Trial expira em: <strong className="text-slate-700">{new Date(company.trial_ends_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
            {company.status === 'active' && company.license_expires_at && (
              <p className="mt-0.5">Licença até: <strong className="text-slate-700">{new Date(company.license_expires_at).toLocaleDateString('pt-BR')}</strong></p>
            )}
          </div>

          <button type="submit" disabled={saving}
            className="w-full bg-[#FF8A00] text-white font-semibold py-3 rounded-xl text-sm disabled:opacity-50">
            {saved ? 'Salvo!' : saving ? 'Salvando...' : 'Salvar Configurações'}
          </button>
        </form>

        {/* Segurança */}
        <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
          <div className="bg-white rounded-2xl p-5 space-y-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Segurança</p>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Nova senha</label>
              <input
                type="password"
                value={passwordForm.nova}
                onChange={(e) => setPasswordForm((p) => ({ ...p, nova: e.target.value }))}
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Confirmar nova senha</label>
              <input
                type="password"
                value={passwordForm.confirmar}
                onChange={(e) => setPasswordForm((p) => ({ ...p, confirmar: e.target.value }))}
                required
                minLength={6}
                placeholder="Repita a nova senha"
                className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#FF8A00]"
              />
            </div>
            {passwordMsg && (
              <p className={`text-xs font-medium ${passwordMsg.ok ? 'text-emerald-600' : 'text-red-500'}`}>
                {passwordMsg.text}
              </p>
            )}
            <button
              type="submit"
              disabled={savingPassword}
              className="w-full bg-slate-800 text-white font-semibold py-2.5 rounded-xl text-sm disabled:opacity-50"
            >
              {savingPassword ? 'Salvando...' : 'Alterar Senha'}
            </button>
          </div>
        </form>

        {/* PRO: Multi-empresa */}
        <a href="/em-breve?f=multi-empresa" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginTop: 8, border: '1.5px dashed rgba(255,138,0,0.35)', borderRadius: 16, padding: '14px 18px', textDecoration: 'none', background: 'rgba(255,138,0,0.03)' }}>
          <div>
            <p style={{ fontSize: 13, fontWeight: 700, color: '#1A1A1D', marginBottom: 2 }}>Multi-Empresa</p>
            <p style={{ fontSize: 11, color: '#94a3b8' }}>Gerencie mais de um CNPJ na mesma conta, alternando entre eles com um clique</p>
          </div>
          <span style={{ flexShrink: 0, background: 'linear-gradient(135deg,#FF8A00,#FF3B30)', borderRadius: 100, padding: '5px 12px', color: 'white', fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            USE NO PRO
          </span>
        </a>
      </div>
    </AppShell>
  )
}
