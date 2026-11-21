import { CheckCircle2 } from 'lucide-react'

export default function Toast({ message }) {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-[#0F172A] text-white rounded-lg shadow-lg px-4 py-3 text-sm">
      <CheckCircle2 size={18} className="text-emerald-400" />
      <span>{message}</span>
    </div>
  )
}
