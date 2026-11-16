import CatalogGrid from '../components/CatalogGrid'
import { useProducts } from '../hooks/useProducts'

export default function NewArrivals() {
  const { data: products, isLoading } = useProducts()
  const items = (products || []).filter(p => p.tags.includes('new'))

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
          Just Landed
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-3">New Arrivals</h1>
        <p className="text-sm text-smoke max-w-lg">
          The latest additions to the collection — fresh kitenge prints,
          restocked essentials, and new seasonal pieces.
        </p>
      </div>
      <CatalogGrid products={items} isLoading={isLoading} />
    </div>
  )
}
