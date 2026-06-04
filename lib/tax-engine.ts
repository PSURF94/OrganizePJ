export type TaxRecommendation = {
  regime: 'mei' | 'simples' | 'presumido'
  label: string
  rate: number
  monthly_tax: number
  motivo: string
  riscos: string[]
  complexidade: 'Baixa' | 'Média' | 'Alta'
  faixa_tributacao: string
}

const SIMPLES_BANDS = [
  { limit: 180_000, rate: 6.0 },
  { limit: 360_000, rate: 11.2 },
  { limit: 720_000, rate: 13.5 },
  { limit: 1_800_000, rate: 16.0 },
  { limit: 3_600_000, rate: 21.0 },
  { limit: 4_800_000, rate: 33.0 },
]

function getSimplesRate(faturamentoAnual: number): number {
  for (const band of SIMPLES_BANDS) {
    if (faturamentoAnual <= band.limit) return band.rate
  }
  return 33.0
}

export function calcTaxRecommendation(
  faturamentoMensal: number,
  numFuncionarios: number
): TaxRecommendation {
  const faturamentoAnual = faturamentoMensal * 12

  if (faturamentoAnual <= 81_000 && numFuncionarios <= 1) {
    return {
      regime: 'mei',
      label: 'MEI',
      rate: 5,
      monthly_tax: faturamentoMensal * 0.05,
      motivo:
        'Seu faturamento e tamanho de equipe se encaixam perfeitamente no MEI. É a opção mais simples e barata disponível para quem está começando ou tem faturamento menor.',
      riscos: [
        'Limite de R$81.000 por ano — se ultrapassar, precisa migrar para o Simples Nacional',
        'Não pode ter sócios',
        'Algumas profissões regulamentadas não são permitidas no MEI',
      ],
      complexidade: 'Baixa',
      faixa_tributacao: '~5% do faturamento (DAS fixo mensal)',
    }
  }

  if (faturamentoAnual <= 4_800_000) {
    const rate = getSimplesRate(faturamentoAnual)
    return {
      regime: 'simples',
      label: 'Simples Nacional',
      rate,
      monthly_tax: faturamentoMensal * (rate / 100),
      motivo:
        'O Simples Nacional unifica vários impostos em uma única guia mensal (DAS). É o regime mais comum para prestadores de serviço em crescimento e simplifica muito a gestão fiscal.',
      riscos: [
        'A alíquota aumenta conforme o faturamento cresce ao longo dos anos',
        'Limite de R$4,8 milhões por ano — acima disso migra para Lucro Presumido',
        'Exige CNPJ ativo (MEI também funciona, mas com mais limitações)',
      ],
      complexidade: 'Média',
      faixa_tributacao: `${rate}% do faturamento`,
    }
  }

  const rate = 15
  return {
    regime: 'presumido',
    label: 'Lucro Presumido',
    rate,
    monthly_tax: faturamentoMensal * (rate / 100),
    motivo:
      'Com faturamento acima do limite do Simples Nacional, o Lucro Presumido é a alternativa mais comum para prestadores de serviço. O imposto é calculado sobre uma margem presumida de lucro.',
    riscos: [
      'Maior complexidade contábil — a presença de um contador é essencial',
      'A carga tributária pode ser mais alta para alguns perfis de serviço',
      'Exige escrituração contábil completa e entregas periódicas de obrigações acessórias',
    ],
    complexidade: 'Alta',
    faixa_tributacao: '~15% do faturamento (estimativa para serviços)',
  }
}
