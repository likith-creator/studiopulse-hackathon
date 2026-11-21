// Pure WhatsApp / Hinglish parser. No React imports.
const TODAY = '2026-11-21';
const DEFAULT_DUE = '2026-11-28';
const YEAR = 2026;

const MONTHS = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };
const MONTH_RE = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const WEEKDAY_RE = 'monday|tuesday|wednesday|thursday|friday|saturday|sunday';
const IGNORE_NAMES = ['arjun', 'hey', 'hi', 'hello', 'bhai', 'sir', 'bro', 'madam', 'raise', 'need', 'landing', 'invoice', 'please', 'approved', 'final', 'design', 'client', 'this', 'the', 'i', 'thanks', 'due', 'rs', 'inr'];
const PAID_PHRASES = ['bhej diye', 'paid', 'transferred', 'sent', 'upi se', 'neft done'];
const OUTGOING_PHRASES = ['ko dene hain', 'pay to', 'vendor bill', 'subscription'];
const PROJECT_RULES = [
  [/\blogo/, 'Logo Design'],
  [/brand identity/, 'Brand Identity'],
  [/\bbranding\b/, 'Brand Identity'],
  [/packag/, 'Packaging Design'],
  [/web ?site|web design/, 'Website Design'],
  [/landing ?page/, 'Landing Page'],
  [/ui\/ux/, 'UI/UX Design'],
  [/app design|mobile app/, 'App Design'],
  [/pitch ?deck/, 'Pitch Deck'],
  [/presentation/, 'Presentation Design'],
  [/social media/, 'Social Media Campaign'],
  [/\breel|\bvideo/, 'Video Content'],
  [/poster/, 'Poster Design'],
  [/brochure/, 'Brochure Design'],
  [/flyer/, 'Flyer Design'],
  [/illustration/, 'Illustration'],
  [/\b3d\b/, '3D Design'],
  [/motion graphics/, 'Motion Graphics'],
  [/banner/, 'Banner Design'],
  [/catalog/, 'Catalog Design'],
  [/\bmenu/, 'Menu Design'],
];
const UNIT_WORDS = { zero: 0, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19, a: 1, an: 1 };
const TENS_WORDS = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };
const UNIT_1_9 = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'];
const NUMBER_PHRASE = `(?:(?:${Object.keys(TENS_WORDS).join('|')})(?:[\\s-]+(?:${UNIT_1_9.join('|')}))?|${Object.keys(UNIT_WORDS).join('|')})`;
const NAME = "([A-Z][a-z]+(?:\\s+[A-Z][a-z]+)?)";

const pad = (n) => String(n).padStart(2, '0');
function toISO(y, m, d) {
  if (!m || !d) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;
  return `${y}-${pad(m)}-${pad(d)}`;
}
function addDays(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + n));
  return `${dt.getUTCFullYear()}-${pad(dt.getUTCMonth() + 1)}-${pad(dt.getUTCDate())}`;
}
function wordsToNumber(s) {
  return s.toLowerCase().split(/[\s-]+/).reduce((sum, w) => sum + (TENS_WORDS[w] ?? 0) + (UNIT_WORDS[w] ?? 0), 0);
}
const multiplier = (u) => (/^(k|thousand)$/i.test(u) ? 1000 : 100000);
const byIndex = (a, b) => a.index - b.index;

export function extractAmount(raw) {
  let work = raw
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}[\/-]\d{1,2}[\/-]\d{4}\b/g, ' ')
    .replace(/\b\d{1,2}\/\d{1,2}\b/g, ' ')
    .replace(/(\+91[\s-]?)?\b[6-9]\d{4}[\s-]?\d{5}\b/g, ' ')
    .replace(/\+\d{10,13}/g, ' ');
  const hits = [];
  for (const m of work.matchAll(/(?:₹|\brs\.?|\binr)\s*(\d[\d,]*(?:\.\d+)?)\s*(k|thousand|lakhs?|l)?(?![a-z])/gi)) {
    const value = parseFloat(m[1].replace(/,/g, '')) * (m[2] ? multiplier(m[2]) : 1);
    hits.push({ index: m.index, value, marked: true });
  }
  for (const m of work.matchAll(/(\d+(?:\.\d+)?)\s*(k|thousand|lakhs?|l)(?![a-z])/gi)) {
    hits.push({ index: m.index, value: parseFloat(m[1]) * multiplier(m[2]), marked: true });
  }
  const compoundSpans = [];
  const compoundRe = new RegExp(`\\b(${NUMBER_PHRASE})\\s+(lakhs?)(?:\\s+(?:and\\s+)?(${NUMBER_PHRASE})\\s+(thousand))?\\b`, 'gi');
  for (const m of work.matchAll(compoundRe)) {
    const value = wordsToNumber(m[1]) * 100000 + (m[3] ? wordsToNumber(m[3]) * 1000 : 0);
    hits.push({ index: m.index, value, marked: true });
    compoundSpans.push([m.index, m.index + m[0].length]);
  }
  const inCompound = (i) => compoundSpans.some(([s, e]) => i >= s && i < e);
  for (const m of work.matchAll(new RegExp(`\\b(${NUMBER_PHRASE})\\s+(thousand|lakhs?)\\b`, 'gi'))) {
    if (inCompound(m.index)) continue;
    hits.push({ index: m.index, value: wordsToNumber(m[1]) * multiplier(m[2]), marked: true });
  }
  for (const m of work.matchAll(/\d[\d,]*/g)) {
    const digits = m[0].replace(/,/g, '');
    if (/^\d{4,7}$/.test(digits) && Number(digits) !== YEAR) {
      hits.push({ index: m.index, value: Number(digits), marked: false });
    }
  }
  const marked = hits.filter((h) => h.marked).sort(byIndex);
  const bare = hits.filter((h) => !h.marked).sort(byIndex);
  const chosen = marked[0] ?? bare[0];
  return chosen && chosen.value > 0 ? Math.round(chosen.value) : null;
}

export function extractDate(raw) {
  const lower = raw.toLowerCase();
  const found = [];
  const add = (index, iso) => { if (iso) found.push({ index, iso }); };
  let m;
  if ((m = /\b(\d{4})-(\d{2})-(\d{2})\b/.exec(lower))) add(m.index, toISO(+m[1], +m[2], +m[3]));
  if ((m = /\b(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})\b/.exec(lower))) add(m.index, toISO(+m[3], +m[2], +m[1]));
  if ((m = /\b(\d{1,2})\/(\d{1,2})\b/.exec(lower))) add(m.index, toISO(YEAR, +m[2], +m[1]));
  if ((m = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(${MONTH_RE})\\b`).exec(lower))) add(m.index, toISO(YEAR, MONTHS[m[2].slice(0, 3)], +m[1]));
  if ((m = new RegExp(`\\b(${MONTH_RE})\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!\\s*\\d)`).exec(lower))) add(m.index, toISO(YEAR, MONTHS[m[1].slice(0, 3)], +m[2]));
  if ((m = /\btoday\b/.exec(lower))) add(m.index, TODAY);
  if ((m = /\btomorrow\b/.exec(lower))) add(m.index, addDays(TODAY, 1));
  if ((m = /\bin\s+(\d+|[a-z]+)\s+days?\b/.exec(lower))) {
    const n = /^\d+$/.test(m[1]) ? +m[1] : wordsToNumber(m[1]);
    if (n > 0) add(m.index, addDays(TODAY, n));
  }
  if ((m = /\bnext week\b/.exec(lower))) add(m.index, '2026-11-28');
  if ((m = /\b(end of (?:the )?month|month end)\b/.exec(lower))) add(m.index, '2026-11-30');
  found.sort(byIndex);
  return found[0]?.iso ?? null;
}

const isUsableName = (n) => {
  const first = n.split(/\s+/)[0];
  const lower = first.toLowerCase();
  if (IGNORE_NAMES.includes(lower)) return false;
  if (new RegExp(`^(${MONTH_RE}|${WEEKDAY_RE})$`).test(lower)) return false;
  if (PROJECT_RULES.some(([re]) => re.test(n.toLowerCase()))) return false;
  return true;
};

function findInvoice(lower, invoices) {
  for (const inv of invoices) {
    if (inv.client && lower.includes(inv.client.toLowerCase())) return inv;
  }
  for (const inv of invoices) {
    if (inv.company && lower.includes(inv.company.toLowerCase())) return inv;
  }
  for (const inv of invoices) {
    const first = (inv.client || '').split(/\s+/)[0].toLowerCase();
    const sameFirst = invoices.filter((x) => (x.client || '').split(/\s+/)[0].toLowerCase() === first);
    if (first && sameFirst.length === 1 && new RegExp(`\\b${first}\\b`).test(lower)) return inv;
  }
  return null;
}

function extractClient(raw) {
  const pats = [
    new RegExp(`[Ii] am\\s+${NAME}`),
    new RegExp(`[Ii]'m\\s+${NAME}`),
    new RegExp(`[Tt]his is\\s+${NAME}`),
    new RegExp(`[Mm]yself\\s+${NAME}`),
    new RegExp(`${NAME}\\s+here\\b`),
    new RegExp(`${NAME}\\s+from\\b`),
    new RegExp(`[Cc]lient:\\s*${NAME}`),
  ];
  for (const re of pats) {
    const m = re.exec(raw);
    if (m && isUsableName(m[1])) return m[1];
  }
  for (const m of raw.matchAll(new RegExp(NAME, 'g'))) {
    if (isUsableName(m[1])) return m[1];
  }
  return '';
}

function extractCompany(raw) {
  const paren = /\(([^)]+)\)/.exec(raw);
  if (paren) return paren[1].trim();
  const m = /\b(?:from|@|at|for)\s+([A-Z][\w&'-]*(?:\s+[A-Z][\w&'-]*)*)/.exec(raw);
  return m ? m[1].trim() : '';
}

function extractProject(raw) {
  const lower = raw.toLowerCase();
  for (const [re, label] of PROJECT_RULES) {
    if (re.test(lower)) return label;
  }
  const m = /\b(?:for|need|regarding)\s+([a-z]+(?:\s+[a-z]+){0,3})/.exec(raw);
  if (m) {
    return m[1].split(/\s+/).map((w) => w[0].toUpperCase() + w.slice(1)).join(' ');
  }
  return 'Design Project';
}

export function parseWhatsAppMessage(text = '', invoices = []) {
  const raw = String(text || '');
  const lower = raw.toLowerCase();
  const hasPaid = PAID_PHRASES.some((p) => new RegExp(`\\b${p}\\b`).test(lower));
  const isOutgoing = OUTGOING_PHRASES.some((p) => lower.includes(p));
  const openInvoices = invoices.filter((i) => i.status !== 'Paid');
  const amount = extractAmount(raw);
  const parsedDate = extractDate(raw);
  const isDefaultDate = !parsedDate;
  const dueDate = parsedDate ?? DEFAULT_DUE;

  if (hasPaid) {
    const matched = findInvoice(lower, openInvoices);
    if (matched) {
      return {
        intent: 'mark_paid',
        client: matched.client,
        company: matched.company,
        project: matched.project,
        amount: matched.amount,
        dueDate: matched.dueDate,
        matchedInvoice: matched,
        isDefaultDate,
        confidence: { clientDetected: true, amountDetected: amount !== null, dateDetected: !isDefaultDate },
      };
    }
  }

  const intent = isOutgoing ? 'outgoing_expense' : 'create_invoice';
  const known = findInvoice(lower, invoices);
  const client = known ? known.client : extractClient(raw);
  const company = known ? known.company : extractCompany(raw);
  return {
    intent,
    client,
    company,
    project: extractProject(raw),
    amount,
    dueDate,
    matchedInvoice: null,
    isDefaultDate,
    confidence: { clientDetected: !!client, amountDetected: amount !== null, dateDetected: !isDefaultDate },
  };
}
