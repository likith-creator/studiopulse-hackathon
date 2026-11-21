import { FileText, LayoutDashboard, SlidersHorizontal, TrendingUp } from 'lucide-react'

const ICONS = {
  'Command Center': LayoutDashboard,
  Invoices: FileText,
  '90-Day Forecast': TrendingUp,
  'What-If Simulator': SlidersHorizontal,
}

export default function Sidebar({ tabs, activeTab, onSelect }) {
  return (
    <aside className="w-64 min-h-screen bg-[#0F172A] text-white p-6">
      <div className="mb-8">
        <h1 className="text-xl font-bold">StudioPulse</h1>
        <p className="text-slate-400 text-sm">Arjun Rao Design Studio</p>
      </div>
      <nav className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = ICONS[tab]
          const active = tab === activeTab
          return (
            <button
              key={tab}
              onClick={() => onSelect(tab)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors ${
                active
                  ? 'bg-slate-800 text-white'
                  : 'text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              {Icon && <Icon size={18} />}
              {tab}
            </button>
          )
        })}
      </nav>
    </aside>
  )
}
