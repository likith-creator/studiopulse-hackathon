// What-If cash-flow simulator with an auto-survival solver.
// Pure JS: no React, no side effects. All date math is UTC-based and
// works on zero-padded YYYY-MM-DD strings.

export const TODAY = '2026-11-21';

const DAY_MS = 24 * 60 * 60 * 1000;
const CHECKPOINT_STEP_DAYS = 3;
const MAX_RECOVERY_MOVES = 3;
const EARLY_PAY_DISCOUNT = 0.03;
const DEFER_DAYS = 14;

function normDate(value) {
  return value ? String(value).slice(0, 10) : '';
}

function parseDate(value) {
  const [y, m, d] = normDate(value).split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatDate(ms) {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function addDays(dateStr, days) {
  return formatDate(parseDate(dateStr) + days * DAY_MS);
}

function inr(n) {
  return '₹' + new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 }).format(n);
}

function sumAmounts(items) {
  return items.reduce((total, item) => total + item.amount, 0);
}

// Returns the first item with the largest amount (ties keep the earlier one).
function largestBy(items) {
  let best = null;
  for (const item of items) {
    if (!best || item.amount > best.amount) best = item;
  }
  return best;
}

function buildRecoveryMoves(simulatedLowest, invoices, upcomingBills) {
  const moves = [];
  const unpaidInvoices = invoices.filter((inv) => inv.status !== 'Paid');

  // (a) Chase the largest unpaid invoice now.
  const chaseSource = largestBy(unpaidInvoices);
  if (chaseSource) {
    const amount = chaseSource.amount;
    const newLowestBalance = simulatedLowest.balance + amount;
    moves.push({
      type: 'chase',
      title: 'Immediate Collection',
      invoiceId: chaseSource.id,
      client: chaseSource.client,
      company: chaseSource.company,
      cashGain: amount,
      newLowestBalance,
      targetInvoice: chaseSource.raw,
      detail:
        `Collect ${inr(amount)} from ${chaseSource.client || 'the client'} today. ` +
        `Lowest balance rises from ${inr(simulatedLowest.balance)} to ${inr(newLowestBalance)}.`,
    });
  }

  // (b) Offer a 3% early-pay discount on the largest Pending invoice.
  const discountSource = largestBy(unpaidInvoices.filter((inv) => inv.status === 'Pending'));
  if (discountSource) {
    const amount = discountSource.amount;
    const cashGain = Math.round(amount * (1 - EARLY_PAY_DISCOUNT));
    const cost = Math.round(amount * EARLY_PAY_DISCOUNT);
    moves.push({
      type: 'discount',
      title: '3% Early-Pay Incentive',
      invoiceId: discountSource.id,
      client: discountSource.client,
      company: discountSource.company,
      cashGain,
      cost,
      targetInvoice: discountSource.raw,
      detail:
        `Offer ${discountSource.client || 'the client'} 3% off to pay ${inr(amount)} now. ` +
        `You receive ${inr(cashGain)} and give up ${inr(cost)}.`,
    });
  }

  // (c) Defer the largest unpaid non-rent bill by 14 days.
  const deferSource = largestBy(
    upcomingBills.filter((bill) => !bill.paid && !String(bill.name || '').includes('Rent'))
  );
  if (deferSource) {
    const amount = deferSource.amount;
    moves.push({
      type: 'defer',
      title: `Defer Non-Rent Bill by ${DEFER_DAYS} Days`,
      billName: deferSource.name,
      cashRelief: amount,
      targetBill: deferSource.raw,
      detail:
        `Push ${deferSource.name || 'this bill'} (${inr(amount)}) back ${DEFER_DAYS} days ` +
        `to ease the dip by ${inr(amount)}.`,
    });
  }

  return moves.slice(0, MAX_RECOVERY_MOVES);
}

export function runWhatIfSimulation({
  cashOnHand,
  invoices,
  upcomingBills,
  delayMap = {},
  horizonDays = 60,
} = {}) {
  const horizonEnd = addDays(TODAY, horizonDays);
  const opening = Number(cashOnHand) || 0;
  const delays = delayMap || {};

  const unpaidInvoices = (invoices || [])
    .filter((inv) => inv && inv.status !== 'Paid' && normDate(inv.dueDate))
    .map((inv) => {
      const dueDate = normDate(inv.dueDate);
      const extra = Math.max(0, Number(delays[inv.id]) || 0);
      const baselineDate = dueDate < TODAY ? TODAY : dueDate;
      const simulatedDate =
        dueDate < TODAY ? addDays(TODAY, extra) : addDays(dueDate, extra);
      return {
        id: inv.id,
        client: inv.client || inv.name || 'Invoice',
        company: inv.company,
        status: inv.status,
        amount: Number(inv.amount) || 0,
        dueDate,
        extraDelay: extra,
        baselineDate,
        simulatedDate,
        raw: inv,
      };
    })
    .filter((inv) => inv.baselineDate <= horizonEnd);

  const unpaidBills = (upcomingBills || [])
    .filter((bill) => bill && !bill.paid && normDate(bill.dueDate))
    .map((bill) => ({
      name: bill.name || 'Bill',
      amount: Number(bill.amount) || 0,
      dueDate: normDate(bill.dueDate),
      // Overdue bills are treated as due on TODAY, matching the balance math.
      effDate: normDate(bill.dueDate) < TODAY ? TODAY : normDate(bill.dueDate),
      paid: bill.paid,
      raw: bill,
    }))
    .filter((bill) => bill.dueDate <= horizonEnd);

  // Checkpoints: TODAY, horizonEnd, every 3 days, bill due dates, and every
  // inflow's baseline and simulated date.
  const checkpointSet = new Set([TODAY, horizonEnd]);
  for (let k = CHECKPOINT_STEP_DAYS; k <= horizonDays; k += CHECKPOINT_STEP_DAYS) {
    checkpointSet.add(addDays(TODAY, k));
  }
  unpaidBills.forEach((bill) => checkpointSet.add(bill.effDate));
  unpaidInvoices.forEach((inv) => {
    if (inv.baselineDate <= horizonEnd) checkpointSet.add(inv.baselineDate);
    if (inv.simulatedDate <= horizonEnd) checkpointSet.add(inv.simulatedDate);
  });
  const dates = [...checkpointSet].sort();

  const points = dates.map((date) => {
    const baselineInflows = unpaidInvoices.filter((inv) => inv.baselineDate === date);
    const simulatedInflows = unpaidInvoices.filter((inv) => inv.simulatedDate === date);
    const outflows = unpaidBills.filter((bill) => bill.effDate === date);
    const baselineInflowTotal = sumAmounts(
      unpaidInvoices.filter((inv) => inv.baselineDate <= date)
    );
    const simulatedInflowTotal = sumAmounts(
      unpaidInvoices.filter((inv) => inv.simulatedDate <= date)
    );
    const outflowTotal = sumAmounts(unpaidBills.filter((bill) => bill.effDate <= date));
    return {
      date,
      baselineBalance: opening + baselineInflowTotal - outflowTotal,
      simulatedBalance: opening + simulatedInflowTotal - outflowTotal,
      baselineInflows,
      simulatedInflows,
      outflows,
    };
  });

  let baseLow = points[0];
  let simLow = points[0];
  for (const p of points) {
    if (p.baselineBalance < baseLow.baselineBalance) baseLow = p;
    if (p.simulatedBalance < simLow.simulatedBalance) simLow = p;
  }
  const baselineLowest = { date: baseLow.date, balance: baseLow.baselineBalance };
  const simulatedLowest = { date: simLow.date, balance: simLow.simulatedBalance };

  const crunchPoint = points.find((p) => p.simulatedBalance < 0);
  const firstCrunchDate = crunchPoint ? crunchPoint.date : null;
  const hasCrunch = firstCrunchDate !== null;

  const shortfallAmount = Math.max(0, -simulatedLowest.balance);

  const recoveryMoves = hasCrunch
    ? buildRecoveryMoves(simulatedLowest, unpaidInvoices, unpaidBills)
    : [];

  return {
    points,
    baselineLowest,
    simulatedLowest,
    firstCrunchDate,
    hasCrunch,
    shortfallAmount,
    recoveryMoves,
    horizonDays,
    horizonEnd,
    totalInflow: sumAmounts(unpaidInvoices.filter((inv) => inv.baselineDate <= horizonEnd)),
    totalOutflow: sumAmounts(unpaidBills),
  };
}
