import { useSearchParams } from 'react-router-dom'
import CatalogGrid from '../components/CatalogGrid'
import { useProducts } from '../hooks/useProducts'

export default function SearchPage() {
  const [params] = useSearchParams()
  const q = (params.get('q') || '').toLowerCase()
  const { data: products, isLoading } = useProducts()

  const results = (products || []).filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.categorySlug?.includes(q) ||
    p.tags.some(t => t.includes(q))
  )

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
          Search
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)]">
          Results for “{params.get('q')}”
        </h1>
      </div>
      <CatalogGrid products={results} isLoading={isLoading} />
    </div>
  )
}
