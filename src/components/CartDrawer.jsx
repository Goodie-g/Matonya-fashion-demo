import { Link } from 'react-router-dom'
import { X, Minus, Plus } from 'lucide-react'
import { useCart } from '../context/CartContext'
import { FREE_DELIVERY_THRESHOLD } from '../lib/constants'
import { formatPrice } from '../lib/format'

export default function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, count, subtotal } = useCart()

  return (
    <>
      {isOpen && (
        <div onClick={closeCart} className="fixed inset-0 bg-black/30 z-[100]" />
      )}

      <div
        className={`fixed top-0 right-0 w-full max-w-[420px] h-screen bg-cream z-[101]
          flex flex-col shadow-2xl transition-transform duration-300
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="px-6 py-5 border-b border-linen flex justify-between items-center">
          <h2 className="font-display text-xl">Your Cart ({count})</h2>
          <button onClick={closeCart} className="p-1" aria-label="Close cart">
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {items.length === 0 ? (
            <p className="text-center text-smoke mt-12 text-sm">Your cart is empty.</p>
          ) : (
            <div className="flex flex-col gap-6">
              {items.map(item => (
                <div key={item.variantId} className="flex gap-4">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-[100px] object-cover bg-sand"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium mb-1">{item.name}</p>
                    <p className="text-xs text-smoke mb-1">{item.color} / {item.size}</p>
                    <p className="text-sm font-semibold">{formatPrice(item.price)}</p>
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center border border-linen">
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity - 1)}
                          className="px-2 py-1"
                          aria-label="Decrease quantity"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="text-xs w-6 text-center">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.variantId, item.quantity + 1)}
                          className="px-2 py-1"
                          aria-label="Increase quantity"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.variantId)}
                        className="text-xs text-sale underline"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="p-6 border-t border-linen">
            <div className="flex justify-between mb-2 text-sm">
              <span>Subtotal</span>
              <span className="font-semibold">{formatPrice(subtotal)}</span>
            </div>
            <p className="text-xs text-smoke mb-4">
              Delivery calculated at checkout. Free over {formatPrice(FREE_DELIVERY_THRESHOLD)}.
            </p>
            <Link
              to="/checkout"
              onClick={closeCart}
              className="block w-full text-center py-3.5 bg-accent text-white text-sm font-semibold uppercase tracking-wider mb-2"
            >
              Checkout
            </Link>
            <p className="text-[11px] text-smoke text-center">
              Cash on Delivery · M-Pesa · Tigo Pesa · Airtel Money
            </p>
          </div>
        )}
      </div>
    </>
  )
}
