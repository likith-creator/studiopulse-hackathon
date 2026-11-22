import { useEffect, useState } from 'react'
import { FileText, LayoutDashboard, SlidersHorizontal, TrendingUp } from 'lucide-react'
import PriorityAlert from './components/PriorityAlert.jsx'
import KpiCards from './components/KpiCards.jsx'
import ReceivablesLedger from './components/ReceivablesLedger.jsx'
import WhatsAppParserPanel from './components/WhatsAppParserPanel.jsx'
import Toast from './components/Toast.jsx'
import FollowUpDrawer from './components/FollowUpDrawer.jsx'
import UpcomingBillsPanel from './components/UpcomingBillsPanel.jsx'
import ForecastView from './components/ForecastView.jsx'
import WhatIfSimulator from './components/WhatIfSimulator.jsx'
import MorningBriefing from './components/MorningBriefing.jsx'
import { useStore, nextInvoiceId } from './store.jsx'
import { formatINR } from './utils/format.js'

const TABS = ['Command Center', 'Invoices', '90-Day Forecast', 'What-If Simulator']

const TAB_ICONS = { 'Command Center': LayoutDashboard, Invoices: FileText, '90-Day Forecast': TrendingUp, 'What-If Simulator': SlidersHorizontal }
const TAB_SUBTITLES = { 'Command Center': "Receivables, cash runway and today's priorities", Invoices: 'Turn client messages into invoices and track what is owed', '90-Day Forecast': 'Projected cash runway from due invoices vs. upcoming bills', 'What-If Simulator': 'Stress-test late payments and plan recovery moves' }

export default function App() {
  const { state, dispatch } = useStore()
  const [activeTab, setActiveTab] = useState('Command Center')
  const [message, setMessage] = useState('')
  const [chaseInvoice, setChaseInvoice] = useState(null)

  useEffect(() => {
    if (!message) return
    const timer = setTimeout(() => setMessage(''), 3000)
    return () => clearTimeout(timer)
  }, [message])

  const handleMarkPaid = (invoice) => {
    dispatch({ type: 'MARK_PAID', payload: { id: invoice.id } })
    setMessage(`${invoice.id} marked paid · ${formatINR(invoice.amount)} added to cash`)
  }

  const handleCreateInvoice = (payload) => {
    const id = nextInvoiceId(state.invoices)
    dispatch({ type: 'ADD_INVOICE', payload })
    setMessage(`${id} created · ${formatINR(payload.amount)} added to receivables`)
  }

  let content
  if (activeTab === 'Command Center') {
    const priorityInvoice =
      state.invoices
        .filter((inv) => inv.status === 'Overdue')
        .sort((a, b) => a.dueDate.localeCompare(b.dueDate))[0] ?? null
    content = (
      <div className="flex flex-col gap-8">
        <MorningBriefing onOpenSimulator={() => setActiveTab('What-If Simulator')} />
        <PriorityAlert
          invoice={priorityInvoice}
          onMarkPaid={handleMarkPaid}
          onChase={setChaseInvoice}
        />
        <KpiCards />
        <ReceivablesLedger
          invoices={state.invoices}
          onMarkPaid={handleMarkPaid}
          onCreateInvoice={handleCreateInvoice}
          onOpenWhatsApp={() => setActiveTab('Invoices')}
          onChase={setChaseInvoice}
        />
        <UpcomingBillsPanel onShowToast={setMessage} />
      </div>
    )
  } else if (activeTab === 'Invoices') {
    content = (
      <div className="flex flex-col gap-8">
        <WhatsAppParserPanel
          onCreateInvoice={handleCreateInvoice}
          onMarkPaid={handleMarkPaid}
        />
        <ReceivablesLedger
          invoices={state.invoices}
          onMarkPaid={handleMarkPaid}
          onCreateInvoice={handleCreateInvoice}
          onChase={setChaseInvoice}
        />
      </div>
    )
  } else if (activeTab === '90-Day Forecast') {
    content = <ForecastView />
  } else {
    content = <WhatIfSimulator onChase={setChaseInvoice} onShowToast={setMessage} />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <svg width="32" height="32" viewBox="0 0 32 32" className="shrink-0" aria-hidden="true">
              <defs>
                <linearGradient id="sp-logo-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                  <stop offset="0" stopColor="#4f46e5" />
                  <stop offset="1" stopColor="#7c3aed" />
                </linearGradient>
              </defs>
              <rect width="32" height="32" rx="8" fill="url(#sp-logo-grad)" />
              <path d="M5 17h5l2.5-6 4 11 3-8 2 3h5.5" fill="none" stroke="#ffffff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="text-base font-bold tracking-tight text-slate-900">StudioPulse</span>
          </div>
          <nav className="flex items-center gap-1.5">
            {TABS.map((tab) => {
              const Icon = TAB_ICONS[tab]
              const active = tab === activeTab
              return (
                <button
                  key={tab}
                  type="button"
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setActiveTab(tab)}
                  className={active
                    ? 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-all'
                    : 'inline-flex items-center gap-1.5 whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-medium text-slate-600 transition-colors hover:bg-slate-100/80 hover:text-slate-900'}
                >
                  {Icon && <Icon className="h-3.5 w-3.5" />}
                  {tab}
                </button>
              )
            })}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 py-1.5 text-xs">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span className="font-medium text-emerald-800">Bank Balance</span>
              <span className="font-bold tabular-nums text-slate-900">{formatINR(state.cashOnHand)}</span>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'RESET' })}
              className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-xs text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
            >
              Reset
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl space-y-8 px-6 py-9 lg:px-10">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">{activeTab}</h1>
            <p className="text-sm text-slate-500">{TAB_SUBTITLES[activeTab]}</p>
          </div>
        </div>
        {content}
      </main>
      {message && <Toast message={message} />}
      {chaseInvoice && (
        <FollowUpDrawer
          invoice={chaseInvoice}
          onClose={() => setChaseInvoice(null)}
          onShowToast={setMessage}
        />
      )}
    </div>
  )
}
