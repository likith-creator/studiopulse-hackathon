// Deterministic 30 / 60 / 90-day cash-flow projection engine.
// Pure JS: no React, no side effects. All date math is UTC-based and
// works on zero-padded YYYY-MM-DD strings.

export const TODAY = '2026-11-21';

const DAY_MS = 24 * 60 * 60 * 1000;

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

function daysBetween(from, to) {
  return Math.round((parseDate(to) - parseDate(from)) / DAY_MS);
}

function addDays(dateStr, days) {
  return formatDate(parseDate(dateStr) + days * DAY_MS);
}

function sumAmounts(events) {
  return events.reduce((total, e) => total + e.amount, 0);
}

function makeEvent(kind, source, label) {
  const date = normDate(source.dueDate);
  // Overdue items (dueDate before TODAY) are applied from the first point.
  const effDate = date < TODAY ? TODAY : date;
  const amount = Number(source.amount) || 0;
  return {
    kind,
    date,
    effDate,
    amount,
    label,
    signed: kind === 'inflow' ? amount : -amount,
  };
}

export function buildForecastSeries({
  cashOnHand,
  invoices,
  upcomingBills,
  horizonDays = 90,
} = {}) {
  const horizonEnd = addDays(TODAY, horizonDays);
  const opening = Number(cashOnHand) || 0;

  const inflowEvents = (invoices || [])
    .filter(
      (inv) =>
        inv &&
        inv.status !== 'Paid' &&
        normDate(inv.dueDate) &&
        normDate(inv.dueDate) <= horizonEnd
    )
    .map((inv) => makeEvent('inflow', inv, inv.client || inv.name || 'Invoice'));

  const outflowEvents = (upcomingBills || [])
    .filter(
      (bill) =>
        bill &&
        !bill.paid &&
        normDate(bill.dueDate) &&
        normDate(bill.dueDate) <= horizonEnd
    )
    .map((bill) => makeEvent('outflow', bill, bill.name || 'Bill'));

  const allEvents = [...inflowEvents, ...outflowEvents];

  // Checkpoints: TODAY, every 3 days, every event date, and the horizon end.
  const checkpointSet = new Set([TODAY, horizonEnd]);
  for (let k = 3; k <= horizonDays; k += 3) {
    checkpointSet.add(addDays(TODAY, k));
  }
  allEvents.forEach((e) => checkpointSet.add(e.effDate));
  const dates = [...checkpointSet].sort();

  const points = dates.map((date) => {
    // Each event's effDate is a checkpoint and checkpoints are de-duplicated,
    // so every event is counted on exactly one point.
    const inflows = inflowEvents.filter((e) => e.effDate === date);
    const outflows = outflowEvents.filter((e) => e.effDate === date);
    const runningInflow = sumAmounts(inflowEvents.filter((e) => e.effDate <= date));
    const runningOutflow = sumAmounts(outflowEvents.filter((e) => e.effDate <= date));
    return {
      date,
      balance: opening + runningInflow - runningOutflow,
      inflows,
      outflows,
      runningInflow,
      runningOutflow,
      dayInflows: inflows,
      dayOutflows: outflows,
      dayInflowAmount: sumAmounts(inflows),
      dayOutflowAmount: sumAmounts(outflows),
      cumulativeInflow: runningInflow,
      cumulativeOutflow: runningOutflow,
    };
  });

  let low = points[0];
  for (const p of points) {
    if (p.balance < low.balance) low = p;
  }
  const lowestPoint = { date: low.date, balance: low.balance };

  const crunchPoint = points.find((p) => p.balance < 0);
  const firstCrunchDate = crunchPoint ? crunchPoint.date : null;

  const milestones = [...allEvents]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .map((e) => {
      let runningPoint = points[0];
      for (const p of points) {
        if (p.date <= e.effDate) runningPoint = p;
      }
      return {
        date: e.date,
        kind: e.kind,
        label: e.label,
        amount: e.amount,
        signed: e.signed,
        runningBalance: runningPoint.balance,
      };
    });

  return {
    points,
    lowestPoint,
    firstCrunchDate,
    hasCrunch: firstCrunchDate !== null,
    totalExpectedInflow: sumAmounts(inflowEvents),
    totalExpectedOutflow: sumAmounts(outflowEvents),
    endingBalance: points[points.length - 1].balance,
    horizonDays,
    horizonEnd,
    milestones,
  };
}
