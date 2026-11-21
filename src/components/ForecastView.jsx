import { useState, useMemo } from 'react'
import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'
import { buildForecastSeries } from '../utils/cashForecast.js'

const HORIZONS = [30, 60, 90]

const W = 800
const H = 320
const PAD_L = 70
const PAD_R = 20
const PAD_T = 20
const PAD_B = 30

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const NICE_STEPS = [1, 2, 2.5, 3, 4, 5, 6, 8, 10]

const signedLabel = (value) => `${value >= 0 ? '+' : '-'}${formatINR(Math.abs(value))}`

// "2026-11-21" -> "21 Nov"
const axisDate = (iso) => {
  const [, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]}`
}

// Pick a "nice" rupee step so that roughly four gridlines span the range.
const niceStep = (range) => {
  const raw = range / 4
  const mag = Math.pow(10, Math.floor(Math.log10(raw)))
  const n = raw / mag
  const base = NICE_STEPS.find((s) => s >= n) ?? 10
  return base * mag
}

export default function ForecastView() {
  const { state } = useStore()
  const [horizon, setHorizon] = useState(30)
  const [activeIndex, setActiveIndex] = useState(null)

  const forecast = useMemo(
    () =>
      buildForecastSeries({
        cashOnHand: state.cashOnHand,
        invoices: state.invoices,
        upcomingBills: state.upcomingBills,
        horizonDays: horizon,
      }),
    [state, horizon]
  )

  const { points, lowestPoint, firstCrunchDate, hasCrunch, totalExpectedInflow, totalExpectedOutflow, endingBalance, milestones } = forecast

  const count = points.length
  const balances = points.map((p) => p.balance)
  const rawMin = Math.min(0, ...balances)
  const rawMax = Math.max(0, ...balances)
  const yMin = rawMin
  const yMax = rawMax === rawMin ? rawMin + 1 : rawMax

  const xFor = (i) => (count <= 1 ? PAD_L : PAD_L + (i * (W - PAD_L - PAD_R)) / (count - 1))
  const yFor = (b) => PAD_T + ((yMax - b) / (yMax - yMin)) * (H - PAD_T - PAD_B)
  const zeroY = yFor(0)

  // Horizontal gridlines at nice rupee steps (always includes 0 because yMin <= 0 <= yMax).
  const step = niceStep(yMax - yMin)
  const gridValues = []
  for (let k = Math.ceil(yMin / step); k <= Math.floor(yMax / step); k += 1) {
    gridValues.push(k * step)
  }

  // Five evenly spaced x-axis date labels (indices de-duplicated for short horizons).
  const dateIndexes = count > 0 ? [...new Set([0, 1, 2, 3, 4, 5].map((k) => Math.round((k * (count - 1)) / 5)))] : []

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${xFor(i).toFixed(2)} ${yFor(p.balance).toFixed(2)}`).join(' ')
  const areaPath =
    count > 0
      ? `${linePath} L ${xFor(count - 1).toFixed(2)} ${zeroY.toFixed(2)} L ${xFor(0).toFixed(2)} ${zeroY.toFixed(2)} Z`
      : ''

  const activePoint = activeIndex !== null && points[activeIndex] ? points[activeIndex] : null

  // Hover strips: each spans midpoint-to-midpoint around its point; first and last reach the plot edges.
  const stripBounds = (i) => {
    const left = i === 0 ? PAD_L : (xFor(i - 1) + xFor(i)) / 2
    const right = i === count - 1 ? W - PAD_R : (xFor(i) + xFor(i + 1)) / 2
    return { left, width: right - left }
  }

  const bannerClass = hasCrunch
    ? 'rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800'
    : 'rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800'

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">30–90 Day Cash-Flow Forecast</h2>
          <p className="mt-1 text-sm text-slate-500">Projected cash runway from due invoices vs. upcoming studio bills</p>
        </div>
        <div className="flex gap-2">
          {HORIZONS.map((days) => (
            <button
              key={days}
              type="button"
              onClick={() => {
                setHorizon(days)
                setActiveIndex(null)
              }}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                horizon === days ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {days} Days
            </button>
          ))}
        </div>
      </div>

      <div className={`mt-5 ${bannerClass}`}>
        {hasCrunch ? (
          <p>
            <span className="font-semibold">Cash Crunch Detected:</span> Balance hits {formatINR(lowestPoint.balance)} starting{' '}
            {firstCrunchDate}.
          </p>
        ) : (
          <p>
            <span className="font-semibold">Healthy Runway:</span> Cash stays positive across the next {horizon} days (Lowest point:{' '}
            {formatINR(lowestPoint.balance)}).
          </p>
        )}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-emerald-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-emerald-600">Expected Inflows</p>
          <p className="mt-2 text-2xl font-semibold text-emerald-600">{formatINR(totalExpectedInflow)}</p>
          <p className="mt-1 text-sm text-slate-500">Unpaid invoices due in {horizon} days</p>
        </div>
        <div className="rounded-xl border border-rose-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-rose-600">Scheduled Bills</p>
          <p className="mt-2 text-2xl font-semibold text-rose-600">{formatINR(totalExpectedOutflow)}</p>
          <p className="mt-1 text-sm text-slate-500">Unpaid studio bills in {horizon} days</p>
        </div>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500">Projected End Balance</p>
          <p className={`mt-2 text-2xl font-semibold ${endingBalance < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
            {formatINR(endingBalance)}
          </p>
          <p className="mt-1 text-sm text-slate-500">Balance on day {horizon}</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border bg-white p-4">
        {count > 0 ? (
          <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Projected bank balance over time">
            <defs>
              <linearGradient id="forecastAreaFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0" />
              </linearGradient>
            </defs>

            {gridValues.map((v) => (
              <g key={`grid-${v}`}>
                <line
                  x1={PAD_L}
                  x2={W - PAD_R}
                  y1={yFor(v)}
                  y2={yFor(v)}
                  stroke={v === 0 ? '#94a3b8' : '#e2e8f0'}
                  strokeWidth="1"
                  strokeDasharray="4 4"
                />
                <text x={4} y={yFor(v) + 4} textAnchor="start" fontSize="12" fill="#64748b">
                  {formatINR(v)}
                </text>
              </g>
            ))}

            {areaPath && <path d={areaPath} fill="url(#forecastAreaFill)" />}
            {linePath && <path d={linePath} fill="none" stroke="#4f46e5" strokeWidth="2.5" strokeLinejoin="round" />}

            {points.map((p, i) =>
              p.dayInflows.length > 0 ? (
                <circle key={`in-${i}`} cx={xFor(i)} cy={yFor(p.balance)} r="4" fill="#10b981" stroke="white" strokeWidth="1.5" />
              ) : null
            )}
            {points.map((p, i) =>
              p.dayOutflows.length > 0 ? (
                <circle key={`out-${i}`} cx={xFor(i)} cy={yFor(p.balance)} r="4" fill="#f43f5e" stroke="white" strokeWidth="1.5" />
              ) : null
            )}
            {points.map((p, i) =>
              p.balance < 0 ? <circle key={`neg-${i}`} cx={xFor(i)} cy={yFor(p.balance)} r="4" fill="#e11d48" /> : null
            )}

            {activePoint && (
              <>
                <line
                  x1={xFor(activeIndex)}
                  x2={xFor(activeIndex)}
                  y1={PAD_T}
                  y2={H - PAD_B}
                  stroke="#475569"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={xFor(activeIndex)}
                  cy={yFor(activePoint.balance)}
                  r="6"
                  fill="white"
                  stroke="#4f46e5"
                  strokeWidth="2.5"
                />
              </>
            )}

            {dateIndexes.map((i) => (
              <text key={`date-${i}`} x={xFor(i)} y={H - 8} textAnchor="middle" fontSize="12" fill="#64748b">
                {axisDate(points[i].date)}
              </text>
            ))}

            {points.map((p, i) => {
              const { left, width } = stripBounds(i)
              return (
                <rect
                  key={`hover-${i}`}
                  x={left}
                  y={PAD_T}
                  width={width}
                  height={H - PAD_T - PAD_B}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setActiveIndex(i)}
                  onClick={() => setActiveIndex(i)}
                >
                  <title>{`${p.date}: ${formatINR(p.balance)}`}</title>
                </rect>
              )
            })}
          </svg>
        ) : (
          <p className="text-sm text-slate-500">No forecast data available.</p>
        )}

        {activePoint && (
          <div className="mt-4 rounded-lg border bg-slate-50 p-4 text-sm">
            <p className="font-semibold text-slate-900">
              {activePoint.date} · Balance {formatINR(activePoint.balance)}
            </p>
            <div className="mt-2 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <p className="text-emerald-600">
                  Day Inflows: {activePoint.dayInflows.length > 0 ? `+${formatINR(activePoint.dayInflowAmount)}` : formatINR(0)}
                </p>
                <p className="text-xs text-slate-500">cumulative {formatINR(activePoint.cumulativeInflow)}</p>
                {activePoint.dayInflows.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-slate-700">
                    {activePoint.dayInflows.map((ev, i) => (
                      <li key={`din-${i}`}>
                        {ev.label} · +{formatINR(Math.abs(ev.amount))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <p className="text-rose-600">
                  Day Outflows: {activePoint.dayOutflows.length > 0 ? `-${formatINR(activePoint.dayOutflowAmount)}` : formatINR(0)}
                </p>
                <p className="text-xs text-slate-500">cumulative {formatINR(activePoint.cumulativeOutflow)}</p>
                {activePoint.dayOutflows.length > 0 && (
                  <ul className="mt-1 space-y-0.5 text-slate-700">
                    {activePoint.dayOutflows.map((ev, i) => (
                      <li key={`dout-${i}`}>
                        {ev.label} · -{formatINR(Math.abs(ev.amount))}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-base font-semibold text-slate-900">Key Cash Milestones</h3>
        {milestones.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500">No scheduled inflows or bills in this window.</p>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-white">
            {milestones.map((m, i) => (
              <li key={`${m.date}-${i}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <div>
                  <p className="font-medium text-slate-900">{m.label}</p>
                  <p className="text-slate-500">{m.date}</p>
                </div>
                <div className="text-right">
                  <p className={m.signed >= 0 ? 'font-semibold text-emerald-600' : 'font-semibold text-rose-600'}>
                    {signedLabel(m.signed)}
                  </p>
                  <p className="text-slate-500">Balance {formatINR(m.runningBalance)}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
