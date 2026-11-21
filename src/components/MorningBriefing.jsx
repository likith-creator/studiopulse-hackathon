import { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { formatINR } from '../utils/format.js';

export default function MorningBriefing({ onOpenSimulator }) {
  const { state } = useStore();
  const [expanded, setExpanded] = useState(true);

  const billsTotal = state.upcomingBills
    .filter((bill) => !bill.paid)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const shortfall = Math.max(0, billsTotal - state.cashOnHand);

  const overdue = state.invoices.filter((inv) => inv.status === 'Overdue');
  const overdueTotal = overdue.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = overdue.length;

  return (
    <section className="rounded-xl bg-gradient-to-br from-slate-900 to-slate-800 p-5 text-white shadow-sm">
      <div className="flex items-center justify-between gap-4">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
          <Sparkles className="h-4 w-4" />
          60-SECOND MORNING BRIEFING • ARJUN RAO DESIGN STUDIO
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="inline-flex items-center gap-1 rounded-lg border border-white/20 px-3 py-1.5 text-sm font-medium text-slate-100 hover:bg-white/10"
        >
          {expanded ? (
            <>
              Hide Briefing
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              Show Morning Briefing
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </button>
      </div>

      {expanded && (
        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-slate-300">Cash Runway Snapshot</h3>
            <p className="mt-2 text-sm text-slate-300">
              Cash on hand: <span className="font-semibold text-white">{formatINR(state.cashOnHand)}</span>
            </p>
            <p className="mt-1 text-sm text-slate-300">
              Upcoming bills: <span className="font-semibold text-white">{formatINR(billsTotal)}</span>
            </p>
            <span
              className={`mt-3 inline-block rounded-full px-3 py-1 text-xs font-medium ${
                shortfall === 0 ? 'bg-emerald-400/20 text-emerald-200' : 'bg-amber-400/20 text-amber-200'
              }`}
            >
              {shortfall === 0
                ? 'Covers 100% of next 30-day bills'
                : `${formatINR(shortfall)} short of next 30-day bills — collect 1 overdue invoice`}
            </span>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-slate-300">Biggest Blind Spot Caught</h3>
            <p className="mt-2 text-sm text-slate-300">Overdue receivables</p>
            <p className="text-2xl font-semibold text-rose-300">{formatINR(overdueTotal)}</p>
            <p className="text-sm text-slate-300">
              {`${overdueCount} overdue ${overdueCount === 1 ? 'invoice' : 'invoices'}`}
            </p>
            <button
              type="button"
              onClick={() => onOpenSimulator()}
              className="mt-3 text-sm font-semibold text-sky-300 hover:text-sky-200 hover:underline"
            >
              Run Bad-Day Stress Test →
            </button>
          </div>

          <div className="rounded-lg bg-white/5 p-4">
            <h3 className="text-sm font-semibold text-slate-300">Why Switch From a Notebook? (SaaS ROI)</h3>
            <p className="mt-2 text-sm leading-relaxed text-slate-200">
              ₹499/mo Solo Plan • Saves ~4.5 hrs/week of manual WhatsApp chasing & prevents missed rent—a 270x ROI on recovering just one late invoice.
            </p>
          </div>
        </div>
      )}
    </section>
  );
}
