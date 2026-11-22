import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { formatINR } from '../utils/format.js'

export default function PriorityAlert({ invoice, onMarkPaid, onChase }) {
  if (!invoice) {
    return (
      <div className="flex items-center justify-between gap-4 rounded-2xl border border-emerald-200/80 bg-emerald-50/60 px-5 py-3.5 text-emerald-900">
        <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
        <p className="text-sm">
          <span className="font-semibold">All Clear:</span> Zero overdue invoices! Every past-due
          client has settled up.
        </p>
      </div>
    )
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-rose-200/80 bg-rose-50/60 px-5 py-3.5 text-rose-900">
      <AlertTriangle className="h-5 w-5 shrink-0 text-rose-600" />
      <p className="flex-1 text-sm">
        <span className="font-semibold">Priority Action Today:</span> Chase {invoice.client} (
        {invoice.company}) for {formatINR(invoice.amount)} — {invoice.timelineText}. Collecting
        this helps cover your upcoming studio bills.
      </p>
      <button
        onClick={() => onMarkPaid(invoice)}
        className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl bg-rose-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition-colors"
      >
        Mark Paid
      </button>
      {onChase && (
        <button
          type="button"
          onClick={() => onChase(invoice)}
          className="inline-flex h-9 items-center justify-center whitespace-nowrap rounded-xl border border-rose-300 bg-white px-3.5 text-xs font-medium text-rose-700 hover:bg-rose-50 transition-colors"
        >
          Draft Reminder
        </button>
      )}
    </div>
  )
}
