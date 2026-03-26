import { describe, expect, it } from 'vitest'
import {
  buildEstimate,
  formatWeight,
  isValidInput,
} from './estimate'
import { calcEffectiveReps, rpeToRir } from './rpe'

describe('rpe mapping', () => {
  it('maps half-step RPE values to RIR', () => {
    expect(rpeToRir(10)).toBe(0)
    expect(rpeToRir(9)).toBe(1)
    expect(rpeToRir(8.5)).toBe(1.5)
    expect(rpeToRir(6)).toBe(4)
  })

  it('calculates effective reps from reps and RPE', () => {
    expect(calcEffectiveReps(5, 9)).toBe(6)
    expect(calcEffectiveReps(10, 8)).toBe(12)
    expect(calcEffectiveReps(15, 7)).toBe(18)
  })
})

describe('estimate engine', () => {
  it('returns a recommended estimate for a heavy set', () => {
    const result = buildEstimate({
      weight: 100,
      reps: 5,
      rpe: 9,
      unit: 'kg',
    })
    expect(result).not.toBeNull()
    expect(result?.recommended.e1rm).toBe(120)
    expect(result?.recommended.targetRms[1]).toEqual({
      label: '3RM',
      reps: 3,
      weight: 109.1,
    })
    expect(result?.recommended.confidence).toBe('高')
  })

  it('marks medium-range sets as lower confidence', () => {
    const result = buildEstimate({
      weight: 80,
      reps: 10,
      rpe: 8,
      unit: 'kg',
    })

    expect(result?.effectiveReps).toBe(12)
    expect(result?.recommended.confidence).toBe('中')
  })

  it('emits warnings for high effective reps', () => {
    const result = buildEstimate({
      weight: 60,
      reps: 15,
      rpe: 7,
      unit: 'kg',
    })

    expect(result?.recommended.confidence).toBe('低')
    expect(result?.warnings[0]).toContain('置信度较低')
  })

  it('rejects invalid input', () => {
    expect(
      isValidInput({
        weight: 100,
        reps: 0,
        rpe: 9,
        unit: 'kg',
      }),
    ).toBe(false)

    expect(
      buildEstimate({
        weight: -1,
        reps: 5,
        rpe: 9,
        unit: 'lb',
      }),
    ).toBeNull()
  })

  it('keeps display formatting stable across units', () => {
    expect(formatWeight(225, 'lb')).toBe('225.0 lb')
    expect(formatWeight(100, 'kg')).toBe('100.0 kg')
  })
})
