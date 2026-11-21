import { useState } from 'react'
import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'

const FILTERS = ['All', 'Overdue', 'Pending', 'Paid']

const BADGE_CLASSES = {
  Overdue: 'bg-red-100 text-red-700',
  Pending: 'bg-amber-100 text-amber-800',
  Paid: 'bg-emerald-100 text-emerald-700',
}

export default function ReceivablesLedger({ onMarkPaid }) {
  const { state } = useStore()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')

  const invoices = state.invoices
  const counts = {
    All: invoices.length,
    Overdue: invoices.filter((inv) => inv.status === 'Overdue').length,
    Pending: invoices.filter((inv) => inv.status === 'Pending').length,
    Paid: invoices.filter((inv) => inv.status === 'Paid').length,
  }

  const q = query.trim().toLowerCase()
  const visible = invoices.filter((inv) => {
    if (filter !== 'All' && inv.status !== filter) return false
    if (!q) return true
    return [inv.client, inv.company, inv.project, inv.id].some((field) =>
      field.toLowerCase().includes(q)
    )
  })

  return (
    <section className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Receivables Ledger</h2>
        <p className="text-sm text-slate-500">Who Owes Me, How Much, and Since When?</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {f} ({counts[f]})
            </button>
          ))}
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search client, company, project or ID"
          className="w-80 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="py-3 font-medium">Client &amp; Company</th>
            <th className="py-3 font-medium">Project</th>
            <th className="py-3 font-medium text-right">Amount (₹)</th>
            <th className="py-3 font-medium">Timeline</th>
            <th className="py-3 font-medium">Action</th>
          </tr>
        </thead>
        <tbody>
          {visible.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-slate-500">
                No invoices match this view.
              </td>
            </tr>
          ) : (
            visible.map((inv) => (
              <tr key={inv.id} className="border-b last:border-0">
                <td className="py-3">
                  <p className="font-semibold text-slate-900">{inv.client}</p>
                  <p className="text-slate-500 text-sm">{inv.company}</p>
                </td>
                <td className="py-3 text-slate-700">{inv.project}</td>
                <td className="py-3 text-right font-medium">{formatINR(inv.amount)}</td>
                <td className="py-3">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${BADGE_CLASSES[inv.status]}`}
                  >
                    {inv.timelineText}
                  </span>
                </td>
                <td className="py-3">
                  {inv.status === 'Paid' ? (
                    <span className="text-slate-400">Paid</span>
                  ) : (
                    <button
                      onClick={() => onMarkPaid(inv)}
                      className="rounded-lg bg-slate-900 px-3 py-1.5 text-white hover:bg-slate-800"
                    >
                      Mark Paid
                    </button>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </section>
  )
}
