import { useEffect, useMemo, useState } from 'react'
import { MessageSquareText } from 'lucide-react'
import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'
import { parseWhatsAppMessage } from '../utils/whatsappParser.js'

const SAMPLES = [
  {
    label: 'Hinglish Packaging Deal',
    text: 'Hey Arjun! Siddharth here from Zest Foods. Packaging designs final ho gaye hain, will transfer 55k by 2026-11-30.',
  },
  {
    label: 'Landing Page Milestone',
    text: 'Hi Arjun, Kavita from DukaanPe. Landing page wireframe approved! Raise invoice for ₹42,000 due 2026-12-04.',
  },
  {
    label: 'Already Paid (Trap Test)',
    text: 'Arjun bhai, Rohan Verma (TechSpark Labs) ne 28k bhej diye UPI se just now for pitch deck.',
  },
]

const INPUT_CLASS =
  'w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-500'

const GEMINI_KEY_STORAGE = 'studiopulse-gemini-key'
const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'
const INTENTS = ['create_invoice', 'mark_paid', 'outgoing_expense']
const DEFAULT_DUE = '2026-11-28'

function buildPrompt(text, invoices) {
  const unpaid = invoices
    .filter((inv) => inv.status !== 'Paid')
    .map(({ id, client, company, amount }) => ({ id, client, company, amount }))
  return [
    'The message below is a WhatsApp or Hinglish message from a client of an Indian freelance designer.',
    'Return ONLY a JSON object with these keys:',
    '- intent: "create_invoice" | "mark_paid" | "outgoing_expense"',
    '- client, company, project: strings',
    '- amount: integer rupees, or null',
    '- dueDate: YYYY-MM-DD, or null',
    '- id: for mark_paid only, the id of the matching unpaid invoice from the list, or null',
    'Today is 2026-11-21. If the message does not state a due date, use 2026-11-28.',
    'Use "mark_paid" when the client says they already paid. Use "outgoing_expense" for a bill the designer must pay, not client revenue.',
    `Unpaid invoices: ${JSON.stringify(unpaid)}`,
    'Message:',
    text,
  ].join('\n')
}

async function callGemini(key, text, invoices) {
  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ parts: [{ text: buildPrompt(text, invoices) }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const data = await res.json()
  const raw = (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '').trim()
  const json = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
  return JSON.parse(json)
}

// Maps the Gemini JSON into the same shape the local parser returns.
// Returns null when a mark_paid result matches no invoice (caller falls back to local parse).
function toAiView(ai, invoices) {
  if (!ai || !INTENTS.includes(ai.intent)) throw new Error('unrecognised intent')
  const clean = (v) => (typeof v === 'string' ? v.trim() : '')
  const client = clean(ai.client)
  const company = clean(ai.company)
  const project = clean(ai.project)
  const num = Math.round(Number(ai.amount))
  const amount = Number.isFinite(num) && num > 0 ? num : null
  const dueDate = /^\d{4}-\d{2}-\d{2}$/.test(clean(ai.dueDate)) ? clean(ai.dueDate) : DEFAULT_DUE

  let matchedInvoice = null
  if (ai.intent === 'mark_paid') {
    matchedInvoice =
      invoices.find((inv) => ai.id && inv.id === ai.id) ??
      invoices.find(
        (inv) =>
          inv.status !== 'Paid' &&
          client !== '' &&
          (inv.client || '').toLowerCase() === client.toLowerCase()
      ) ??
      null
    if (!matchedInvoice) return null
  }

  return {
    intent: ai.intent,
    client,
    company,
    project,
    amount,
    dueDate,
    matchedInvoice,
    isDefaultDate: dueDate === DEFAULT_DUE,
    confidence: {
      clientDetected: client !== '',
      amountDetected: amount !== null,
      dateDetected: dueDate !== DEFAULT_DUE,
    },
    source: 'ai',
  }
}

export default function WhatsAppParserPanel({ onCreateInvoice, onMarkPaid }) {
  const { state } = useStore()
  const [text, setText] = useState(SAMPLES[0].text)
  const [form, setForm] = useState({
    client: '',
    company: '',
    project: '',
    amount: '',
    dueDate: '',
  })

  const [aiOn, setAiOn] = useState(false)
  const [geminiKey, setGeminiKey] = useState('')
  const [aiResult, setAiResult] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiNote, setAiNote] = useState('')

  const parsed = useMemo(
    () => parseWhatsAppMessage(text, state.invoices),
    [text, state.invoices]
  )

  // AI result only applies while the AI toggle is on; otherwise the live local parse is used.
  const view = aiOn && aiResult ? aiResult : parsed

  useEffect(() => {
    setGeminiKey(localStorage.getItem(GEMINI_KEY_STORAGE) ?? '')
  }, [])

  useEffect(() => {
    setForm({
      client: view.client,
      company: view.company,
      project: view.project,
      amount: view.amount ?? '',
      dueDate: view.dueDate,
    })
  }, [view, text])

  const updateText = (next) => {
    setText(next)
    setAiResult(null)
    setAiNote('')
  }

  const handleAiParse = async () => {
    setAiLoading(true)
    setAiNote('')
    try {
      const key = geminiKey.trim()
      if (!key) throw new Error('no API key entered')
      const ai = await callGemini(key, text, state.invoices)
      const next = toAiView(ai, state.invoices)
      if (next) {
        setAiResult(next)
      } else {
        setAiResult(null)
        setAiNote('AI unavailable, used local parser: no matching unpaid invoice')
      }
    } catch (err) {
      setAiResult(null)
      setAiNote(
        `AI unavailable, used local parser: ${String(err?.message ?? 'request failed').slice(0, 120)}`
      )
    } finally {
      setAiLoading(false)
    }
  }

  const amt = Number(form.amount)
  const canCreate =
    form.client.trim() !== '' &&
    form.company.trim() !== '' &&
    form.project.trim() !== '' &&
    amt > 0

  const handleCreate = () => {
    onCreateInvoice({
      client: form.client.trim(),
      company: form.company.trim(),
      project: form.project.trim(),
      amount: amt,
      dueDate: form.dueDate,
      avgDelayDays: 0,
    })
  }

  const m = view.matchedInvoice

  return (
    <section className="bg-white rounded-xl border shadow-sm p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <MessageSquareText size={20} className="text-emerald-600" />
            <h2 className="text-lg font-semibold text-slate-900">Paste WhatsApp / Hinglish Chat</h2>
          </div>
          <button
            type="button"
            aria-pressed={aiOn}
            onClick={() => {
              setAiOn(!aiOn)
              setAiResult(null)
              setAiNote('')
            }}
            className={`rounded-full border px-3 py-1 text-xs font-medium ${
              aiOn
                ? 'bg-emerald-600 border-emerald-600 text-white'
                : 'border-slate-300 text-slate-600 hover:bg-slate-50'
            }`}
          >
            AI Deep Parse
          </button>
        </div>

        {aiOn && (
          <div className="flex flex-col gap-2 rounded-lg border border-slate-200 p-3">
            <input
              type="password"
              autoComplete="off"
              placeholder="Gemini API key"
              value={geminiKey}
              onChange={(e) => {
                setGeminiKey(e.target.value)
                localStorage.setItem(GEMINI_KEY_STORAGE, e.target.value)
              }}
              className={INPUT_CLASS}
            />
            <button
              type="button"
              onClick={handleAiParse}
              disabled={aiLoading}
              className="self-start rounded-lg bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {aiLoading ? 'Parsing…' : 'Parse with AI'}
            </button>
            {aiNote && (
              <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
                {aiNote}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {SAMPLES.map((s) => (
            <button
              key={s.label}
              type="button"
              onClick={() => updateText(s.text)}
              className="rounded-full border px-3 py-1 text-xs hover:bg-slate-50"
            >
              {s.label}
            </button>
          ))}
        </div>

        <textarea
          rows={6}
          value={text}
          onChange={(e) => updateText(e.target.value)}
          className="w-full rounded-lg border p-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
        />
      </div>

      <div className="flex flex-col gap-4">
        {view.intent === 'create_invoice' && (
          <>
            <h3 className="text-lg font-semibold text-slate-900">Extracted Invoice</h3>
            <div className="flex flex-wrap gap-2">
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  view.confidence.clientDetected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {view.confidence.clientDetected ? 'Client ✓' : 'Client: defaulted'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  view.confidence.amountDetected
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {view.confidence.amountDetected ? 'Amount ✓' : 'Amount: defaulted'}
              </span>
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  view.confidence.dateDetected && !view.isDefaultDate
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {view.confidence.dateDetected && !view.isDefaultDate
                  ? 'Due Date ✓'
                  : 'Due Date: defaulted'}
              </span>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Client</label>
              <input
                type="text"
                value={form.client}
                onChange={(e) => setForm({ ...form, client: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Company</label>
              <input
                type="text"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Project</label>
              <input
                type="text"
                value={form.project}
                onChange={(e) => setForm({ ...form, project: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Amount in ₹</label>
              <input
                type="number"
                min={1}
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className={INPUT_CLASS}
              />
            </div>
            <div>
              <button
                type="button"
                onClick={handleCreate}
                disabled={!canCreate}
                className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Invoice in 1 Click
              </button>
            </div>
          </>
        )}

        {view.intent === 'mark_paid' && m && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-amber-900 flex flex-col gap-3">
            <p className="text-sm">
              Double-Billing Prevented: {m.client} already has open invoice {m.id} (
              {formatINR(m.amount)}). Mark it paid instead?
            </p>
            <div>
              <button
                type="button"
                onClick={() => onMarkPaid(m)}
                className="bg-amber-600 hover:bg-amber-700 text-white rounded-lg px-4 py-2 font-semibold"
              >
                Mark {m.id} Paid
              </button>
            </div>
          </div>
        )}

        {view.intent === 'outgoing_expense' && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 text-rose-900">
            <p className="text-sm">
              This looks like an outgoing expense (a bill you pay), not client revenue, so no
              invoice was created.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
