import CatalogGrid from '../components/CatalogGrid'
import { useProducts } from '../hooks/useProducts'

export default function Bestsellers() {
  const { data: products, isLoading } = useProducts()
  const items = (products || []).filter(p => p.tags.includes('bestseller'))

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
          Proven Favorites
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] mb-3">Bestsellers</h1>
        <p className="text-sm text-smoke max-w-lg">
          The pieces our customers keep coming back for — tried, tested,
          and loved from Dar es Salaam to Mwanza.
        </p>
      </div>
      <CatalogGrid products={items} isLoading={isLoading} />
    </div>
  )
}
