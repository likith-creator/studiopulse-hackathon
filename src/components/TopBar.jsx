import { useStore } from '../store.jsx'
import { formatINR } from '../utils/format.js'

export default function TopBar() {
  const { state, dispatch } = useStore()

  return (
    <header className="flex justify-between items-center px-8 py-4 bg-white border-b">
      <p className="text-slate-600">Saturday, Nov 21, 2026</p>
      <div className="flex items-center gap-4">
        <span className="bg-emerald-100 text-emerald-800 font-semibold rounded-full px-4 py-1.5">
          Cash on Hand: {formatINR(state.cashOnHand)}
        </span>
        <button
          onClick={() => dispatch({ type: 'RESET' })}
          className="border rounded-lg px-4 py-2 text-slate-600 hover:bg-slate-50"
        >
          Reset Demo Data
        </button>
      </div>
    </header>
  )
}
