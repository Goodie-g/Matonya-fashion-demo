import { useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { usePlaceOrder } from '../hooks/useOrders'
import { buildDeliveryDefaults, saveDeliveryDetails } from '../lib/deliveryMemory'
import { PAYMENT_METHODS, TZ_REGIONS, deliveryFeeFor, FREE_DELIVERY_THRESHOLD } from '../lib/constants'
import { formatPrice } from '../lib/format'

// Tanzanian mobile: +2557XXXXXXXX, 07XXXXXXXX or 06XXXXXXXX
const tzPhone = /^(\+255|0)(6|7)\d{8}$/

const checkoutSchema = z.object({
  customerName: z.string().min(2, 'Please enter your full name'),
  phone: z.string().regex(tzPhone, 'Enter a valid Tanzanian number, e.g. 0712 345 678'),
  email: z.string().email('Enter a valid email').or(z.literal('')).optional(),
  region: z.string().min(1, 'Select your region'),
  city: z.string().min(2, 'Enter your city / district'),
  address: z.string().min(5, 'Enter your street address'),
  deliveryNotes: z.string().optional(),
  paymentMethod: z.enum(['cod', 'mpesa', 'tigopesa', 'airtelmoney']),
})

export default function Checkout() {
  const { items, subtotal, clearCart } = useCart()
  const { user, profile } = useAuth()
  const placeOrder = usePlaceOrder()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    watch,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(checkoutSchema),
    defaultValues: buildDeliveryDefaults(profile),
  })

  // Pre-fill contact details once the signed-in profile arrives,
  // but never overwrite anything the customer has already typed.
  useEffect(() => {
    if (profile && !isDirty) {
      reset(buildDeliveryDefaults(profile))
    }
  }, [profile, isDirty, reset])

  const region = watch('region')
  const paymentMethod = watch('paymentMethod')
  const deliveryFee = deliveryFeeFor(region, subtotal)
  const total = subtotal + deliveryFee

  const onSubmit = async (values) => {
    try {
      const result = await placeOrder.mutateAsync({
        ...values,
        items: items.map(i => ({ variantId: i.variantId, quantity: i.quantity })),
      })
      // Remember these details for the next checkout (localStorage here,
      // profile server-side via place_order).
      saveDeliveryDetails(values)
      clearCart()
      navigate('/order-confirmation', {
        state: {
          orderNumber: result.order_number,
          total: result.total,
          paymentMethod: values.paymentMethod,
          customerName: values.customerName,
        },
        replace: true,
      })
    } catch {
      // error rendered below from mutation state
    }
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl mb-3">Your cart is empty</h1>
        <p className="text-smoke text-sm mb-6">Add something to your cart before checking out.</p>
        <Link to="/shop" className="text-sm font-semibold uppercase tracking-wider underline">
          Continue shopping
        </Link>
      </div>
    )
  }

  const inputClass = 'w-full border border-linen bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'
  const errorClass = 'text-xs text-sale mt-1'

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-10">Checkout</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_400px] gap-12 items-start">
        <div className="space-y-10">
          {/* Contact */}
          <section>
            <h2 className="text-lg mb-5">Contact details</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="customerName">Full name</label>
                <input id="customerName" className={inputClass} {...register('customerName')} />
                {errors.customerName && <p className={errorClass}>{errors.customerName.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="phone">Phone (for delivery calls)</label>
                <input id="phone" placeholder="0712 345 678" className={inputClass} {...register('phone')} />
                {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="email">Email (optional)</label>
                <input id="email" type="email" className={inputClass} {...register('email')} />
                {errors.email && <p className={errorClass}>{errors.email.message}</p>}
              </div>
            </div>
            {!user && (
              <p className="text-xs text-smoke mt-3">
                Checking out as a guest.{' '}
                <Link to="/sign-up" className="underline">Create an account</Link> to track your orders.
              </p>
            )}
          </section>

          {/* Delivery */}
          <section>
            <h2 className="text-lg mb-5">Delivery address</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className={labelClass} htmlFor="region">Region</label>
                <select id="region" className={inputClass} {...register('region')}>
                  {TZ_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {errors.region && <p className={errorClass}>{errors.region.message}</p>}
              </div>
              <div>
                <label className={labelClass} htmlFor="city">City / District</label>
                <input id="city" placeholder="e.g. Kinondoni" className={inputClass} {...register('city')} />
                {errors.city && <p className={errorClass}>{errors.city.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="address">Street address</label>
                <input id="address" placeholder="Street, area, landmark" className={inputClass} {...register('address')} />
                {errors.address && <p className={errorClass}>{errors.address.message}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass} htmlFor="deliveryNotes">Delivery notes (optional)</label>
                <textarea
                  id="deliveryNotes"
                  rows={2}
                  placeholder="e.g. Call when you arrive at the gate"
                  className={inputClass}
                  {...register('deliveryNotes')}
                />
              </div>
            </div>
          </section>

          {/* Payment */}
          <section>
            <h2 className="text-lg mb-5">Payment</h2>
            <div className="space-y-3">
              {PAYMENT_METHODS.map(method => (
                <label
                  key={method.id}
                  className={`flex items-start gap-3 border p-4 cursor-pointer transition-colors ${
                    paymentMethod === method.id ? 'border-ink bg-sand' : 'border-linen'
                  }`}
                >
                  <input
                    type="radio"
                    value={method.id}
                    className="mt-1"
                    {...register('paymentMethod')}
                  />
                  <span>
                    <span className="block text-sm font-semibold">{method.label}</span>
                    <span className="block text-xs text-smoke mt-0.5">{method.description}</span>
                  </span>
                </label>
              ))}
            </div>
            <p className="text-xs text-smoke mt-3">
              Card payments coming soon — the checkout is designed to add a payment
              gateway without changing the order flow.
            </p>
          </section>
        </div>

        {/* Order summary */}
        <aside className="bg-sand p-6 lg:sticky lg:top-24">
          <h2 className="text-lg mb-5">Order summary</h2>
          <div className="space-y-4 mb-6">
            {items.map(item => (
              <div key={item.variantId} className="flex gap-3">
                <img src={item.image} alt="" className="w-14 h-[70px] object-cover bg-cream" />
                <div className="flex-1">
                  <p className="text-[13px] font-medium leading-snug">{item.name}</p>
                  <p className="text-xs text-smoke">{item.color} / {item.size} × {item.quantity}</p>
                </div>
                <p className="text-[13px] font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-linen pt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-smoke">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-smoke">Delivery ({region || '—'})</span>
              <span>{deliveryFee === 0 ? 'Free' : formatPrice(deliveryFee)}</span>
            </div>
            {deliveryFee > 0 && (
              <p className="text-[11px] text-smoke">
                Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}.
              </p>
            )}
            <div className="flex justify-between font-semibold text-base pt-2 border-t border-linen">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          {placeOrder.isError && (
            <p className="text-xs text-sale mt-4">
              {placeOrder.error?.message?.includes('Not enough stock')
                ? placeOrder.error.message
                : 'Could not place your order. Please try again.'}
            </p>
          )}

          <button
            type="submit"
            disabled={placeOrder.isPending}
            className="w-full mt-6 py-4 bg-accent text-white text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
          >
            {placeOrder.isPending ? 'Placing order…' : `Place Order — ${formatPrice(total)}`}
          </button>
        </aside>
      </form>
    </div>
  )
}
