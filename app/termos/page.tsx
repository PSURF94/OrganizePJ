import Link from 'next/link'

export const metadata = { title: 'Termos de Uso — OrganizePJ' }

export default function TermosPage() {
  return (
    <div style={{ background: '#F6F6F6', minHeight: '100vh', padding: '48px 16px' }}>
      <div style={{ maxWidth: 720, margin: '0 auto' }}>

        <Link href="/" style={{ fontSize: 13, color: '#94a3b8', textDecoration: 'none', display: 'inline-block', marginBottom: 32 }}>
          ← OrganizePJ
        </Link>

        <div style={{ background: 'white', borderRadius: 20, padding: '40px 48px', border: '1px solid #eef0f3' }}>
          <h1 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 28, fontWeight: 800, color: '#1A1A1D', marginBottom: 6 }}>
            Termos de Uso
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 13, marginBottom: 40 }}>Última atualização: junho de 2026</p>

          {[
            {
              title: '1. Aceitação dos termos',
              body: 'Ao criar uma conta no OrganizePJ, você concorda com estes Termos de Uso. Se não concordar com alguma condição, não utilize a plataforma.',
            },
            {
              title: '2. Descrição do serviço',
              body: 'O OrganizePJ é uma plataforma SaaS de gestão financeira para prestadores de serviço e microempresas. Oferece controle de receitas, despesas, clientes, serviços, metas e projeções tributárias. O serviço é fornecido mediante pagamento de licença anual, precedida de período de trial de 7 dias gratuitos.',
            },
            {
              title: '3. Licença de uso',
              body: 'Ao assinar um plano, você recebe uma licença pessoal, intransferível e não exclusiva para utilizar a plataforma durante a vigência da assinatura. É proibido revender, sublicenciar ou compartilhar acesso à plataforma.',
            },
            {
              title: '4. Trial gratuito',
              body: 'Novos usuários têm acesso gratuito por 7 dias corridos. Após esse período, o acesso é suspenso até que uma licença seja adquirida. Não há cobrança automática ao término do trial.',
            },
            {
              title: '5. Pagamento e renovação',
              body: 'A licença é cobrada anualmente. O pagamento é processado pelo Asaas (PIX, boleto ou cartão). A licença não é renovada automaticamente — ao vencer, o usuário decide se deseja renovar.',
            },
            {
              title: '6. Reembolso',
              body: 'Oferecemos reembolso integral em até 7 dias após a compra, sem necessidade de justificativa. Após esse prazo, não realizamos reembolsos proporcionais.',
            },
            {
              title: '7. Responsabilidade pelos dados',
              body: 'Você é responsável pela veracidade e integridade dos dados inseridos na plataforma. O OrganizePJ não se responsabiliza por decisões financeiras ou tributárias tomadas com base nas informações exibidas, que têm caráter informativo e estimativo.',
            },
            {
              title: '8. Disponibilidade',
              body: 'Nos esforçamos para manter a plataforma disponível 24/7, mas não garantimos disponibilidade ininterrupta. Manutenções programadas serão comunicadas com antecedência sempre que possível.',
            },
            {
              title: '9. Encerramento de conta',
              body: 'Você pode solicitar o encerramento da conta a qualquer momento pelo e-mail contato@organizepj.com.br. Reservamo-nos o direito de suspender ou encerrar contas que violem estes termos.',
            },
            {
              title: '10. Foro e legislação',
              body: 'Estes termos são regidos pela legislação brasileira. Eventuais conflitos serão resolvidos no foro da comarca de domicílio do usuário, conforme o Código de Defesa do Consumidor.',
            },
          ].map(({ title, body }) => (
            <div key={title} style={{ marginBottom: 28 }}>
              <h2 style={{ fontFamily: 'var(--font-poppins,sans-serif)', fontSize: 15, fontWeight: 700, color: '#1A1A1D', marginBottom: 8 }}>{title}</h2>
              <p style={{ fontSize: 14, color: '#475569', lineHeight: 1.8 }}>{body}</p>
            </div>
          ))}
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: 12, marginTop: 24 }}>
          © 2026 OrganizePJ · <Link href="/privacidade" style={{ color: '#94a3b8' }}>Política de Privacidade</Link>
        </p>
      </div>
    </div>
  )
}
