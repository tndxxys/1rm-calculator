import { useEffect, useRef, useState } from 'react'
import './App.css'
import {
  type EstimateInput,
  type EstimateOutput,
  type Unit,
  buildEstimate,
  defaultInput,
  formatWeight,
} from './domain/estimate'
import { loadHistory, saveHistory, type SavedEntry } from './storage/history'

const HISTORY_LIMIT = 20

function App() {
  const [input, setInput] = useState<EstimateInput>(defaultInput)
  const [history, setHistory] = useState<SavedEntry[]>([])
  const [copied, setCopied] = useState(false)
  const lastSavedSignature = useRef('')

  useEffect(() => {
    setHistory(loadHistory())
  }, [])

  const result = buildEstimate(input)

  useEffect(() => {
    if (!result) {
      return
    }

    const signature = JSON.stringify(input)
    if (signature === lastSavedSignature.current) {
      return
    }

    lastSavedSignature.current = signature

    const entry: SavedEntry = {
      id: `${Date.now()}-${signature}`,
      createdAt: new Date().toISOString(),
      input,
      recommended: result.recommended.e1rm,
      confidence: result.recommended.confidence,
    }

    setHistory((current) => {
      const deduped = current.filter((item) => {
        return !(
          item.input.weight === entry.input.weight &&
          item.input.reps === entry.input.reps &&
          item.input.rpe === entry.input.rpe &&
          item.input.unit === entry.input.unit
        )
      })
      const next = [entry, ...deduped].slice(0, HISTORY_LIMIT)
      saveHistory(next)
      return next
    })
  }, [input, result])

  useEffect(() => {
    if (!copied) {
      return
    }

    const timeout = window.setTimeout(() => setCopied(false), 1800)
    return () => window.clearTimeout(timeout)
  }, [copied])

  const handleNumberChange = (
    key: 'weight' | 'reps' | 'rpe',
    value: string,
  ) => {
    const parsed = Number(value)
    setInput((current) => ({
      ...current,
      [key]: Number.isFinite(parsed) ? parsed : current[key],
    }))
  }

  const handleUnitChange = (unit: Unit) => {
    setInput((current) => ({
      ...current,
      unit,
    }))
  }

  const handleCopy = async (estimate: EstimateOutput) => {
    const lines = [
      `1RM 计算器`,
      `${estimate.input.weight}${estimate.input.unit} x ${estimate.input.reps} @ RPE ${estimate.input.rpe}`,
      `推荐 e1RM: ${formatWeight(estimate.recommended.e1rm, estimate.input.unit)}`,
      ...estimate.recommended.targetRms.map(
        ({ label, weight }) =>
          `${label}: ${formatWeight(weight, estimate.input.unit)}`,
      ),
    ]

    await navigator.clipboard.writeText(lines.join('\n'))
    setCopied(true)
  }

  return (
    <main className="app-shell">
      <section className="hero">
        <p className="eyebrow">离线力量训练工具</p>
        <h1>1RM 计算器</h1>
        <p className="hero-copy">
          根据完成的组数，使用次数、重量和 RPE 估算 e1RM 和目标训练重量。
        </p>
      </section>

      <div className="layout">
        <section className="panel input-panel">
          <div className="panel-heading">
            <h2>输入</h2>
            <p>使用接近力竭的组数可以获得更准确的估算结果。</p>
          </div>

          <div className="field-grid">
            <label className="field">
              <span>重量</span>
              <input
                aria-label="重量"
                min="0"
                step="0.5"
                type="number"
                value={input.weight}
                onChange={(event) => handleNumberChange('weight', event.target.value)}
              />
            </label>

            <label className="field">
              <span>次数</span>
              <input
                aria-label="次数"
                max="20"
                min="1"
                step="1"
                type="number"
                value={input.reps}
                onChange={(event) => handleNumberChange('reps', event.target.value)}
              />
            </label>

            <label className="field">
              <span>RPE</span>
              <input
                aria-label="RPE"
                max="10"
                min="6"
                step="0.5"
                type="number"
                value={input.rpe}
                onChange={(event) => handleNumberChange('rpe', event.target.value)}
              />
            </label>
          </div>

          <div className="unit-toggle" role="group" aria-label="单位">
            {(['kg', 'lb'] as Unit[]).map((unit) => (
              <button
                key={unit}
                className={input.unit === unit ? 'toggle active' : 'toggle'}
                type="button"
                onClick={() => handleUnitChange(unit)}
              >
                {unit.toUpperCase()}
              </button>
            ))}
          </div>

          {result ? (
            <div className="meta-list">
              <div>
                <span>有效次数</span>
                <strong>{result.effectiveReps.toFixed(1)}</strong>
              </div>
              <div>
                <span>RIR</span>
                <strong>{result.rir.toFixed(1)}</strong>
              </div>
              <div>
                <span>置信度</span>
                <strong>{result.recommended.confidence}</strong>
              </div>
            </div>
          ) : null}

          <div className="disclaimer">
            <h3>说明</h3>
            <p>估算值仅供参考，非比赛级最大重量。</p>
            <p>
              高次数组和低 RPE 组会导致不同公式之间的差异增大。
            </p>
          </div>
        </section>

        <section className="results-stack">
          {result ? (
            <>
              <section className="panel spotlight">
                <div className="panel-heading">
                  <div>
                    <h2>推荐 e1RM</h2>
                    <p>{result.recommended.reason}</p>
                  </div>
                  <button className="copy-button" type="button" onClick={() => handleCopy(result)}>
                    {copied ? '已复制' : '复制结果'}
                  </button>
                </div>

                <div className="spotlight-value">
                  {formatWeight(result.recommended.e1rm, result.input.unit)}
                </div>

                <div className="warning-list">
                  {result.warnings.map((warning) => (
                    <p key={warning} className="warning">
                      {warning}
                    </p>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>目标 RM</h2>
                  <p>根据推荐公式反向计算得出。</p>
                </div>
                <div className="rm-grid">
                  {result.recommended.targetRms.map((target) => (
                    <article key={target.label} className="rm-card">
                      <span>{target.label}</span>
                      <strong>{formatWeight(target.weight, result.input.unit)}</strong>
                    </article>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel-heading">
                  <h2>公式对比</h2>
                  <p>推荐值为中位数，并非单一公式结果。</p>
                </div>
                <div className="formula-table" role="table" aria-label="公式对比">
                  <div className="formula-row formula-head" role="row">
                    <span role="columnheader">公式</span>
                    <span role="columnheader">e1RM</span>
                    <span role="columnheader">1RM</span>
                    <span role="columnheader">5RM</span>
                    <span role="columnheader">10RM</span>
                  </div>
                  {result.formulas.map((formula) => (
                    <div
                      key={formula.formula}
                      className={
                        formula.formula === result.recommended.formulaKey
                          ? 'formula-row selected'
                          : 'formula-row'
                      }
                      role="row"
                    >
                      <span role="cell">{formula.formula}</span>
                      <span role="cell">{formatWeight(formula.e1rm, result.input.unit)}</span>
                      <span role="cell">
                        {formatWeight(formula.targetRms[0].weight, result.input.unit)}
                      </span>
                      <span role="cell">
                        {formatWeight(formula.targetRms[2].weight, result.input.unit)}
                      </span>
                      <span role="cell">
                        {formatWeight(formula.targetRms[4].weight, result.input.unit)}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </>
          ) : (
            <section className="panel empty-state">
              <h2>请输入有效数据</h2>
              <p>
                重量必须大于 0，次数必须在 1 到 20 之间，
                RPE 必须在 6 到 10 之间。
              </p>
            </section>
          )}

          <section className="panel">
            <div className="panel-heading">
              <h2>历史记录</h2>
              <p>存储在本设备，仅保留最近 20 条记录。</p>
            </div>
            {history.length > 0 ? (
              <div className="history-list">
                {history.map((entry) => (
                  <button
                    key={entry.id}
                    className="history-item"
                    type="button"
                    onClick={() => setInput(entry.input)}
                  >
                    <span>
                      {entry.input.weight}
                      {entry.input.unit} x {entry.input.reps} @ {entry.input.rpe}
                    </span>
                    <strong>
                      {formatWeight(entry.recommended, entry.input.unit)} ·{' '}
                      {entry.confidence}
                    </strong>
                  </button>
                ))}
              </div>
            ) : (
              <p className="history-empty">暂无历史记录。</p>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}

export default App
