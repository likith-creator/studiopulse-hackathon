import { useState, useEffect } from 'react';
import { X, QrCode, Copy, Send } from 'lucide-react';
import { formatINR } from '../utils/format.js';
import ClientCheckoutModal from './ClientCheckoutModal.jsx';

function getDefaultTone(invoice) {
  if (invoice.status === 'Pending') return 'friendly';
  const match = /(\d+)\s+day/.exec(invoice.timelineText || '');
  const days = match ? parseInt(match[1], 10) : 0;
  return days < 14 ? 'firm' : 'final';
}

function buildMessage(tone, invoice) {
  const client = invoice.client;
  const company = invoice.company;
  const id = invoice.id;
  const project = invoice.project;
  const amount = formatINR(invoice.amount);
  const timelineText = invoice.timelineText;
  const upi = 'arjunrao@okicici';
  const link = `https://pay.studiopulse.in/${invoice.id}`;

  if (tone === 'firm') {
    return `Hi ${client}, following up on invoice ${id} for ${project} (${amount}) with ${company}. It is now ${timelineText}. Please arrange payment via UPI ${upi} or at ${link} at the earliest. Let me know if there is any issue. Regards, Arjun Rao, Arjun Rao Design Studio`;
  }
  if (tone === 'final') {
    return `Dear ${client}, this is a final notice regarding invoice ${id} for ${project} (${amount}), ${timelineText}. Kindly clear the balance within 48 hours via UPI ${upi} or ${link}. Further work on ${company} projects will be paused until settled. Regards, Arjun Rao, Arjun Rao Design Studio`;
  }
  return `Hi ${client}, hope you're doing well! A quick reminder that invoice ${id} for ${project} (${amount}) is open — ${timelineText}. You can pay directly via UPI at ${upi} or here: ${link}. Thank you, Arjun Rao, Arjun Rao Design Studio`;
}

const TONES = [
  { key: 'friendly', label: 'Friendly Nudge' },
  { key: 'firm', label: 'Firm Professional' },
  { key: 'final', label: 'Final Notice' },
];

function FollowUpDrawer({ invoice, onClose, onShowToast }) {
  const [defaultTone] = useState(() => getDefaultTone(invoice));
  const [tone, setTone] = useState(defaultTone);
  const [message, setMessage] = useState(() => buildMessage(defaultTone, invoice));
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !checkoutOpen) onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, checkoutOpen]);

  const handleToneClick = (t) => {
    setTone(t);
    setMessage(buildMessage(t, invoice));
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      onShowToast("Reminder copied to clipboard!");
    } catch {
      onShowToast("Could not copy. Select the text manually.");
    }
  };

  const handleWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer');
    onShowToast("Opening WhatsApp reminder...");
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex justify-end" onClick={onClose}>
      <div
        className="h-full w-full max-w-lg bg-white shadow-xl flex flex-col overflow-y-auto p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h2 className="font-semibold text-lg">Payment Follow-Up Studio</h2>
            <span className="inline-block rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-700">
              {`${invoice.id} • ${invoice.client} • ${formatINR(invoice.amount)}`}
            </span>
          </div>
          <button type="button" aria-label="Close" onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {TONES.map((t) => (
            <button
              key={t.key}
              type="button"
              aria-pressed={tone === t.key}
              onClick={() => handleToneClick(t.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                tone === t.key
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <textarea
          rows={8}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-4 w-full rounded-lg border border-slate-300 p-3 text-sm"
        />

        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 flex gap-4">
          <div className="flex-1 space-y-1">
            <p className="font-semibold text-slate-900">Arjun Rao Design Studio</p>
            <p className="text-sm text-slate-500">{`${invoice.id} • ${invoice.project}`}</p>
            <p className="text-2xl font-bold">{formatINR(invoice.amount)}</p>
            <p className="text-sm text-slate-600">UPI ID: arjunrao@okicici</p>
          </div>
          <div className="flex flex-col items-center gap-1">
            <div className="h-20 w-20 flex-shrink-0 border-2 border-dashed border-slate-300 rounded-lg flex items-center justify-center">
              <QrCode className="h-8 w-8 text-slate-400" />
            </div>
            <span className="text-xs text-slate-500 w-20 text-center">Scan via GPay / PhonePe / Paytm</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setCheckoutOpen(true)}
          className="mt-3 w-full rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 hover:bg-emerald-100"
        >
          Launch Live Client Checkout →
        </button>

        <div className="flex gap-3 justify-end mt-auto pt-4">
          <button
            type="button"
            onClick={handleCopy}
            className="border border-slate-300 rounded-lg px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 inline-flex items-center gap-2"
          >
            <Copy className="h-4 w-4" />
            Copy Message
          </button>
          <button
            type="button"
            onClick={handleWhatsApp}
            className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Open in WhatsApp
          </button>
        </div>
        {checkoutOpen && (
          <ClientCheckoutModal
            invoice={invoice}
            onClose={() => setCheckoutOpen(false)}
            onFinish={(message) => {
              setCheckoutOpen(false);
              onShowToast(message);
              onClose();
            }}
          />
        )}
      </div>
    </div>
  );
}

export default FollowUpDrawer;
