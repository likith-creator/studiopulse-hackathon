import { useEffect, useState } from 'react'
import Sidebar from './components/Sidebar.jsx'
import TopBar from './components/TopBar.jsx'
import ReceivablesLedger from './components/ReceivablesLedger.jsx'
import ComingSoon from './components/ComingSoon.jsx'
import Toast from './components/Toast.jsx'
import { useStore } from './store.jsx'
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

  let content
  if (activeTab === 'Command Center') {
    content = (
      <ReceivablesLedger invoices={state.invoices} onMarkPaid={handleMarkPaid} />
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
