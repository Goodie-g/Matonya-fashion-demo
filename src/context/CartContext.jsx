import { createContext, useContext, useEffect, useMemo, useState } from 'react'

const CartContext = createContext(null)
export const useCart = () => useContext(CartContext)

const STORAGE_KEY = 'matonya-cart'

// A cart line is keyed by variant_id — the exact sellable SKU —
// which is what checkout and stock deduction need.
function load() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || []
  } catch {
    return []
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(load)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  }, [items])

  const addItem = (line) => {
    setItems(prev => {
      const existing = prev.find(i => i.variantId === line.variantId)
      if (existing) {
        return prev.map(i =>
          i.variantId === line.variantId
            ? { ...i, quantity: i.quantity + line.quantity }
            : i
        )
      }
      return [...prev, line]
    })
    setIsOpen(true)
  }

  const updateQuantity = (variantId, quantity) => {
    if (quantity < 1) return
    setItems(prev => prev.map(i => (i.variantId === variantId ? { ...i, quantity } : i)))
  }

  const removeItem = (variantId) =>
    setItems(prev => prev.filter(i => i.variantId !== variantId))

  const clearCart = () => setItems([])

  const value = useMemo(() => ({
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    count: items.reduce((s, i) => s + i.quantity, 0),
    subtotal: items.reduce((s, i) => s + i.price * i.quantity, 0),
  }), [items, isOpen])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
