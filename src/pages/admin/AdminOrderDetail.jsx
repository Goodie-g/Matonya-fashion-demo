import { useParams, Link } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { useAdminOrder, useUpdateOrder } from '../../hooks/useAdmin'
import { ORDER_STATUSES } from '../../lib/constants'
import { formatDateTime, formatPrice } from '../../lib/format'

const PAYMENT_STATUSES = ['unpaid', 'pending', 'paid', 'refunded']

export default function AdminOrderDetail() {
  const { id } = useParams()
  const { data: order, isLoading } = useAdminOrder(id)
  const updateOrder = useUpdateOrder()

  if (isLoading) return <Spinner />
  if (!order) return <p className="text-smoke">Order not found.</p>

  const setStatus = (status) => updateOrder.mutate({ id: order.id, status })
  const setPaymentStatus = (payment_status) => updateOrder.mutate({ id: order.id, payment_status })

  return (
    <div>
      <Link to="/admin/orders" className="text-xs text-smoke underline">← All orders</Link>

      <div className="flex flex-wrap justify-between items-start gap-4 mt-3 mb-6">
        <div>
          <h2 className="font-display text-2xl">{order.order_number}</h2>
          <p className="text-xs text-smoke">Placed {formatDateTime(order.created_at)}</p>
        </div>
        <div className="flex gap-3">
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-smoke mb-1">
              Order status
            </label>
            <select
              value={order.status}
              onChange={e => setStatus(e.target.value)}
              disabled={updateOrder.isPending}
              className="border border-linen bg-white px-3 py-2 text-sm"
            >
              {ORDER_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-semibold uppercase tracking-wider text-smoke mb-1">
              Payment
            </label>
            <select
              value={order.payment_status}
              onChange={e => setPaymentStatus(e.target.value)}
              disabled={updateOrder.isPending}
              className="border border-linen bg-white px-3 py-2 text-sm"
            >
              {PAYMENT_STATUSES.map(s => <option key={s} value={s} className="capitalize">{s}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        {/* Items */}
        <section className="border border-linen bg-white">
          <h3 className="px-5 py-4 border-b border-linen text-sm font-semibold uppercase tracking-wider">
            Items
          </h3>
          <div className="divide-y divide-linen">
            {order.order_items.map(item => (
              <div key={item.id} className="flex justify-between items-center px-5 py-3">
                <div>
                  <p className="text-sm font-medium">{item.product_name}</p>
                  <p className="text-xs text-smoke">{item.variant_label} · {item.sku} × {item.quantity}</p>
                </div>
                <p className="text-sm font-semibold">{formatPrice(item.line_total)}</p>
              </div>
            ))}
          </div>
          <div className="border-t border-linen px-5 py-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-smoke">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-smoke">
              <span>Delivery</span>
              <span>{order.delivery_fee === 0 ? 'Free' : formatPrice(order.delivery_fee)}</span>
            </div>
            <div className="flex justify-between font-semibold text-base pt-1.5 border-t border-linen">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </section>

        {/* Customer */}
        <aside className="border border-linen bg-white p-5 space-y-5">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-smoke mb-2">Customer</h3>
            <p className="text-sm font-medium">{order.customer_name}</p>
            <p className="text-sm text-smoke">{order.phone}</p>
            {order.email && <p className="text-sm text-smoke">{order.email}</p>}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-smoke mb-2">Delivery</h3>
            <p className="text-sm">{order.address}</p>
            <p className="text-sm text-smoke">{order.city}, {order.region}</p>
            {order.delivery_notes && (
              <p className="text-xs text-smoke mt-1 italic">“{order.delivery_notes}”</p>
            )}
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-smoke mb-2">Payment method</h3>
            <p className="text-sm capitalize">{order.payment_method}</p>
            <p className="text-xs text-smoke mt-1">
              {order.payment_method === 'cod'
                ? 'Collect cash on delivery, then mark as paid.'
                : 'Confirm the mobile-money transfer, then mark as paid.'}
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}
