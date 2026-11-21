import { useState } from 'react';
import { Receipt } from 'lucide-react';
import { useStore } from '../store.jsx';
import { formatINR } from '../utils/format.js';

const TODAY = '2026-11-21';

function daysBetween(a, b) {
  const [ya, ma, da] = a.split('-').map(Number);
  const [yb, mb, db] = b.split('-').map(Number);
  const toA = Date.UTC(ya, ma - 1, da);
  const toB = Date.UTC(yb, mb - 1, db);
  return Math.round((toB - toA) / 86400000);
}

function dueBadge(dueDate) {
  const n = daysBetween(TODAY, dueDate);
  if (n === 0) return 'Due today';
  if (n > 0) return `Due in ${n} ${n === 1 ? 'day' : 'days'}`;
  return `Overdue by ${-n} ${-n === 1 ? 'day' : 'days'}`;
}

export default function UpcomingBillsPanel({ onShowToast }) {
  const { state, dispatch } = useStore();

  const unpaidTotal = state.upcomingBills
    .filter((bill) => !bill.paid)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const sorted = [...state.upcomingBills].sort((a, b) =>
    a.dueDate.localeCompare(b.dueDate)
  );

  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('2026-12-20');
  const [error, setError] = useState('');

  const resetForm = () => {
    setName('');
    setAmount('');
    setDueDate('2026-12-20');
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = name.trim();
    const amt = Number(amount);
    if (!trimmed || !(amt > 0) || !dueDate) {
      setError('Enter a bill name, an amount above 0, and a due date.');
      return;
    }
    dispatch({
      type: 'ADD_BILL',
      payload: { name: trimmed, amount: amt, dueDate },
    });
    onShowToast(`Added bill: ${trimmed} · ${formatINR(amt)}`);
    resetForm();
    setShowForm(false);
  };

  const handleCancel = () => {
    resetForm();
    setShowForm(false);
  };

  return (
    <section className="rounded-xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Receipt className="h-5 w-5" />
          <h2>Upcoming Studio Bills</h2>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-700">
            {formatINR(unpaidTotal)} unpaid
          </span>
        </div>
        <button
          type="button"
          onClick={() => setShowForm((open) => !open)}
          className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
        >
          {showForm ? 'Close' : '+ Add Bill'}
        </button>
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="mt-4 flex flex-wrap items-end gap-3"
        >
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Bill Name
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Figma Annual Plan"
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Amount in ₹
            <input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm text-slate-600">
            Due Date
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Save Bill
          </button>
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg border px-4 py-2 text-sm text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
          {error && <p className="w-full text-sm text-rose-600">{error}</p>}
        </form>
      )}

      <ul className="mt-6 divide-y divide-slate-100">
        {sorted.map((bill) => (
          <li key={bill.id} className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-900">{bill.name}</p>
              <p className="text-sm text-slate-500">
                {bill.dueDate} · {dueBadge(bill.dueDate)}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="font-semibold text-slate-900">
                {formatINR(bill.amount)}
              </span>
              {!bill.paid && (
                <button
                  type="button"
                  onClick={() => {
                    dispatch({ type: 'PAY_BILL', payload: { id: bill.id } });
                    onShowToast(
                      `Paid ${bill.name} · ${formatINR(bill.amount)} deducted from cash`
                    );
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"
                >
                  Pay Bill
                </button>
              )}
              {bill.paid && (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">
                  Paid
                </span>
              )}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
