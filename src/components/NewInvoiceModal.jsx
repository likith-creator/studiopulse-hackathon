import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500'

const DELAY_OPTIONS = [
  { label: 'On time (0 days)', value: 0 },
  { label: 'Usually ~7 days late', value: 7 },
  { label: 'Usually ~14 days late', value: 14 },
]

export default function NewInvoiceModal({ onClose, onCreate }) {
  const [client, setClient] = useState('')
  const [company, setCompany] = useState('')
  const [project, setProject] = useState('')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState('2026-11-28')
  const [delay, setDelay] = useState(0)
  const [error, setError] = useState('')

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const handleSubmit = (e) => {
    e.preventDefault()
    const c = client.trim()
    const co = company.trim()
    const pr = project.trim()
    const amt = Number(amount)
    const invalid =
      !c ||
      !co ||
      !pr ||
      !dueDate ||
      amount === '' ||
      Number.isNaN(amt) ||
      amt <= 0
    if (invalid) {
      setError('All fields are required and the amount must be greater than 0.')
      return
    }
    setError('')
    onCreate({
      client: c,
      company: co,
      project: pr,
      amount: amt,
      dueDate,
      avgDelayDays: Number(delay),
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">New Invoice</h3>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Client Name</label>
            <input
              type="text"
              value={client}
              onChange={(e) => setClient(e.target.value)}
              placeholder="Meera Krishnan"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Company / Brand</label>
            <input
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Malabar Botanics"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Project Description</label>
            <input
              type="text"
              value={project}
              onChange={(e) => setProject(e.target.value)}
              placeholder="Packaging & Label System"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Amount in ₹</label>
            <input
              type="number"
              min={1}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="40000"
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={INPUT_CLASS}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Expected Client Delay</label>
            <select
              value={delay}
              onChange={(e) => setDelay(Number(e.target.value))}
              className={INPUT_CLASS}
            >
              {DELAY_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-rose-600 text-sm">{error}</p>}

          <div className="mt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border px-4 py-2 text-slate-600 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white rounded-lg px-4 py-2 font-semibold"
            >
              Create Invoice
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
