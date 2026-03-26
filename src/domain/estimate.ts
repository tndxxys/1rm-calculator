import {
  type FormulaKey,
  type FormulaResult,
  deriveTargetRmWeights,
  estimateAllFormulas,
} from './formulas'
import {
  type Confidence,
  calcEffectiveReps,
  getConfidence,
  isSupportedRpe,
  rpeToRir,
} from './rpe'

export type Unit = 'kg' | 'lb'

export type EstimateInput = {
  weight: number
  reps: number
  rpe: number
  unit: Unit
}

export type EstimateOutput = {
  input: EstimateInput
  rir: number
  effectiveReps: number
  formulas: FormulaResult[]
  recommended: {
    e1rm: number
    confidence: Confidence
    formulaKey: FormulaKey
    targetRms: { label: string; reps: number; weight: number }[]
    reason: string
  }
  warnings: string[]
}

export const defaultInput: EstimateInput = {
  weight: 0,
  reps: 0,
  rpe: 10,
  unit: 'kg',
}

const round = (value: number) => Math.round(value * 10) / 10

function pickMedian(values: number[]) {
  const sorted = [...values].sort((left, right) => left - right)
  return sorted[Math.floor(sorted.length / 2)]
}

function getFormulaSet(effectiveReps: number): { keys: FormulaKey[]; reason: string } {
  if (effectiveReps <= 10) {
    return {
      keys: ['Brzycki', 'Epley', 'Wathen'],
      reason: '低有效次数时，使用 Brzycki、Epley 和 Wathen 三者的中位数。',
    }
  }

  return {
    keys: ['Wathen', 'Mayhew', 'Epley'],
    reason: '中高有效次数时，使用 Wathen、Mayhew 和 Epley 三者的中位数。',
  }
}

function buildWarnings(effectiveReps: number, rpe: number) {
  const warnings: string[] = []

  if (effectiveReps > 12) {
    warnings.push(
      '置信度较低：有效次数超过 12，不同公式之间的差异可能较大。',
    )
  }

  if (rpe < 7) {
    warnings.push('置信度较低：远离力竭的组数对 e1RM 估算不太可靠。')
  }

  return warnings
}

function buildRecommendedEstimate(
  formulas: FormulaResult[],
  effectiveReps: number,
  rpe: number,
) {
  const formulaSet = getFormulaSet(effectiveReps)
  const selected = formulas.filter((result) => formulaSet.keys.includes(result.formula))
  const recommendedValue = round(pickMedian(selected.map((result) => result.e1rm)))
  const anchorFormula = selected.reduce((closest, current) => {
    const closestDistance = Math.abs(closest.e1rm - recommendedValue)
    const currentDistance = Math.abs(current.e1rm - recommendedValue)
    return currentDistance < closestDistance ? current : closest
  })

  return {
    e1rm: recommendedValue,
    confidence: getConfidence(effectiveReps, rpe),
    formulaKey: anchorFormula.formula,
    targetRms: deriveTargetRmWeights(recommendedValue, anchorFormula.formula),
    reason: formulaSet.reason,
  }
}

export function isValidInput(input: EstimateInput) {
  const wholeRep = Number.isInteger(input.reps)
  return (
    input.weight > 0 &&
    input.reps >= 1 &&
    input.reps <= 20 &&
    wholeRep &&
    input.rpe >= 6 &&
    input.rpe <= 10 &&
    isSupportedRpe(input.rpe)
  )
}

export function buildEstimate(input: EstimateInput): EstimateOutput | null {
  if (!isValidInput(input)) {
    return null
  }

  const rir = rpeToRir(input.rpe)
  const effectiveReps = calcEffectiveReps(input.reps, input.rpe)
  const formulas = estimateAllFormulas(input.weight, effectiveReps)

  return {
    input,
    rir,
    effectiveReps: round(effectiveReps),
    formulas,
    recommended: buildRecommendedEstimate(formulas, effectiveReps, input.rpe),
    warnings: buildWarnings(effectiveReps, input.rpe),
  }
}

export function formatWeight(value: number, unit: Unit) {
  return `${value.toFixed(1)} ${unit}`
}
