import type { TaxRegime } from './constants'
import { calcEfetivaAnexo } from './tax-engine'

const SALARIO_MINIMO = 1621.00
const INSS_TETO = 8475.55
const INSS_RATE = 0.11 // contribuinte individual — plano simplificado

// Categorias Anexo V para cálculo do Fator R advisory
const ANEXO_V_CATS = ['tech', 'consultoria', 'design', 'saude', 'arquitetura', 'direito']

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
  fator_r_tip: string | null
}

function r2(n: number) { return Math.round(n * 100) / 100 }

export function calcINSS(prolabore: number): number {
  if (prolabore <= 0) return 0
  return r2(Math.min(prolabore, INSS_TETO) * INSS_RATE)
}

// Tabela progressiva IRPF 2026 (Lei 15.270/2025) — base de cálculo mensal
// Desconto complementar: isenção efetiva até R$5.000; redução decrescente até R$7.350
export function calcIR2026(baseCalculo: number): number {
  if (baseCalculo <= 0) return 0

  let ir = 0
  if (baseCalculo <= 2428.80) {
    ir = 0
  } else if (baseCalculo <= 2826.65) {
    ir = baseCalculo * 0.075 - 182.16
  } else if (baseCalculo <= 3751.05) {
    ir = baseCalculo * 0.15 - 394.16
  } else if (baseCalculo <= 4664.68) {
    ir = baseCalculo * 0.225 - 675.49
  } else {
    ir = baseCalculo * 0.275 - 908.73
  }

  // Desconto complementar Lei 15.270/2025
  if (baseCalculo <= 5000) {
    ir = 0
  } else if (baseCalculo <= 7350) {
    const desconto = Math.max(0, 978.62 - 0.133145 * baseCalculo)
    ir = Math.max(0, ir - desconto)
  }

  return r2(ir)
}

// Alias for backward compatibility
export const calcIR = calcIR2026

export function calcWithdrawalRecommendation(
  regime: TaxRegime,
  monthlyTarget: number,
  currentProlabore: number | null,
  serviceCategory?: string | null,
  faturamentoMensal?: number,
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
      fator_r_tip: null,
    }
  }

  // Simples Nacional / Lucro Presumido / Lucro Real
  // Pró-labore ideal = salário mínimo: mínimo INSS, IR zero (abaixo de R$5.000 após INSS)
  const optProlabore = SALARIO_MINIMO
  const optDistrib = Math.max(0, monthlyTarget - optProlabore)
  const optINSS = calcINSS(optProlabore)
  const optIRBase = Math.max(0, optProlabore - optINSS)
  const optIR = calcIR2026(optIRBase)
  const optTotal = r2(optINSS + optIR)
  const effRate = monthlyTarget > 0 ? r2(optTotal / monthlyTarget * 100) : 0

  let currentTaxCost: number | null = null
  let annualWaste: number | null = null
  if (currentProlabore !== null && currentProlabore > 0) {
    const curINSS = calcINSS(currentProlabore)
    const curIRBase = Math.max(0, currentProlabore - curINSS)
    const curIR = calcIR2026(curIRBase)
    currentTaxCost = r2(curINSS + curIR)
    if (currentTaxCost > optTotal) annualWaste = r2((currentTaxCost - optTotal) * 12)
  }

  const alert = currentProlabore !== null && currentProlabore > 0 && currentProlabore < SALARIO_MINIMO
    ? `Pró-labore abaixo do salário mínimo (R$ ${SALARIO_MINIMO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}). Isso pode gerar pendências no INSS.`
    : null

  // C2: Fator R advisory — Anexo V com 28% de pró-labore migra para Anexo III
  let fator_r_tip: string | null = null
  if (
    regime === 'simples' &&
    serviceCategory &&
    ANEXO_V_CATS.includes(serviceCategory) &&
    faturamentoMensal && faturamentoMensal > 0
  ) {
    const prolaboreFatorR = r2(faturamentoMensal * 0.28)
    if (prolaboreFatorR > SALARIO_MINIMO) {
      const rbt12 = faturamentoMensal * 12
      const taxaV = calcEfetivaAnexo(rbt12, 'V')
      const taxaIII = calcEfetivaAnexo(rbt12, 'III')
      const economiaDAS = r2((taxaV - taxaIII) / 100 * faturamentoMensal)

      const inssComFatorR = calcINSS(prolaboreFatorR)
      const irBaseComFatorR = Math.max(0, prolaboreFatorR - inssComFatorR)
      const irComFatorR = calcIR2026(irBaseComFatorR)
      const custoFatorR = r2(inssComFatorR + irComFatorR)
      const extraCusto = r2(custoFatorR - optTotal)
      const ganhoLiquido = r2(economiaDAS - extraCusto)

      const fmtBRL = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2 })

      if (ganhoLiquido > 10) {
        fator_r_tip = `Oportunidade Fator R: pagando pró-labore de R$ ${fmtBRL(prolaboreFatorR)}/mês (28% do faturamento), você migra do Anexo V (${taxaV}%) para o Anexo III (${taxaIII}%) — economia de R$ ${fmtBRL(economiaDAS)}/mês no DAS, com custo extra de R$ ${fmtBRL(extraCusto)}/mês em INSS. Ganho líquido estimado: R$ ${fmtBRL(ganhoLiquido)}/mês.`
      } else {
        fator_r_tip = `Fator R analisado: para o seu faturamento atual, a economia no DAS (R$ ${fmtBRL(economiaDAS)}/mês) não supera o custo extra de INSS (R$ ${fmtBRL(extraCusto)}/mês). Mantenha o pró-labore no salário mínimo.`
      }
    }
  }

  const reason = regime === 'simples'
    ? `Pró-labore de R$ ${SALARIO_MINIMO.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês garante sua cobertura INSS. O restante (R$ ${optDistrib.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}) sai como distribuição de lucros — isenta de IR e INSS.`
    : `Com a Lei 15.270/2025, rendimentos até R$ 5.000/mês são isentos de IR. Pró-labore no salário mínimo minimiza o INSS; o restante sai como distribuição de lucros (isenta de IR e INSS).`

  const tip = regime === 'simples'
    ? 'No Simples Nacional, a distribuição de lucros é isenta de IR quando proporcional ao faturamento. Um dos maiores benefícios do regime.'
    : 'No Lucro Presumido, mantenha o pró-labore no mínimo e distribua o excedente como lucros — isentos de IR na fonte e de INSS.'

  return {
    regime, monthly_target: monthlyTarget,
    optimal_prolabore: optProlabore, optimal_distribution: optDistrib,
    inss_cost: optINSS, ir_cost: optIR, total_tax_cost: optTotal,
    effective_rate: effRate,
    current_prolabore: currentProlabore, current_tax_cost: currentTaxCost,
    annual_waste: annualWaste,
    reason, tip, alert, fator_r_tip,
  }
}
