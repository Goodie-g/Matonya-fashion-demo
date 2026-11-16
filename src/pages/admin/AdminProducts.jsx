import { Link } from 'react-router-dom'
import { Plus, Pencil } from 'lucide-react'
import Spinner from '../../components/Spinner'
import { useAdminProducts } from '../../hooks/useAdmin'
import { formatPrice } from '../../lib/format'

export default function AdminProducts() {
  const { data: products, isLoading } = useAdminProducts()

  if (isLoading) return <Spinner />

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="font-display text-2xl">Products</h2>
        <Link
          to="/admin/products/new"
          className="flex items-center gap-2 bg-ink text-white px-4 py-2.5 text-xs font-semibold uppercase tracking-wider"
        >
          <Plus size={14} /> Add Product
        </Link>
      </div>

      <div className="border border-linen bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="border-b border-linen text-left">
              <Th>Product</Th>
              <Th>Category</Th>
              <Th>Price</Th>
              <Th>Variants</Th>
              <Th>Stock</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {(products || []).map(p => (
              <tr key={p.id} className="hover:bg-sand/50">
                <Td>
                  <div className="flex items-center gap-3">
                    {p.image && <img src={p.image} alt="" className="w-10 h-12 object-cover bg-sand" />}
                    <span className="font-medium">{p.name}</span>
                  </div>
                </Td>
                <Td>{p.categories?.name || '—'}</Td>
                <Td>{formatPrice(p.base_price)}</Td>
                <Td>{p.variantCount}</Td>
                <Td>
                  <span className={p.totalStock === 0 ? 'text-sale font-semibold' : ''}>
                    {p.totalStock}
                  </span>
                </Td>
                <Td>
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
                    p.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {p.is_active ? 'Active' : 'Hidden'}
                  </span>
                </Td>
                <Td>
                  <Link
                    to={`/admin/products/${p.id}/edit`}
                    className="text-smoke hover:text-ink inline-flex items-center gap-1 text-xs font-semibold"
                  >
                    <Pencil size={13} /> Edit
                  </Link>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function Th({ children }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-smoke">
      {children}
    </th>
  )
}

export function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>
}
