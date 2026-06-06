import Link from 'next/link'

export const metadata = { title: 'Política de Privacidade — OrganizePJ' }

export default function PrivacidadePage() {
  return (
    <div style={{ background: '#F6F6F6', minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← OrganizePJ
        </Link>

        <div style={{ background: 'white', borderRadius: 20, padding: '40px 48px', border: '1px solid #eef0f3' }}>
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 28, fontWeight: 800, color: '#1A1A1D', marginBottom: 6 }}>
            Política de Privacidade
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 40 }}>Última atualização: junho de 2026</p>

          {[
            {
              title: '1. Quem somos',
              body: 'O OrganizePJ é uma plataforma de gestão financeira para prestadores de serviço e microempresas, desenvolvida e operada por Paulo Henrique Mota Marques. Para dúvidas sobre privacidade, entre em contato pelo e-mail: contato@organizepj.com.br.',
            },
            {
              title: '2. Quais dados coletamos',
              body: 'Coletamos apenas os dados necessários para o funcionamento da plataforma: (a) dados de cadastro: nome, e-mail e senha criptografada; (b) dados da empresa: nome, CNPJ, regime tributário; (c) dados financeiros inseridos por você: receitas, despesas, clientes, serviços e metas. Não coletamos dados de cartão de crédito — pagamentos são processados diretamente pelo Asaas.',
            },
            {
              title: '3. Como usamos seus dados',
              body: 'Seus dados são usados exclusivamente para: exibir o painel financeiro, calcular impostos e projeções, gerar relatórios, e enviar comunicações transacionais da plataforma (boas-vindas, expiração de licença). Não vendemos, alugamos nem compartilhamos seus dados com terceiros para fins de marketing.',
            },
            {
              title: '4. Onde seus dados são armazenados',
              body: 'Os dados são armazenados no Supabase, infraestrutura em nuvem com criptografia em repouso e em trânsito (TLS). Os servidores estão localizados nos Estados Unidos. Ao usar o OrganizePJ, você consente com essa transferência internacional, realizada sob as garantias adequadas de segurança.',
            },
            {
              title: '5. Retenção de dados',
              body: 'Seus dados são mantidos enquanto sua conta estiver ativa. Se você solicitar a exclusão da conta, os dados pessoais serão removidos em até 30 dias, exceto quando a retenção for obrigatória por lei.',
            },
            {
              title: '6. Seus direitos (LGPD)',
              body: 'Nos termos da Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a: confirmar a existência de tratamento dos seus dados, acessar seus dados, corrigir dados incompletos ou desatualizados, solicitar anonimização, bloqueio ou eliminação, revogar o consentimento a qualquer momento. Para exercer esses direitos, envie e-mail para contato@organizepj.com.br.',
            },
            {
              title: '7. Cookies',
              body: 'Usamos cookies exclusivamente para manter sua sessão autenticada. Não utilizamos cookies de rastreamento ou publicidade.',
            },
            {
              title: '8. Alterações nesta política',
              body: 'Podemos atualizar esta política periodicamente. Quando houver alterações relevantes, notificaremos por e-mail. O uso continuado da plataforma após a notificação constitui aceitação da política atualizada.',
            },
          ].map(({ title, body }) => (
            <div key={title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 15, fontWeight: 700, color: '#1A1A1D', marginBottom: 8 }}>{title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{body}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
          © 2026 OrganizePJ · <Link href="/termos" style={{ color: '#94a3b8' }}>Termos de Uso</Link>
        </p>
      </div>
    </div>
  )
}
