import { createContext, useContext, useEffect, useReducer } from 'react'
import { defaultState, STORAGE_KEY } from './data/defaults.js'

const StoreContext = createContext(null)

export const TODAY = '2026-11-21'

export function nextInvoiceId(invoices) {
  let max = 0
  let matched = false
  for (const inv of invoices) {
    const m = /^INV-(\d+)$/.exec(inv.id ?? '')
    if (m) {
      matched = true
      max = Math.max(max, Number(m[1]))
    }
  }
  return matched ? 'INV-' + (max + 1) : 'INV-' + (invoices.length + 101)
}

function daysBetween(a, b) {
  const toUTC = (iso) => {
    const [y, m, d] = iso.split('-').map(Number)
    return Date.UTC(y, m - 1, d)
  }
  return Math.round((toUTC(b) - toUTC(a)) / 86400000)
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultState
    const state = JSON.parse(raw)
    if (Array.isArray(state.upcomingBills)) {
      state.upcomingBills = state.upcomingBills.map((bill, index) => {
        let next = bill
        if (next.id == null) next = { ...next, id: 'BILL-' + (index + 1) }
        if (next.paid == null) next = { ...next, paid: false }
        return next
      })
    }
    return state
  } catch {
    return defaultState
  }
}

function reducer(state, action) {
  switch (action.type) {
    case 'MARK_PAID': {
      const id = action.payload?.id
      const invoice = state.invoices.find((inv) => inv.id === id)
      if (!invoice || invoice.status === 'Paid') return state
      return {
        ...state,
        cashOnHand: state.cashOnHand + invoice.amount,
        invoices: state.invoices.map((inv) =>
          inv.id === id ? { ...inv, status: 'Paid', timelineText: 'Paid today' } : inv
        ),
      }
    }
    case 'ADD_INVOICE': {
      const p = action.payload ?? {}
      const id = nextInvoiceId(state.invoices)
      const amount = Number(p.amount)
      const avgDelayDays = Number(p.avgDelayDays) || 0
      let status
      let timelineText
      if (p.dueDate < TODAY) {
        const n = daysBetween(p.dueDate, TODAY)
        status = 'Overdue'
        timelineText = `Overdue by ${n} ${n === 1 ? 'day' : 'days'}`
      } else if (p.dueDate === TODAY) {
        status = 'Pending'
        timelineText = 'Due today'
      } else {
        const n = daysBetween(TODAY, p.dueDate)
        status = 'Pending'
        timelineText = `Due in ${n} ${n === 1 ? 'day' : 'days'}`
      }
      const newInvoice = {
        id,
        client: p.client,
        company: p.company,
        project: p.project,
        amount,
        dueDate: p.dueDate,
        status,
        timelineText,
        avgDelayDays,
      }
      return { ...state, invoices: [newInvoice, ...state.invoices] }
    }
    case 'ADD_BILL': {
      const p = action.payload ?? {}
      const bill = {
        id: 'BILL-' + Date.now(),
        name: p.name,
        amount: Number(p.amount),
        dueDate: p.dueDate,
        paid: false,
      }
      return { ...state, upcomingBills: [...state.upcomingBills, bill] }
    }
    case 'PAY_BILL': {
      const id = action.payload?.id
      const bill = state.upcomingBills.find((b) => b.id === id)
      if (!bill || bill.paid) return state
      return {
        ...state,
        cashOnHand: state.cashOnHand - bill.amount,
        upcomingBills: state.upcomingBills.map((b) =>
          b.id === id ? { ...b, paid: true } : b
        ),
      }
    }
    case 'RESET':
      return defaultState
    default:
      return state
  }
}

export function StoreProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, undefined, loadState)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  return (
    <StoreContext.Provider value={{ state, dispatch }}>
      {children}
    </StoreContext.Provider>
  )
}

export function useStore() {
  return useContext(StoreContext)
}
