export type TaxRecommendation = {
  regime: 'mei' | 'simples' | 'presumido'
  label: string
  rate: number
  monthly_tax: number
  das_fixo_mensal: number | null
  is_fixed_das: boolean
  anexo: 'III' | 'V' | null
  fator_r: number | null
  motivo: string
  riscos: string[]
  complexidade: 'Baixa' | 'Média' | 'Alta'
  faixa_tributacao: string
}

// DAS MEI 2026 para prestador de serviço: INSS (5% × R$1.621) + ISS (R$5)
export const MEI_DAS_MENSAL = 86.05

export const SERVICE_CATEGORIES: {
  value: string
  label: string
  anexo: 'III' | 'V'
  mei_permitido: boolean
  mei_motivo?: string
}[] = [
  {
    value: 'tech',
    label: 'Tecnologia / Programação',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Atividades de TI e programação frequentemente superam o limite anual do MEI (R$ 81.000) e têm restrições de CNAE. Simples Nacional Anexo V é o regime mais adequado.',
  },
  {
    value: 'consultoria',
    label: 'Consultoria / Gestão',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Consultoria empresarial geralmente não consta no rol de atividades MEI permitidas. Simples Nacional é a alternativa correta.',
  },
  {
    value: 'design',
    label: 'Design / Publicidade / Marketing',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Atividades de publicidade e marketing têm restrições no MEI. Verifique seu CNAE com um contador — Simples Nacional costuma ser mais adequado.',
  },
  {
    value: 'saude',
    label: 'Saúde (médico, psicólogo, dentista)',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Profissões de saúde regulamentadas (CRM, CRP, CRO) são vedadas ao MEI. Simples Nacional é a alternativa obrigatória.',
  },
  {
    value: 'arquitetura',
    label: 'Arquitetura / Engenharia',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Arquitetos e engenheiros são obrigados a manter registro no CONFEA/CREA — profissão vedada ao MEI por regulamentação federal.',
  },
  {
    value: 'direito',
    label: 'Advocacia / Direito',
    anexo: 'V',
    mei_permitido: false,
    mei_motivo: 'Advogados não podem ser MEI pela regulamentação da OAB (Lei 8.906/1994). Simples Nacional Anexo V é o regime adequado.',
  },
  {
    value: 'educacao',
    label: 'Educação / Treinamento / Aulas',
    anexo: 'III',
    mei_permitido: true,
  },
  {
    value: 'contabilidade',
    label: 'Contabilidade / Finanças',
    anexo: 'III',
    mei_permitido: false,
    mei_motivo: 'Contadores são regulamentados pelo CFC — profissão vedada ao MEI. Simples Nacional Anexo III é o regime correto.',
  },
  {
    value: 'reparacao',
    label: 'Reparação / Manutenção',
    anexo: 'III',
    mei_permitido: true,
  },
  {
    value: 'transporte',
    label: 'Transporte',
    anexo: 'III',
    mei_permitido: true,
  },
  {
    value: 'outro',
    label: 'Outro tipo de serviço',
    anexo: 'III',
    mei_permitido: true,
  },
]

// Simples Nacional – Anexo III (LC 123/2006)
const ANEXO_III = [
  { limit: 180_000, rate: 6.00, deducao: 0 },
  { limit: 360_000, rate: 11.20, deducao: 9_360 },
  { limit: 720_000, rate: 13.20, deducao: 17_640 },
  { limit: 1_800_000, rate: 16.00, deducao: 35_640 },
  { limit: 3_600_000, rate: 21.00, deducao: 125_640 },
  { limit: 4_800_000, rate: 33.00, deducao: 648_000 },
]

// Simples Nacional – Anexo V (LC 123/2006)
const ANEXO_V = [
  { limit: 180_000, rate: 15.50, deducao: 0 },
  { limit: 360_000, rate: 18.00, deducao: 4_500 },
  { limit: 720_000, rate: 19.50, deducao: 9_900 },
  { limit: 1_800_000, rate: 20.50, deducao: 17_100 },
  { limit: 3_600_000, rate: 23.00, deducao: 62_100 },
  { limit: 4_800_000, rate: 30.50, deducao: 540_000 },
]

type AnexoBand = { limit: number; rate: number; deducao: number }

function calcEfetiva(rbt12: number, tabela: AnexoBand[]): number {
  const band = tabela.find((b) => rbt12 <= b.limit) ?? tabela[tabela.length - 1]
  if (band.deducao === 0) return band.rate
  return Math.max(0, ((rbt12 * (band.rate / 100)) - band.deducao) / rbt12 * 100)
}

function getBaseAnexo(serviceCategory: string | null): 'III' | 'V' {
  const cat = SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)
  return cat?.anexo ?? 'III'
}

function round2(n: number) { return Math.round(n * 100) / 100 }

// Exported for use in withdrawal-engine (Fator R advisory)
export function calcEfetivaAnexo(rbt12: number, anexo: 'III' | 'V'): number {
  return round2(calcEfetiva(rbt12, anexo === 'III' ? ANEXO_III : ANEXO_V))
}

export function calcTaxRecommendation(
  faturamentoMensal: number,
  numFuncionarios: number,
  serviceCategory: string | null = null,
  folhaMensal: number = 0
): TaxRecommendation {
  const rbt12 = faturamentoMensal * 12
  const cat = SERVICE_CATEGORIES.find((c) => c.value === serviceCategory)
  const meiPermitido = cat ? cat.mei_permitido !== false : true

  // MEI — only when profession allows it
  if (rbt12 <= 81_000 && numFuncionarios <= 1 && meiPermitido) {
    const das = MEI_DAS_MENSAL
    const effectiveRate = faturamentoMensal > 0 ? round2((das / faturamentoMensal) * 100) : 5
    return {
      regime: 'mei',
      label: 'MEI',
      rate: effectiveRate,
      monthly_tax: das,
      das_fixo_mensal: das,
      is_fixed_das: true,
      anexo: null,
      fator_r: null,
      motivo:
        'Seu faturamento e tamanho de equipe se encaixam perfeitamente no MEI. Você paga um DAS fixo mensal — não importa quanto faturar no mês, o imposto não muda.',
      riscos: [
        'Limite de R$ 81.000 por ano — se ultrapassar, precisa migrar para o Simples Nacional',
        'Não pode ter sócios nem mais de um empregado',
        'Algumas profissões regulamentadas não são permitidas no MEI',
      ],
      complexidade: 'Baixa',
      faixa_tributacao: `DAS fixo de R$ ${das.toFixed(2).replace('.', ',')}/mês (independe do valor faturado)`,
    }
  }

  // Simples Nacional
  if (rbt12 <= 4_800_000) {
    const baseAnexo = getBaseAnexo(serviceCategory)
    const fatorR = faturamentoMensal > 0 ? folhaMensal / faturamentoMensal : 0
    const usaFatorR = baseAnexo === 'V' && fatorR >= 0.28
    const anexoFinal = usaFatorR ? 'III' : baseAnexo
    const tabela = anexoFinal === 'III' ? ANEXO_III : ANEXO_V
    const efetiva = round2(calcEfetiva(rbt12, tabela))
    const monthlyTax = faturamentoMensal * (efetiva / 100)
    const anecoIIIEfetiva = round2(calcEfetiva(rbt12, ANEXO_III))

    // Was MEI blocked due to profession?
    const meiBloqueadoPorProfissao = rbt12 <= 81_000 && numFuncionarios <= 1 && !meiPermitido && cat?.mei_motivo

    const motivo = usaFatorR
      ? `Fator R ativo: sua folha (${Math.round(fatorR * 100)}% do faturamento) é ≥ 28%, então você usa o Anexo III em vez do V — economizando impostos.`
      : baseAnexo === 'V'
      ? `Seu tipo de serviço se enquadra no Anexo V. Se sua folha de pagamento chegar a 28% do faturamento, você migra automaticamente para o Anexo III (${anecoIIIEfetiva}% efetivo).`
      : `Seu tipo de serviço se enquadra no Anexo III, que tem as menores alíquotas do Simples Nacional para serviços.`

    const riscos = [
      ...(meiBloqueadoPorProfissao ? [cat!.mei_motivo!] : []),
      `Enquadramento: Simples Nacional Anexo ${anexoFinal} — alíquota efetiva de ${efetiva}% calculada sobre o faturamento anual`,
      'A alíquota efetiva sobe conforme o faturamento dos últimos 12 meses cresce',
      'Limite de R$ 4,8 milhões por ano — acima disso vai para o Lucro Presumido',
      ...(baseAnexo === 'V' && !usaFatorR
        ? [`Se sua folha atingir 28% do faturamento, sua alíquota cai de ${efetiva}% para ${anecoIIIEfetiva}% (Anexo III)`]
        : []),
    ]

    return {
      regime: 'simples',
      label: 'Simples Nacional',
      rate: efetiva,
      monthly_tax: monthlyTax,
      das_fixo_mensal: null,
      is_fixed_das: false,
      anexo: anexoFinal,
      fator_r: round2(fatorR),
      motivo,
      riscos,
      complexidade: 'Média',
      faixa_tributacao: `Simples Nacional Anexo ${anexoFinal} — ${efetiva}% efetivo do faturamento`,
    }
  }

  // Lucro Presumido
  const rate = 15
  return {
    regime: 'presumido',
    label: 'Lucro Presumido',
    rate,
    monthly_tax: faturamentoMensal * (rate / 100),
    das_fixo_mensal: null,
    is_fixed_das: false,
    anexo: null,
    fator_r: null,
    motivo:
      'Com faturamento acima do limite do Simples Nacional, o Lucro Presumido é a alternativa mais comum. O imposto é calculado sobre uma margem de lucro presumida pela Receita Federal.',
    riscos: [
      'Maior complexidade contábil — contador é indispensável',
      'Carga tributária pode ser alta dependendo do tipo de serviço',
      'Exige escrituração contábil completa e entregas periódicas à Receita',
    ],
    complexidade: 'Alta',
    faixa_tributacao: '~15% do faturamento (estimativa para serviços)',
  }
}
