import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useMyOrders } from '../../hooks/useOrders'
import Spinner, { EmptyState } from '../../components/Spinner'
import { formatDate, formatPrice } from '../../lib/format'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AccountPage() {
  const { user, profile, signOut } = useAuth()
  const { data: orders, isLoading } = useMyOrders(user?.id)

  return (
    <div className="mx-auto max-w-4xl px-6 pt-12 pb-20">
      <div className="flex justify-between items-start mb-10 flex-wrap gap-4">
        <div>
          <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-1">
            Karibu{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
          </h1>
          <p className="text-sm text-smoke">{profile?.email}</p>
          {profile?.phone && <p className="text-sm text-smoke">{profile.phone}</p>}
        </div>
        <button
          onClick={signOut}
          className="text-xs font-semibold uppercase tracking-wider border border-linen px-4 py-2 hover:border-ink"
        >
          Sign Out
        </button>
      </div>

      <h2 className="text-xl mb-6">Order History</h2>

      {isLoading ? (
        <Spinner />
      ) : !orders?.length ? (
        <EmptyState
          title="No orders yet"
          message="When you place an order it will appear here."
          action={
            <Link to="/shop" className="mt-2 px-6 py-3 bg-accent text-white text-xs font-semibold uppercase tracking-wider">
              Start Shopping
            </Link>
          }
        />
      ) : (
        <div className="border border-linen divide-y divide-linen">
          {orders.map(order => (
            <div key={order.id} className="p-4 flex flex-wrap items-center gap-4 justify-between">
              <div>
                <p className="text-sm font-semibold">{order.order_number}</p>
                <p className="text-xs text-smoke">{formatDate(order.created_at)}</p>
              </div>
              <span className={`text-[11px] font-semibold uppercase tracking-wider px-2.5 py-1 ${statusStyles[order.status] || 'bg-sand'}`}>
                {order.status}
              </span>
              <div className="text-right">
                <p className="text-sm font-semibold">{formatPrice(order.total)}</p>
                <p className="text-xs text-smoke capitalize">
                  {order.payment_method} · {order.payment_status}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
