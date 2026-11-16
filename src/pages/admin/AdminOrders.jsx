import { useState } from 'react'
import { Link } from 'react-router-dom'
import Spinner from '../../components/Spinner'
import { useAdminOrders } from '../../hooks/useAdmin'
import { ORDER_STATUSES } from '../../lib/constants'
import { formatDateTime, formatPrice } from '../../lib/format'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminOrders() {
  const [filter, setFilter] = useState('')
  const { data: orders, isLoading } = useAdminOrders(filter || null)

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Orders</h2>

      <div className="flex gap-2 flex-wrap mb-6">
        <FilterChip label="All" active={!filter} onClick={() => setFilter('')} />
        {ORDER_STATUSES.map(s => (
          <FilterChip key={s} label={s} active={filter === s} onClick={() => setFilter(s)} />
        ))}
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="border border-linen bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[760px]">
            <thead>
              <tr className="border-b border-linen text-left">
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Region</Th>
                <Th>Payment</Th>
                <Th>Status</Th>
                <Th>Total</Th>
                <Th>Placed</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {(orders || []).map(o => (
                <tr key={o.id} className="hover:bg-sand/50">
                  <Td>
                    <Link to={`/admin/orders/${o.id}`} className="font-semibold underline">
                      {o.order_number}
                    </Link>
                  </Td>
                  <Td>
                    <p>{o.customer_name}</p>
                    <p className="text-xs text-smoke">{o.phone}</p>
                  </Td>
                  <Td>{o.region}</Td>
                  <Td>
                    <span className="capitalize">{o.payment_method}</span>
                    <span className={`block text-[10px] font-semibold uppercase ${
                      o.payment_status === 'paid' ? 'text-success' : 'text-sale'
                    }`}>
                      {o.payment_status}
                    </span>
                  </Td>
                  <Td>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${statusStyles[o.status]}`}>
                      {o.status}
                    </span>
                  </Td>
                  <Td className="font-semibold">{formatPrice(o.total)}</Td>
                  <Td className="text-xs text-smoke">{formatDateTime(o.created_at)}</Td>
                </tr>
              ))}
              {orders?.length === 0 && (
                <tr><Td colSpan={7}><p className="text-sm text-smoke py-6 text-center">No orders match this filter.</p></Td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border capitalize ${
        active ? 'bg-ink text-white border-ink' : 'text-smoke border-linen hover:border-ink'
      }`}
    >
      {label}
    </button>
  )
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-smoke">
      {children}
    </th>
  )
}

function Td({ children, colSpan }) {
  return <td className="px-4 py-3" colSpan={colSpan}>{children}</td>
}
