import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Package, ShoppingCart, Boxes, Users, Wallet, Store,
} from 'lucide-react'

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/products', label: 'Products', icon: Package },
  { to: '/admin/orders', label: 'Orders', icon: ShoppingCart },
  { to: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { to: '/admin/customers', label: 'Customers', icon: Users },
  { to: '/admin/expenses', label: 'Expenses', icon: Wallet },
]

export default function AdminLayout() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-10 items-start">
      <aside>
        <div className="flex items-center justify-between mb-6">
          <h1 className="font-display text-xl">Admin</h1>
          <Link
            to="/"
            className="text-xs text-smoke hover:text-ink flex items-center gap-1"
            title="Back to storefront"
          >
            <Store size={14} /> Store
          </Link>
        </div>
        <nav className="flex lg:flex-col gap-1 overflow-x-auto">
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2.5 px-3 py-2 text-sm whitespace-nowrap rounded ${
                  isActive ? 'bg-ink text-white font-semibold' : 'text-smoke hover:bg-sand'
                }`
              }
            >
              <item.icon size={16} strokeWidth={1.75} />
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
