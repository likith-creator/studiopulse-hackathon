import { useState } from 'react'
import { MessageSquareText, Plus, Printer, Send } from 'lucide-react'
import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'
import NewInvoiceModal from './NewInvoiceModal.jsx'
import InvoicePrintModal from './InvoicePrintModal.jsx'

const FILTERS = ['All', 'Overdue', 'Pending', 'Paid']

const BADGE_CLASSES = {
  Overdue: 'bg-rose-50 text-rose-700 ring-rose-600/20',
  Pending: 'bg-amber-50 text-amber-700 ring-amber-600/20',
  Paid: 'bg-emerald-50 text-emerald-700 ring-emerald-600/20',
}

export default function ReceivablesLedger({ onMarkPaid, onCreateInvoice, onOpenWhatsApp, onChase }) {
  const { state } = useStore()
  const [filter, setFilter] = useState('All')
  const [query, setQuery] = useState('')
  const [showNewInvoice, setShowNewInvoice] = useState(false)
  const [printInvoice, setPrintInvoice] = useState(null)

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
    <section className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_1px_3px_rgba(15,23,42,0.03)]">
      <div className="pb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Receivables Ledger</h2>
          <p className="text-sm text-slate-500">Who Owes Me, How Much, and Since When?</p>
        </div>
        <div className="flex items-center gap-2">
          {onOpenWhatsApp && (
            <button
              onClick={onOpenWhatsApp}
              className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 whitespace-nowrap transition-colors"
            >
              <MessageSquareText size={16} />
              Paste WhatsApp
            </button>
          )}
          <button
            onClick={() => setShowNewInvoice(true)}
            className="inline-flex items-center justify-center gap-1.5 h-9 px-3.5 rounded-xl bg-indigo-600 text-white text-xs font-semibold shadow-sm hover:bg-indigo-700 whitespace-nowrap transition-colors"
          >
            <Plus size={16} />
            New Invoice
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`inline-flex items-center h-8 px-3 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                filter === f
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
          className="h-9 w-80 rounded-xl border border-slate-200 bg-white px-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-200"
        />
      </div>

      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-slate-500">
            <th className="py-3 text-left font-medium text-slate-500">Client &amp; Company</th>
            <th className="py-3 text-left font-medium text-slate-500">Project</th>
            <th className="py-3 text-right font-medium text-slate-500">Amount (₹)</th>
            <th className="py-3 text-left font-medium text-slate-500">Timeline</th>
            <th className="py-3 text-right font-medium text-slate-500">Action</th>
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
                <td className="py-4">
                  <p className="font-semibold text-slate-900">{inv.client}</p>
                  <p className="text-slate-500 text-sm">{inv.company}</p>
                </td>
                <td className="py-4 text-slate-700">{inv.project}</td>
                <td className="py-4 text-right font-medium tabular-nums">{formatINR(inv.amount)}</td>
                <td className="py-4">
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset ${BADGE_CLASSES[inv.status]}`}
                  >
                    {inv.timelineText}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center justify-end gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPrintInvoice(inv)}
                      aria-label={`Open PDF for ${inv.id}`}
                      className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 whitespace-nowrap hover:bg-slate-50 transition-colors"
                    >
                      <Printer className="h-3.5 w-3.5" />PDF
                    </button>
                    {inv.status === 'Paid' ? (
                      <span className="inline-flex items-center h-7 px-2.5 rounded-full bg-emerald-50 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">Paid</span>
                    ) : (
                      <>
                        {onChase && (
                          <button
                            type="button"
                            onClick={() => onChase(inv)}
                            className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-700 whitespace-nowrap hover:bg-slate-50 transition-colors"
                          >
                            <Send className="h-3.5 w-3.5" />
                            Chase
                          </button>
                        )}
                        <button
                          onClick={() => onMarkPaid(inv)}
                          className="inline-flex items-center justify-center gap-1 h-7 px-2.5 rounded-lg bg-indigo-600 text-xs font-medium text-white whitespace-nowrap hover:bg-indigo-700 transition-colors"
                        >
                          Mark Paid
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {showNewInvoice && (
        <NewInvoiceModal
          onClose={() => setShowNewInvoice(false)}
          onCreate={(payload) => {
            onCreateInvoice(payload)
            setShowNewInvoice(false)
          }}
        />
      )}
      {printInvoice && <InvoicePrintModal invoice={printInvoice} onClose={() => setPrintInvoice(null)} />}
    </section>
  )
}
