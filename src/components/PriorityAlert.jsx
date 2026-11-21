import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatINR } from '../utils/format.js'

export default function PriorityAlert({ invoice, onMarkPaid }) {
  if (!invoice) {
    return (
      <div className="flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm">
          <span className="font-semibold">All Clear:</span> Zero overdue invoices! Every past-due
          client has settled up.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
      <p className="flex-1 text-sm">
        <span className="font-semibold">Priority Action Today:</span> Chase {invoice.client} (
        {invoice.company}) for {formatINR(invoice.amount)} — {invoice.timelineText}. Collecting
        this helps cover your upcoming studio bills.
      </p>
      <button
        onClick={() => onMarkPaid(invoice)}
        className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-700"
      >
        Mark Paid
      </button>
    </div>
  )
}
