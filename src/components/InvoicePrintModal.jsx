import { useEffect, useState } from 'react'
import { Printer, X } from 'lucide-react'
import { formatINR } from '../utils/format.js'

const QR_SQUARES = [
  [26, 4], [32, 4], [38, 6], [44, 4], [50, 8],
  [24, 12], [30, 14], [36, 12], [42, 16], [48, 14], [54, 12],
  [26, 22], [34, 24], [40, 22], [46, 26], [52, 22],
  [28, 34], [38, 36], [44, 40], [50, 36],
]

export default function InvoicePrintModal({ invoice, onClose }) {
  const [mode, setMode] = useState('gst')

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const base = Math.round(invoice.amount / 1.18)
  const tax = invoice.amount - base
  const cgst = Math.floor(tax / 2)
  const sgst = tax - cgst

  const modeButtonClass = (active) =>
    `rounded-full px-3 py-1.5 text-sm font-medium ${
      active
        ? 'bg-slate-900 text-white'
        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
    }`

  return (
    <div
      id="invoice-print-overlay"
      className="fixed inset-0 z-50 bg-slate-900/60 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Invoice print preview"
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="print:hidden sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b bg-white p-4 rounded-t-2xl">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              aria-pressed={mode === 'standard'}
              onClick={() => setMode('standard')}
              className={modeButtonClass(mode === 'standard')}
            >
              Standard Invoice
            </button>
            <button
              type="button"
              aria-pressed={mode === 'gst'}
              onClick={() => setMode('gst')}
              className={modeButtonClass(mode === 'gst')}
            >
              GST Tax Invoice (18% Incl.)
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
            >
              <Printer className="h-4 w-4" />
              Print / Save PDF
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div id="printable-invoice" className="m-6 border border-slate-300 bg-white p-8 text-slate-900">
          <div className="flex justify-between gap-6">
            <div>
              <p className="text-xl font-bold tracking-wide">ARJUN RAO DESIGN STUDIO</p>
              <p className="mt-1 text-xs text-slate-600">Indiranagar, Bengaluru • GSTIN: 29AABCA1234F1Z5 • arjun@studiorao.in</p>
            </div>
            <div className="text-right">
              <p className="text-lg font-bold">{mode === 'gst' ? 'TAX INVOICE' : 'INVOICE'}</p>
              <p className="mt-1 text-sm">{`Invoice #: ${invoice.id}`}</p>
              <p className="text-sm">{`Due Date: ${invoice.dueDate}`}</p>
              {invoice.status === 'Paid' ? (
                <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold bg-emerald-100 text-emerald-700">PAID</span>
              ) : (
                <span className="mt-2 inline-block rounded-full px-3 py-1 text-xs font-bold bg-amber-100 text-amber-800">DUE</span>
              )}
            </div>
          </div>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Billed To</p>
            <p className="mt-1 font-semibold">{invoice.client}</p>
            <p className="text-sm">{invoice.company}</p>
            <p className="text-sm">Place of Supply: Karnataka (29)</p>
          </div>

          <table className="mt-8 w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="pb-2 text-left font-semibold">Description</th>
                <th className="pb-2 text-left font-semibold">SAC Code</th>
                <th className="pb-2 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="py-2">{invoice.project}</td>
                <td className="py-2">998314</td>
                <td className="py-2 text-right">{formatINR(mode === 'gst' ? base : invoice.amount)}</td>
              </tr>
            </tbody>
          </table>

          <div className="mt-4 ml-auto w-72 space-y-1 text-sm">
            {mode === 'standard' ? (
              <>
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatINR(invoice.amount)}</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex justify-between">
                  <span>Taxable Value</span>
                  <span>{formatINR(base)}</span>
                </div>
                <div className="flex justify-between">
                  <span>CGST 9%</span>
                  <span>{formatINR(cgst)}</span>
                </div>
                <div className="flex justify-between">
                  <span>SGST 9%</span>
                  <span>{formatINR(sgst)}</span>
                </div>
              </>
            )}
            <div className="flex justify-between border-t pt-2 text-base font-bold">
              <span>Grand Total</span>
              <span>{formatINR(invoice.amount)}</span>
            </div>
          </div>

          <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t pt-6">
            <div className="flex items-end gap-4">
              <div className="rounded-lg border border-slate-300 p-3 text-sm">
                <p className="font-semibold">Pay via UPI: arjunrao@okicici</p>
                <p className="text-xs text-slate-600">{`Ref: ${invoice.id}`}</p>
              </div>
              <svg viewBox="0 0 64 64" className="h-20 w-20" aria-hidden="true">
                <rect x="2" y="2" width="16" height="16" fill="none" stroke="#0f172a" strokeWidth="2" />
                <rect x="46" y="2" width="16" height="16" fill="none" stroke="#0f172a" strokeWidth="2" />
                <rect x="2" y="46" width="16" height="16" fill="none" stroke="#0f172a" strokeWidth="2" />
                {QR_SQUARES.map(([x, y], i) => (
                  <rect key={i} x={x} y={y} width="4" height="4" fill="#0f172a" />
                ))}
              </svg>
            </div>
            <div className="text-right">
              <div className="ml-auto mb-1 h-px w-56 bg-slate-400" />
              <p className="text-sm font-medium">Authorized Signatory — Arjun Rao Design Studio</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
