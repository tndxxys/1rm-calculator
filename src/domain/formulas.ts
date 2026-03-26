export const TARGET_RM_REPS = [1, 3, 5, 8, 10, 12] as const

export type FormulaKey =
  | 'Epley'
  | 'Brzycki'
  | 'Lombardi'
  | "O'Conner"
  | 'Mayhew'
  | 'Wathen'

export type FormulaResult = {
  formula: FormulaKey
  e1rm: number
  targetRms: { label: string; reps: number; weight: number }[]
}

const round = (value: number) => Math.round(value * 10) / 10

export function estimateByFormula(weight: number, reps: number, formula: FormulaKey) {
  switch (formula) {
    case 'Epley':
      return weight * (1 + reps / 30)
    case 'Brzycki':
      return weight / (1.0278 - 0.0278 * reps)
    case 'Lombardi':
      return weight * reps ** 0.1
    case "O'Conner":
      return weight * (1 + 0.025 * reps)
    case 'Mayhew':
      return (100 * weight) / (52.2 + 41.9 * Math.exp(-0.055 * reps))
    case 'Wathen':
      return (100 * weight) / (48.8 + 53.8 * Math.exp(-0.075 * reps))
  }
}

export function deriveWeightFromE1rm(
  e1rm: number,
  reps: number,
  formula: FormulaKey,
) {
  switch (formula) {
    case 'Epley':
      return e1rm / (1 + reps / 30)
    case 'Brzycki':
      return e1rm * (1.0278 - 0.0278 * reps)
    case 'Lombardi':
      return e1rm / reps ** 0.1
    case "O'Conner":
      return e1rm / (1 + 0.025 * reps)
    case 'Mayhew':
      return (e1rm * (52.2 + 41.9 * Math.exp(-0.055 * reps))) / 100
    case 'Wathen':
      return (e1rm * (48.8 + 53.8 * Math.exp(-0.075 * reps))) / 100
  }
}

export function deriveTargetRmWeights(e1rm: number, formula: FormulaKey) {
  return TARGET_RM_REPS.map((reps) => ({
    label: `${reps}RM`,
    reps,
    weight: round(deriveWeightFromE1rm(e1rm, reps, formula)),
  }))
}

export function estimateAllFormulas(weight: number, reps: number): FormulaResult[] {
  const formulas: FormulaKey[] = [
    'Epley',
    'Brzycki',
    'Lombardi',
    "O'Conner",
    'Mayhew',
    'Wathen',
  ]

  return formulas.map((formula) => {
    const e1rm = round(estimateByFormula(weight, reps, formula))
    return {
      formula,
      e1rm,
      targetRms: deriveTargetRmWeights(e1rm, formula),
    }
  })
}
