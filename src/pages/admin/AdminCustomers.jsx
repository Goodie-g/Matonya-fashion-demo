import Spinner from '../../components/Spinner'
import { useAdminCustomers } from '../../hooks/useAdmin'
import { formatDate, formatPrice } from '../../lib/format'

export default function AdminCustomers() {
  const { data: customers, isLoading } = useAdminCustomers()

  if (isLoading) return <Spinner />

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">Customers</h2>

      <div className="border border-linen bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-linen text-left">
              <Th>Name</Th>
              <Th>Contact</Th>
              <Th>Joined</Th>
              <Th>Orders</Th>
              <Th>Total Spent</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {(customers || []).map(c => (
              <tr key={c.id} className="hover:bg-sand/50">
                <Td>
                  <span className="font-medium">{c.full_name || '—'}</span>
                  {c.role === 'admin' && (
                    <span className="ml-2 text-[10px] font-semibold uppercase bg-ink text-white px-1.5 py-0.5">
                      Admin
                    </span>
                  )}
                </Td>
                <Td>
                  <p>{c.email}</p>
                  <p className="text-xs text-smoke">{c.phone}</p>
                </Td>
                <Td className="text-smoke">{formatDate(c.created_at)}</Td>
                <Td>{c.orderCount}</Td>
                <Td className="font-semibold">{formatPrice(c.totalSpent)}</Td>
              </tr>
            ))}
            {customers?.length === 0 && (
              <tr><Td colSpan={5}><p className="text-sm text-smoke py-6 text-center">No registered customers yet.</p></Td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
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
