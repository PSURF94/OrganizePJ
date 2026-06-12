import type { TaxRegime } from './constants'

const SALARIO_MINIMO = 1621.00
const INSS_TETO = 8475.55
const INSS_RATE = 0.11 // contribuinte individual — plano simplificado

// Tabela IRPF 2024
const IR_BRACKETS = [
  { limit: 2259.20,  rate: 0,     deduction: 0 },
  { limit: 2826.65,  rate: 0.075, deduction: 169.44 },
  { limit: 3751.05,  rate: 0.15,  deduction: 381.44 },
  { limit: 4664.68,  rate: 0.225, deduction: 662.77 },
  { limit: Infinity, rate: 0.275, deduction: 896.00 },
]

export type WithdrawalRecommendation = {
  regime: TaxRegime
  monthly_target: number
  optimal_prolabore: number
  optimal_distribution: number
  inss_cost: number
  ir_cost: number
  total_tax_cost: number
  effective_rate: number
  current_prolabore: number | null
  current_tax_cost: number | null
  annual_waste: number | null
  reason: string
  tip: string
  alert: string | null
}

function r2(n: number) { return Math.round(n * 100) / 100 }

export function calcINSS(prolabore: number): number {
  if (prolabore <= 0) return 0
  return r2(Math.min(prolabore, INSS_TETO) * INSS_RATE)
}

export function calcIR(prolabore: number): number {
  for (const b of IR_BRACKETS) {
    if (prolabore <= b.limit) return r2(Math.max(0, prolabore * b.rate - b.deduction))
  }
  return 0
}

export function calcWithdrawalRecommendation(
  regime: TaxRegime,
  monthlyTarget: number,
  currentProlabore: number | null,
): WithdrawalRecommendation {

  if (regime === 'mei') {
    return {
      regime, monthly_target: monthlyTarget,
      optimal_prolabore: 0, optimal_distribution: monthlyTarget,
      inss_cost: 0, ir_cost: 0, total_tax_cost: 0, effective_rate: 0,
      current_prolabore: currentProlabore, current_tax_cost: null, annual_waste: null,
      reason: 'MEI: seu INSS já está coberto pelo DAS fixo. Retire livremente — não há INSS adicional nas retiradas.',
      tip: 'O DAS mensal do MEI já inclui a contribuição previdenciária mínima. Retiradas não geram custo adicional.',
      alert: null,
    }
  }

  // Simples Nacional / Lucro Presumido / Lucro Real
  const optProlabore = SALARIO_MINIMO
  const optDistrib = Math.max(0, monthlyTarget - optProlabore)
  const optINSS = calcINSS(optProlabore)
  const hasIR = regime === 'presumido' || regime === 'real'
  const optIR = hasIR ? calcIR(optProlabore) : 0
  const optTotal = r2(optINSS + optIR)
  const effRate = monthlyTarget > 0 ? r2(optTotal / monthlyTarget * 100) : 0

  let currentTaxCost: number | null = null
  let annualWaste: number | null = null
  if (currentProlabore !== null && currentProlabore > 0) {
    const curINSS = calcINSS(currentProlabore)
    const curIR = hasIR ? calcIR(currentProlabore) : 0
    currentTaxCost = r2(curINSS + curIR)
    if (currentTaxCost > optTotal) annualWaste = r2((currentTaxCost - optTotal) * 12)
  }

  const alert = currentProlabore !== null && currentProlabore > 0 && currentProlabore < SALARIO_MINIMO
    ? `Pró-labore abaixo do salário mínimo (R$ ${SALARIO_MINIMO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Isso pode gerar pendências no INSS.`
    : null

  const reason = regime === 'simples'
    ? `Pró-labore de R$ ${SALARIO_MINIMO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês garante sua cobertura INSS. O restante (R$ ${optDistrib.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) sai como distribuição de lucros — isenta de IR e INSS.`
    : `Pró-labore até R$ 2.259/mês fica isento de IR. Distribua o restante como lucros — isentos de INSS e IR.`

  const tip = regime === 'simples'
    ? 'No Simples Nacional, a distribuição de lucros é isenta de IR quando proporcional ao faturamento. Um dos maiores benefícios do regime que a maioria não aproveita.'
    : 'No Lucro Presumido, manter o pró-labore abaixo da faixa de isenção do IR evita desconto na fonte. Distribua o excedente como lucros.'

  return {
    regime, monthly_target: monthlyTarget,
    optimal_prolabore: optProlabore, optimal_distribution: optDistrib,
    inss_cost: optINSS, ir_cost: optIR, total_tax_cost: optTotal,
    effective_rate: effRate,
    current_prolabore: currentProlabore, current_tax_cost: currentTaxCost,
    annual_waste: annualWaste,
    reason, tip, alert,
  }
}
