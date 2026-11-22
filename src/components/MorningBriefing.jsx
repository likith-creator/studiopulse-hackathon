import { useState } from 'react';
import { Sparkles, ChevronUp, ChevronDown } from 'lucide-react';
import { useStore } from '../store.jsx';
import { formatINR } from '../utils/format.js';

export default function MorningBriefing({ onOpenSimulator }) {
  const { state } = useStore();
  const [expanded, setExpanded] = useState(false);

  const billsTotal = state.upcomingBills
    .filter((bill) => !bill.paid)
    .reduce((sum, bill) => sum + bill.amount, 0);
  const shortfall = Math.max(0, billsTotal - state.cashOnHand);

  const overdue = state.invoices.filter((inv) => inv.status === 'Overdue');
  const overdueTotal = overdue.reduce((sum, inv) => sum + inv.amount, 0);
  const overdueCount = overdue.length;

  if (!expanded) {
    return (
      <section className="flex items-center justify-between gap-4 rounded-2xl bg-slate-900 px-5 py-3.5 text-white">
        <div className="flex min-w-0 items-center gap-3 flex-wrap">
          <Sparkles className="h-4 w-4 shrink-0 text-indigo-300" />
          <span className="text-sm font-semibold">60-Second Morning Briefing</span>
          {shortfall === 0 ? (
            <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-200 ring-1 ring-inset ring-emerald-400/20">
              All bills covered
            </span>
          ) : (
            <span className="inline-flex items-center rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-200 ring-1 ring-inset ring-amber-400/20">
              {`${formatINR(shortfall)} bill shortfall`}
            </span>
          )}
          <span className="hidden text-xs text-slate-400 md:inline">• ₹499/mo Solo SaaS (270x ROI)</span>
        </div>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(true)}
          className="inline-flex h-8 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-white/10 px-3 text-xs font-medium text-white hover:bg-white/15 transition-colors"
        >
          Expand Briefing
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-800 p-6 text-white shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-slate-200">
          <Sparkles className="h-4 w-4" />
          60-SECOND MORNING BRIEFING • ARJUN RAO DESIGN STUDIO
        </span>
        <button
          type="button"
          aria-expanded={expanded}
          onClick={() => setExpanded(!expanded)}
          className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-xl border border-white/20 px-3.5 text-xs font-medium text-slate-100 hover:bg-white/10 transition-colors"
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

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-slate-300">Cash Runway Snapshot</h3>
          <p className="mt-2 text-sm text-slate-300">
            Cash on hand: <span className="font-semibold text-white tabular-nums">{formatINR(state.cashOnHand)}</span>
          </p>
          <p className="mt-1 text-sm text-slate-300">
            Upcoming bills: <span className="font-semibold text-white tabular-nums">{formatINR(billsTotal)}</span>
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

        <div className="flex flex-col justify-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-slate-300">Biggest Blind Spot Caught</h3>
          <p className="mt-2 text-sm text-slate-300">Overdue receivables</p>
          <p className="text-2xl font-semibold text-rose-300 tabular-nums">{formatINR(overdueTotal)}</p>
          <p className="text-sm text-slate-300">
            {`${overdueCount} overdue ${overdueCount === 1 ? 'invoice' : 'invoices'}`}
          </p>
          <button
            type="button"
            onClick={() => onOpenSimulator()}
            className="inline-flex h-9 items-center self-start whitespace-nowrap rounded-xl bg-indigo-600 px-3.5 text-xs font-semibold text-white shadow-sm hover:bg-indigo-700 transition-colors"
          >
            Run Bad-Day Stress Test →
          </button>
        </div>

        <div className="flex flex-col justify-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4">
          <h3 className="text-sm font-semibold text-slate-300">Why Switch From a Notebook? (SaaS ROI)</h3>
          <p className="mt-2 text-sm leading-relaxed text-slate-200">
            ₹499/mo Solo Plan • Saves ~4.5 hrs/week of manual WhatsApp chasing & prevents missed rent—recovering one ₹65,000 invoice pays for 10+ years of StudioPulse.
          </p>
        </div>
      </div>
    </section>
  );

}
