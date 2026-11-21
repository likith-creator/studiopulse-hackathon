import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import PriorityAlert from './components/PriorityAlert.jsx'
import KpiCards from './components/KpiCards.jsx'
import ReceivablesLedger from './components/ReceivablesLedger.jsx'
import WhatsAppParserPanel from './components/WhatsAppParserPanel.jsx'
import ComingSoon from './components/ComingSoon.jsx'
import Toast from './components/Toast.jsx'
import { useStore, nextInvoiceId } from './store.jsx'
import { formatINR } from './utils/format.js'

const TABS = ['Command Center', 'Invoices', '90-Day Forecast', 'What-If Simulator']

export default function App() {
  const { state, dispatch } = useStore()
  const [activeTab, setActiveTab] = useState('Command Center')
  const [message, setMessage] = useState('')

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
      <div className="flex flex-col gap-6">
        <PriorityAlert invoice={priorityInvoice} onMarkPaid={handleMarkPaid} />
        <KpiCards />
        <ReceivablesLedger
          invoices={state.invoices}
          onMarkPaid={handleMarkPaid}
          onCreateInvoice={handleCreateInvoice}
          onOpenWhatsApp={() => setActiveTab('Invoices')}
        />
      </div>
    )
  } else if (activeTab === 'Invoices') {
    content = (
      <div className="flex flex-col gap-6">
        <WhatsAppParserPanel
          onCreateInvoice={handleCreateInvoice}
          onMarkPaid={handleMarkPaid}
        />
        <ReceivablesLedger
          invoices={state.invoices}
          onMarkPaid={handleMarkPaid}
          onCreateInvoice={handleCreateInvoice}
        />
      </div>
    )
  } else {
    content = <ComingSoon title={activeTab} />
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} />
      <div className="flex flex-1 flex-col">
        <TopBar />
        <main className="p-8">{content}</main>
      </div>
      {message && <Toast message={message} />}
    </div>
  )
}
