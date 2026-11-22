# StudioPulse — Financial Back Office for Creative Studios

StudioPulse is a deterministic financial operations workspace for solo freelance designers and 1–5 person creative studios in India. It is modelled on Arjun Rao Design Studio, Bengaluru. It turns scattered deal chat, overdue receivables and upcoming bills into one cash-position view, then stress-tests that view against late payments. It runs entirely in the browser, needs no API keys, and formats every amount in INR.

> **Judge's note:** the app works fully offline with no keys. The only optional network feature is AI Deep Parse, which uses a Gemini key you supply and falls back to the local parser on any error.

---

## The Problem & Business Viability

Creative studios lose money in three predictable ways:

1. **Deals are captured in unstructured chat and voice.** A rate agreed on WhatsApp or in a voice note never becomes an invoice unless someone retypes it.
2. **Due dates on printed invoices create an illusion of cash.** Chronic late payers make a ₹65,000 invoice "due in 30 days" look like money in the bank, when it may not arrive for months.
3. **Chasing is manual, and double-billing is easy to miss.** Founders chase payments by hand, and a payment confirmed over chat can be billed a second time.

### Unit Economics

| Dimension | Position |
|---|---|
| Target customer | Solo freelance designers and 1–5 person creative studios in India |
| Pricing | ₹499/month Solo Plan |
| Time saved | About 4.5 hours a week (not yet measured) |
| ROI | One overdue ₹65,000 invoice recovered pays for about 130 months (roughly 10.9 years) of the ₹499 plan |

---

## Core Capabilities

| Module | What it solves | Deterministic logic |
|---|---|---|
| Command Center & Morning Briefing | Shows whether this month's cash covers this month's bills | Cash, bills, shortfall and overdue totals computed directly from seeded state |
| Live Mic-to-Invoice & WhatsApp Parser | Turns a spoken or pasted deal into a structured invoice | Rule-based parser for amounts, dates and intents |
| Follow-Up Studio & UPI Checkout | Chases overdue clients and records payment | Message templates and a UPI checkout that dispatches `MARK_PAID` |
| 90-Day Forecast | Shows when cash will arrive and when it will run short | Day-by-day projection of receivables and bills |
| What-If Stress Simulator | Tests the plan against late payment | Scenario engine with ranked recovery moves |
| GST Invoice Print | Produces a printable, GST-formatted invoice | Fixed tax split derived from the invoice total |
| Ledger & Bills | Tracks every receivable and upcoming bill | Status-based totals across the ledger |

**Command Center**
- Shows ₹48,500 of bank cash against ₹68,500 of upcoming bills.
- Reports a ₹20,000 shortfall (₹68,500 − ₹48,500).
- Shows ₹1,38,000 overdue across 3 invoices.
- Presents these four KPI cards: bank balance, upcoming bills, shortfall and overdue receivables.

**Morning Briefing**
- Summarises the day's priorities in three sub-cards.
- Is collapsed by default; expand it to read the full briefing.
- Includes the SaaS ROI card, which expresses the plan price against recovered invoices.

**Live Mic-to-Invoice & WhatsApp Parser**
- Uses the Web Speech API (`SpeechRecognition` or `webkitSpeechRecognition`) with `lang` set to `en-IN`, exposed as "Speak Deal".
- Shows an amber notice in browsers without speech recognition support.
- Parses amounts such as `45k`, `45 thousand`, `1.5 lakh`, `1.5L`, `2 lakhs`, `one lakh fifty thousand` (₹1,50,000), `Rs`, `₹`, `INR` and comma-separated numbers.
- Parses dates in `YYYY-MM-DD`, `DD/MM/YYYY`, month-name and relative forms.
- Recognises three intents: `create_invoice`, `mark_paid` and `outgoing_expense`.

**Follow-Up Studio & UPI Checkout**
- The follow-up drawer prepares a reminder for each overdue client.
- UPI checkout offers GPay, PhonePe, Paytm and BHIM UPI.
- Verification takes 800 ms and returns UTR `#4298104921`.
- A successful checkout dispatches `MARK_PAID`.

**90-Day Forecast**
- Projects bank cash over 90 days from receivables and bills.
- The Compare Reality toggle overlays the reality curve on the base projection.

**What-If Stress Simulator**
- The "Bad Day: 5 Clients +20 Days Late" scenario delays five invoices by 20 days against ₹48,500 of cash.
- The first negative balance falls on 2026-12-10, at −₹8,000.
- Recovery moves are ranked by impact:
  - Chase Aarav Mehta: +₹65,000.
  - 3% Early-Pay Incentive: +₹48,500, at a cost of 3%.
  - Defer Non-Rent Bill 14 days: +₹22,000 (Junior Motion Designer).
- Deferral length is set by `DEFER_DAYS = 14` in `src/utils/whatIfSimulator.js`.

**GST Invoice Print**
- Uses GSTIN `29AABCA1234F1Z5`, Place of Supply Karnataka (`29`) and SAC `998314`.
- Treats the 18% GST as inclusive, split into CGST 9% and SGST 9%.
- The grand total equals the invoice amount.

**Ledger & Bills**
- Lists all six seeded invoices and four upcoming bills.
- Paying INV-101 takes bank balance from ₹48,500 to ₹1,13,500.

> **Double-Billing Smart Guard:** when a pasted message describes a payment that has already been received (for example, "bhej diye" or "UPI se"), the parser raises a `mark_paid` intent and checks it against the ledger before creating anything. This blocks a second invoice for money that has already arrived.

> **Honesty notes:** the forecast, simulator and ROI figures are deterministic calculations on seeded data, not predictions from a model. The 4.5-hour time saving has not been measured.

---

## 90-Second Judge Walkthrough

1. **Open Command Center.** Note the bank balance of ₹48,500 and the bills total of ₹68,500.
2. **Read the Morning Briefing.** It is collapsed by default, so expand it.
3. **Note the ₹20,000 shortfall** shown on the KPI cards.
4. **Mark Paid on INV-101** (Aarav Mehta, ₹65,000). Watch Bank Balance move from ₹48,500 to ₹1,13,500.
5. **Open Invoices** and paste this message into the WhatsApp parser:
   > "Arjun bhai, Rohan Verma (TechSpark Labs) ne 28k bhej diye UPI se just now for pitch deck."

   The Double-Billing Smart Guard flags it as a payment already received.
6. **Open What-If Simulator** and press **"Bad Day: 5 Clients +20 Days Late."** The result shows a −₹8,000 shortfall on 10 December and the ranked recovery moves.
7. **Open 90-Day Forecast** and toggle **Compare Reality** to overlay the reality curve.
8. **Use PDF on an invoice** to open the GST invoice print view.
9. **Press Reset Demo** at the top right to restore the seeded state.

---

## Quickstart (No API Keys Required)

Requires Node.js and npm.

```bash
git clone https://github.com/likith-creator/studiopulse-hackathon.git
cd studiopulse-hackathon
npm install
npm run dev
```

Open the local URL printed by `npm run dev` in Chrome or Edge. Voice capture uses the Web Speech API, which works best in these browsers.

To create a production build:

```bash
npm run build
```

**Optional:** AI Deep Parse needs a Gemini API key. Enter it in the app, and it is stored in `localStorage` under `studiopulse-gemini-key`. The app works without it.

**Dependencies**
- Runtime: `react` ^18.3.1, `react-dom` ^18.3.1, `lucide-react` ^0.441.0.
- Development: `vite` ^5.4.0, `@vitejs/plugin-react` ^4.3.1, `tailwindcss` ^3.4.10, `postcss` ^8.4.41, `autoprefixer` ^10.4.20.
- Scripts: `dev`, `build`, `preview`.

---

## Architecture

```text
src/
├── components/
│   ├── ClientCheckoutModal.jsx
│   ├── ComingSoon.jsx            (retired, not imported)
│   ├── FollowUpDrawer.jsx
│   ├── ForecastView.jsx
│   ├── InvoicePrintModal.jsx
│   ├── KpiCards.jsx
│   ├── MorningBriefing.jsx
│   ├── NewInvoiceModal.jsx
│   ├── PriorityAlert.jsx
│   ├── ReceivablesLedger.jsx
│   ├── Sidebar.jsx               (retired, not imported)
│   ├── Toast.jsx
│   ├── TopBar.jsx                (retired, not imported)
│   ├── UpcomingBillsPanel.jsx
│   ├── WhatIfSimulator.jsx
│   └── WhatsAppParserPanel.jsx
├── utils/
│   ├── cashForecast.js
│   ├── format.js
│   ├── whatIfSimulator.js
│   └── whatsappParser.js
├── data/
│   └── defaults.js
├── store.jsx
├── App.jsx
├── index.css
└── main.jsx
```

All application state lives in one reducer in `src/store.jsx`. It handles five actions: `MARK_PAID`, `ADD_INVOICE`, `ADD_BILL`, `PAY_BILL` and `RESET`. Seed data comes from `src/data/defaults.js`, and state persists to `localStorage` under the key `studiopulse-state`. Reset Demo restores the seed values. There is no backend, and the UI is composed in `src/App.jsx` with four tabs: Command Center, Invoices, 90-Day Forecast and What-If Simulator.

---

## Engineering Log: 16 Slices

| Slice | Scope |
|---|---|
| 1 | App shell, receivables ledger, Mark Paid |
| 2 | KPI cards and priority alert |
| 3 | New Invoice modal |
| 4 | WhatsApp parser |
| 5 | Follow-up drawer |
| 6 | Upcoming bills panel |
| 7 | 90-day forecast |
| 8 | Reality curve |
| 9 | What-If simulator |
| 10 | Morning briefing and ROI card |
| 11 | UPI checkout |
| 12 | Voice capture |
| 13 | GST invoice print |
| 14 | Visual overhaul |
| 15 | Breathing room |
| 16 | SVG logo and avatars |

---

## Limitations & Honest Notes

- **No backend or authentication.** Anyone using the browser has full access to the data.
- **Data lives only in the browser.** Clearing site data or switching browsers removes it.
- **No automated test suite.** Behaviour is checked by build output and manual use.
- **The base forecast counts overdue invoices as cash from day one.** This is optimistic, and the What-If Simulator exists to test that assumption.
- **The printed QR block is decorative.** It does not scan to anything.
- **GSTIN, address and email on the invoice are fixed sample text.** They are not taken from user input.
- **The 270× ROI figure is the brief's own claim.** ₹499 × 270 = ₹1,34,730, which exceeds the largest seed invoice (₹65,000), so it depends on recovering more than one invoice.
- **The 4.5-hour weekly saving is unmeasured.**

---

## Verification

- `npm run build` passes with zero errors and zero warnings as of the last run.
- There is no automated test suite.
- UI behaviour is verified manually in the browser.
