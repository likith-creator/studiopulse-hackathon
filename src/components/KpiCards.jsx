import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'

const sumAmounts = (items) => items.reduce((total, item) => total + item.amount, 0)

export default function KpiCards() {
  const { state } = useStore()

  const unpaid = state.invoices.filter((inv) => inv.status === 'Overdue' || inv.status === 'Pending')
  const overdue = state.invoices.filter((inv) => inv.status === 'Overdue')
  const totalOwed = sumAmounts(unpaid)
  const overdueTotal = sumAmounts(overdue)
  const totalBills = sumAmounts(state.upcomingBills)
  const hasShortfall = state.cashOnHand < totalBills

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
      <div className="rounded-xl shadow-sm border bg-white p-5">
        <p className="text-sm font-medium text-slate-500">Cash on Hand</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(state.cashOnHand)}</p>
        <p className="mt-1 text-sm text-slate-500">Available bank balance</p>
      </div>

      <div className="rounded-xl shadow-sm border bg-white p-5">
        <p className="text-sm font-medium text-slate-500">Total Owed to You</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalOwed)}</p>
        <p className="mt-1 text-sm text-slate-500">Across {unpaid.length} unpaid invoices</p>
      </div>

      <div className="rounded-xl shadow-sm border border-rose-200 bg-white p-5">
        <p className="text-sm font-medium text-rose-600">Overdue Right Now</p>
        <p className="mt-2 text-2xl font-semibold text-rose-600">{formatINR(overdueTotal)}</p>
        <p className="mt-1 text-sm text-slate-500">{overdue.length} invoices past due</p>
      </div>

      <div className="rounded-xl shadow-sm border bg-white p-5">
        <p className="text-sm font-medium text-slate-500">Next 30-Day Bills</p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">{formatINR(totalBills)}</p>
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="text-sm text-slate-500">Across {state.upcomingBills.length} bills</p>
          {hasShortfall && (
            <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
              Shortfall vs. Cash
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
