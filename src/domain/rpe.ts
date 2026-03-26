const RPE_TO_RIR: Record<string, number> = {
  '10': 0,
  '9.5': 0.5,
  '9': 1,
  '8.5': 1.5,
  '8': 2,
  '7.5': 2.5,
  '7': 3,
  '6.5': 3.5,
  '6': 4,
}

export type Confidence = '高' | '中' | '低'

export function isSupportedRpe(rpe: number) {
  return `${rpe}` in RPE_TO_RIR
}

export function rpeToRir(rpe: number) {
  return RPE_TO_RIR[`${rpe}`]
}

export function calcEffectiveReps(reps: number, rpe: number) {
  return reps + rpeToRir(rpe)
}

export function getConfidence(effectiveReps: number, rpe: number): Confidence {
  if (effectiveReps > 12 || rpe < 7) {
    return '低'
  }

  if (effectiveReps > 10 || rpe < 8) {
    return '中'
  }

  return '高'
}
