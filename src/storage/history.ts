import type { EstimateInput } from '../domain/estimate'
import type { Confidence } from '../domain/rpe'

const STORAGE_KEY = 'one-rm-history'

export type SavedEntry = {
  id: string
  createdAt: string
  input: EstimateInput
  recommended: number
  confidence: Confidence
}

export function loadHistory(): SavedEntry[] {
  const raw = window.localStorage.getItem(STORAGE_KEY)
  if (!raw) {
    return []
  }

  try {
    const parsed = JSON.parse(raw) as SavedEntry[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function saveHistory(entries: SavedEntry[]) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries))
}
