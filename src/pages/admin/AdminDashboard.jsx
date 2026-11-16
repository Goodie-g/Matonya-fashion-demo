import { Link } from 'react-router-dom'
import StatCard from '../../components/admin/StatCard'
import Spinner from '../../components/Spinner'
import { useDashboardStats } from '../../hooks/useAdmin'
import { formatDateTime, formatPrice } from '../../lib/format'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  confirmed: 'bg-blue-100 text-blue-800',
  processing: 'bg-blue-100 text-blue-800',
  shipped: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminDashboard() {
  const { data: stats, isLoading } = useDashboardStats()

  if (isLoading || !stats) return <Spinner />

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Dashboard</h2>

      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-4">
        <StatCard label="Revenue" value={formatPrice(stats.revenue)} />
        <StatCard
          label="Orders"
          value={stats.orderCount}
          hint={`Avg. order ${formatPrice(stats.avgOrderValue)}`}
        />
        <StatCard label="Customers" value={stats.customerCount} />
        <StatCard
          label="Net (Revenue − Expenses)"
          value={formatPrice(stats.net)}
          hint={`Expenses ${formatPrice(stats.expenses)}`}
        />
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mt-8">
        {/* Recent orders */}
        <section className="border border-linen bg-white">
          <div className="flex justify-between items-center px-5 py-4 border-b border-linen">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Recent Orders</h3>
            <Link to="/admin/orders" className="text-xs text-smoke underline">View all</Link>
          </div>
          {stats.recentOrders.length === 0 ? (
            <p className="text-sm text-smoke p-5">No orders yet.</p>
          ) : (
            <div className="divide-y divide-linen">
              {stats.recentOrders.map(o => (
                <Link
                  key={o.id}
                  to={`/admin/orders/${o.id}`}
                  className="flex items-center justify-between px-5 py-3 hover:bg-sand"
                >
                  <div>
                    <p className="text-sm font-semibold">{o.customer_name}</p>
                    <p className="text-xs text-smoke">{o.order_number} · {formatDateTime(o.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${statusStyles[o.status] || 'bg-sand'}`}>
                      {o.status}
                    </span>
                    <span className="text-sm font-semibold">{formatPrice(o.total)}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Low stock alerts */}
        <section className="border border-linen bg-white">
          <div className="flex justify-between items-center px-5 py-4 border-b border-linen">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Low Stock</h3>
            <Link to="/admin/inventory" className="text-xs text-smoke underline">Inventory</Link>
          </div>
          {stats.lowStock.length === 0 ? (
            <p className="text-sm text-smoke p-5">All variants are well stocked.</p>
          ) : (
            <div className="divide-y divide-linen">
              {stats.lowStock.map(v => (
                <div key={v.id} className="flex items-center justify-between px-5 py-3">
                  <div>
                    <p className="text-sm font-semibold">{v.products?.name}</p>
                    <p className="text-xs text-smoke">{v.color} / {v.size} · {v.sku}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 ${
                    v.stock_quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {v.stock_quantity === 0 ? 'Out of stock' : `${v.stock_quantity} left`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
