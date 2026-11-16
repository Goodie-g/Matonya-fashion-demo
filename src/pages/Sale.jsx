import CatalogGrid from '../components/CatalogGrid'
import { useProducts } from '../hooks/useProducts'

export default function Sale() {
  const { data: products, isLoading } = useProducts()
  const items = (products || []).filter(p => p.tags.includes('sale'))

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <div className="bg-accent text-white p-12 mb-12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-white/70 mb-3">
          Limited Time
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)] text-white mb-3">
          The Mizizi Sale
        </h1>
        <p className="text-white/80 max-w-lg leading-relaxed">
          Markdowns on select styles while sizes last. No code needed —
          prices reflect savings. Delivery across Tanzania.
        </p>
      </div>
      <CatalogGrid products={items} isLoading={isLoading} />
    </div>
  )
}
