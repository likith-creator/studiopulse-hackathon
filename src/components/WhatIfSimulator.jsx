import { useMemo, useState } from 'react'
import { AlertTriangle } from 'lucide-react'
import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'
import { runWhatIfSimulation } from '../utils/whatIfSimulator.js'

const MAX_DELAY = 45
const BAD_DAY_CLIENTS = 5
const BAD_DAY_DELAY = 20
const KEY_CLIENT_DELAY = 15
const HORIZON_DAYS = 60

const W = 640
const H = 240
const PAD_L = 40
const PAD_R = 16
const PAD_T = 16
const PAD_B = 24

const STATUS_CLASSES = {
  Overdue: 'bg-rose-100 text-rose-700',
  Pending: 'bg-amber-100 text-amber-700',
}

export default function WhatIfSimulator({ onChase, onShowToast }) {
  const { state } = useStore()
  const [delays, setDelays] = useState({})

  const unpaid = useMemo(() => state.invoices.filter((inv) => inv.status !== 'Paid'), [state.invoices])

  const result = useMemo(
    () =>
      runWhatIfSimulation({
        cashOnHand: state.cashOnHand,
        invoices: state.invoices,
        upcomingBills: state.upcomingBills,
        delayMap: delays,
        horizonDays: HORIZON_DAYS,
      }),
    [state, delays]
  )

  const effectiveDelay = (id) => delays[id] || 0

  // Builds a delay map for every unpaid invoice from a per-invoice rule.
  const applyPreset = (delayFor) => {
    const next = {}
    unpaid.forEach((inv, index) => {
      next[inv.id] = delayFor(inv, index)
    })
    setDelays(next)
  }

  const presetReset = () => applyPreset(() => 0)

  const presetKeyClient = () => {
    let largest = null
    for (const inv of unpaid) {
      if (!largest || Number(inv.amount) > Number(largest.amount)) largest = inv
    }
    applyPreset((inv) => (largest && inv.id === largest.id ? KEY_CLIENT_DELAY : 0))
  }

  const presetBadDay = () =>
    applyPreset((_inv, index) => (index < BAD_DAY_CLIENTS ? BAD_DAY_DELAY : 0))

  const { points, simulatedLowest, hasCrunch, firstCrunchDate, shortfallAmount, recoveryMoves } = result
  const count = points.length

  // Scale spans both lines (baseline and simulated) so the chart stays stable as sliders move.
  const balances = points.flatMap((p) => [p.baselineBalance, p.simulatedBalance])
  const rawMin = Math.min(0, ...balances)
  const rawMax = Math.max(0, ...balances)
  const yMin = rawMin
  const yMax = rawMax === rawMin ? rawMin + 1 : rawMax

  const xFor = (i) => (count <= 1 ? PAD_L : PAD_L + (i * (W - PAD_L - PAD_R)) / (count - 1))
  const yFor = (b) => PAD_T + ((yMax - b) / (yMax - yMin)) * (H - PAD_T - PAD_B)
  const zeroY = yFor(0)

  const baselinePolyline = points.map((p, i) => `${xFor(i).toFixed(2)},${yFor(p.baselineBalance).toFixed(2)}`).join(' ')
  const simulatedPolyline = points.map((p, i) => `${xFor(i).toFixed(2)},${yFor(p.simulatedBalance).toFixed(2)}`).join(' ')

  const bannerClass = hasCrunch
    ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'
    : 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">What-If Cash Stress Simulator</h2>
          <p className="mt-1 text-sm text-slate-500">Test late client payments and generate an instant survival plan</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={presetReset}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Reset (On-Time)
          </button>
          <button
            type="button"
            onClick={presetKeyClient}
            className="rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-200"
          >
            Key Client +15 Days Late
          </button>
          <button
            type="button"
            onClick={presetBadDay}
            className="inline-flex items-center gap-1.5 rounded-full bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-700"
          >
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            Bad Day: 5 Clients +20 Days Late
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          {unpaid.length === 0 ? (
            <p className="text-sm text-slate-500">No unpaid invoices to simulate.</p>
          ) : (
            <div className="space-y-3">
              {unpaid.map((inv) => {
                const days = effectiveDelay(inv.id)
                return (
                  <div key={inv.id} className="rounded-xl border bg-white p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{inv.client}</p>
                        <p className="text-sm text-slate-500">{inv.company}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-slate-900">{formatINR(Number(inv.amount) || 0)}</p>
                        <span
                          className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            STATUS_CLASSES[inv.status] || 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-3">
                      <input
                        type="range"
                        min={0}
                        max={MAX_DELAY}
                        step={1}
                        value={days}
                        onChange={(e) => {
                          const value = Number(e.target.value)
                          setDelays((prev) => ({ ...prev, [inv.id]: value }))
                        }}
                        className="w-full accent-indigo-600"
                        aria-label={`Payment delay for ${inv.client}`}
                      />
                      <span className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-0.5 text-sm font-medium text-indigo-700">
                        +{days}d
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className={bannerClass}>
            {hasCrunch ? (
              <p>
                <span className="font-semibold">Cash Crunch Warning:</span> Balance drops to{' '}
                {formatINR(simulatedLowest.balance)} on {firstCrunchDate} (Shortfall: {formatINR(shortfallAmount)})
              </p>
            ) : (
              <p>
                <span className="font-semibold">Solvent Across {HORIZON_DAYS} Days</span> (Lowest:{' '}
                {formatINR(simulatedLowest.balance)})
              </p>
            )}
          </div>

          <div className="mt-4 rounded-xl border bg-white p-4">
            <div className="mb-2 flex flex-wrap items-center gap-4 text-sm text-slate-700">
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-slate-400" />
                Baseline (Due Dates)
              </span>
              <span className="inline-flex items-center gap-2">
                <span className="inline-block h-0.5 w-6 bg-indigo-600" />
                Simulated
              </span>
            </div>
            {count > 0 ? (
              <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Baseline vs simulated cash balance">
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={zeroY}
                  y2={zeroY}
                  stroke="#94a3b8"
                  strokeWidth="1"
                  strokeDasharray="6 4"
                />
                <text x={4} y={zeroY + 4} textAnchor="start" fontSize="12" fill="#64748b">
                  ₹0
                </text>

                <polyline points={baselinePolyline} fill="none" stroke="#94a3b8" strokeWidth="2" strokeLinejoin="round" />
                <polyline points={simulatedPolyline} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" />

                {points.map((p, i) =>
                  p.simulatedBalance < 0 ? (
                    <circle key={`neg-${i}`} cx={xFor(i)} cy={yFor(p.simulatedBalance)} r="4" fill="#e11d48" />
                  ) : null
                )}

                <text x={PAD_L} y={H - 6} textAnchor="start" fontSize="12" fill="#64748b">
                  {points[0].date}
                </text>
                {count > 1 && (
                  <text x={W - PAD_R} y={H - 6} textAnchor="end" fontSize="12" fill="#64748b">
                    {points[count - 1].date}
                  </text>
                )}
              </svg>
            ) : (
              <p className="text-sm text-slate-500">No simulation data available.</p>
            )}
          </div>

          {hasCrunch && (
            <div className="mt-4 rounded-xl border bg-white p-4 shadow-sm">
              <h3 className="text-base font-semibold text-slate-900">
                Auto-Survival Solver — Recommended Moves to Stay Above ₹0
              </h3>
              {recoveryMoves.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No recovery moves available.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {recoveryMoves.map((move, i) => {
                    const gain = move.type === 'defer' ? move.cashRelief : move.cashGain
                    const key = `${move.type}-${move.invoiceId ?? move.billName ?? i}-${i}`
                    return (
                      <div key={key} className="rounded-lg border bg-slate-50 p-4">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="font-semibold text-slate-900">{move.title}</p>
                            <p className="mt-1 text-sm text-slate-700">{move.detail}</p>
                          </div>
                          <p className="font-semibold text-emerald-600">+{formatINR(gain)}</p>
                        </div>
                        <div className="mt-3">
                          {move.type === 'chase' && (
                            <button
                              type="button"
                              onClick={() => onChase(move.targetInvoice)}
                              className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
                            >
                              Chase {move.client} Now
                            </button>
                          )}
                          {move.type === 'discount' && (
                            <button
                              type="button"
                              onClick={() => {
                                setDelays((prev) => ({ ...prev, [move.invoiceId]: 0 }))
                                onShowToast(`Simulated: ${move.client} fast-pay discount applied`)
                              }}
                              className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                              Simulate Move
                            </button>
                          )}
                          {move.type === 'defer' && (
                            <button
                              type="button"
                              onClick={() => onShowToast(`Simulated: ${move.billName} deferred 14 days (not saved)`)}
                              className="rounded-full bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
                            >
                              Simulate Move
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
