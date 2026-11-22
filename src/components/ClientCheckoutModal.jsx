import { useState, useEffect, useRef } from 'react';
import { BadgeCheck, CheckCircle2, Loader2, X } from 'lucide-react';
import { useStore } from '../store.jsx';
import { formatINR } from '../utils/format.js';

const APPS = ['GPay', 'PhonePe', 'Paytm', 'BHIM UPI'];

const APP_DOT = { GPay: 'bg-blue-500', PhonePe: 'bg-violet-600', Paytm: 'bg-sky-500', 'BHIM UPI': 'bg-orange-500' };

export default function ClientCheckoutModal({ invoice, onClose, onFinish }) {
  const { dispatch } = useStore();
  const [selectedApp, setSelectedApp] = useState('GPay');
  const [phase, setPhase] = useState('ready'); // 'ready' | 'processing' | 'success'
  const timerRef = useRef(null);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === 'Escape' && phase !== 'processing') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [phase, onClose]);

  function handleSimulate() {
    setPhase('processing');
    timerRef.current = setTimeout(() => {
      dispatch({ type: 'MARK_PAID', payload: { id: invoice.id } });
      setPhase('success');
    }, 800);
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/70 p-4"
      onClick={(e) => {
        e.stopPropagation();
        if (e.target === e.currentTarget && phase !== 'processing') onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Client UPI checkout"
        className="w-full max-w-sm overflow-hidden rounded-3xl bg-white shadow-2xl"
      >
        <div className="relative bg-[#0F172A] p-5 text-white">
          <div className="flex items-center gap-2">
            <BadgeCheck className="h-5 w-5 text-emerald-400" />
            <span className="font-semibold">Arjun Rao Design Studio</span>
          </div>
          <p className="mt-1 text-xs text-slate-300">UPI ID: arjunrao@okicici • Secured by StudioPulse Pay</p>
          <button
            type="button"
            aria-label="Close"
            disabled={phase === 'processing'}
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-300 hover:text-white disabled:opacity-40"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-5 p-5">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
            <p className="text-sm text-slate-500">{`${invoice.id} • ${invoice.project}`}</p>
            <p className="mt-1 text-sm text-slate-700">{`Billed to: ${invoice.client} (${invoice.company})`}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{formatINR(invoice.amount)}</p>
          </div>

          {phase === 'ready' && (
            <>
              <div role="radiogroup" aria-label="Choose UPI app" className="flex flex-wrap gap-2">
                {APPS.map((app) => (
                  <button
                    key={app}
                    type="button"
                    role="radio"
                    aria-checked={selectedApp === app}
                    onClick={() => setSelectedApp(app)}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium ${
                      selectedApp === app
                        ? 'border-slate-900 bg-slate-900 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <span aria-hidden="true" className={`h-2 w-2 rounded-full ${APP_DOT[app]}`} />
                    {app}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={handleSimulate}
                className="w-full rounded-xl bg-emerald-600 py-3 text-base font-semibold text-white hover:bg-emerald-700"
              >
                {`Simulate Client Paying ${formatINR(invoice.amount)}`}
              </button>
            </>
          )}

          {phase === 'processing' && (
            <div role="status" className="flex flex-col items-center py-6 text-center">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="mt-4 text-sm text-slate-600">{`Verifying UPI collect request via ${selectedApp}...`}</p>
            </div>
          )}

          {phase === 'success' && (
            <div className="flex flex-col items-center py-2 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-10 w-10 text-emerald-600" />
              </div>
              <p className="mt-4 text-xl font-bold text-slate-900">Payment Successful!</p>
              <p className="mt-1 text-sm text-slate-500">UTR #4298104921</p>
              <p className="mt-1 text-sm text-slate-600">{`Paid via ${selectedApp}`}</p>
              <button
                type="button"
                onClick={() =>
                  onFinish(`UPI Received! ${formatINR(invoice.amount)} from ${invoice.client} credited to cash.`)
                }
                className="mt-6 w-full rounded-xl bg-slate-900 py-3 font-semibold text-white hover:bg-slate-800"
              >
                Back to StudioPulse Dashboard
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
