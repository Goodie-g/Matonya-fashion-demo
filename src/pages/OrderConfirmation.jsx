import { Link, useLocation } from 'react-router-dom'
import { CheckCircle2 } from 'lucide-react'
import { PAYMENT_METHODS, BRAND } from '../lib/constants'
import { formatPrice } from '../lib/format'

export default function OrderConfirmation() {
  const { state } = useLocation()

  if (!state?.orderNumber) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl mb-3">No order to show</h1>
        <Link to="/shop" className="text-sm font-semibold uppercase tracking-wider underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  const method = PAYMENT_METHODS.find(m => m.id === state.paymentMethod)

  return (
    <div className="mx-auto max-w-lg px-6 py-24 text-center">
      <CheckCircle2 size={48} strokeWidth={1.5} className="mx-auto mb-6 text-success" />
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
        Order confirmed
      </p>
      <h1 className="text-3xl mb-4">Asante, {state.customerName?.split(' ')[0]}!</h1>
      <p className="text-sm text-smoke mb-2">
        Your order <span className="font-semibold text-ink">{state.orderNumber}</span> has
        been received.
      </p>
      <p className="text-sm text-smoke mb-8">
        Total: <span className="font-semibold text-ink">{formatPrice(state.total)}</span>
        {' '}· {method?.label}
      </p>

      <div className="bg-sand p-6 text-left text-sm text-smoke leading-relaxed mb-8">
        {state.paymentMethod === 'cod' ? (
          <p>
            Our team will call you shortly to confirm your order and delivery time.
            Please have <span className="font-semibold text-ink">{formatPrice(state.total)}</span> ready
            when your order arrives.
          </p>
        ) : (
          <p>
            Our team will call you shortly to confirm your order, then share our{' '}
            {method?.label} payment details. Your order ships once payment is confirmed.
          </p>
        )}
        <p className="mt-3">
          Questions? Call or WhatsApp us on{' '}
          <a href={`https://wa.me/${BRAND.whatsapp}`} className="underline text-ink">
            {BRAND.phone}
          </a>.
        </p>
      </div>

      <div className="flex gap-4 justify-center">
        <Link
          to="/shop"
          className="px-8 py-3.5 bg-accent text-white text-sm font-semibold uppercase tracking-wider"
        >
          Continue Shopping
        </Link>
        <Link
          to="/account"
          className="px-8 py-3.5 border border-ink text-sm font-semibold uppercase tracking-wider"
        >
          My Orders
        </Link>
      </div>
    </div>
  )
}
