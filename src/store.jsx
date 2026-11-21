import { createContext, useContext, useEffect, useReducer } from 'react'
import { defaultState, STORAGE_KEY } from './data/defaults.js'

const StoreContext = createContext(null)

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : defaultState
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
