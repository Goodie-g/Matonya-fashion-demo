import { useMemo, useState } from 'react'
import CatalogGrid from '../components/CatalogGrid'
import { useCategories, useProducts } from '../hooks/useProducts'

export default function ShopAll() {
  const { data: products, isLoading } = useProducts()
  const { data: categories } = useCategories()
  const [category, setCategory] = useState('all')

  const filtered = useMemo(() => {
    if (category === 'all') return products || []
    return (products || []).filter(p => p.categorySlug === category)
  }, [products, category])

  return (
    <div className="mx-auto max-w-7xl px-6 pt-12 pb-20">
      <div className="mb-10">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
          Collection
        </p>
        <h1 className="text-[clamp(1.75rem,4vw,2.5rem)]">Shop All</h1>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 flex-wrap mb-8">
        <FilterChip
          label="All"
          active={category === 'all'}
          onClick={() => setCategory('all')}
        />
        {(categories || []).map(c => (
          <FilterChip
            key={c.slug}
            label={c.name}
            active={category === c.slug}
            onClick={() => setCategory(c.slug)}
          />
        ))}
      </div>

      <CatalogGrid products={filtered} isLoading={isLoading} />
    </div>
  )
}

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
        active
          ? 'bg-ink text-white border-ink'
          : 'bg-transparent text-smoke border-linen hover:border-ink'
      }`}
    >
      {label}
    </button>
  )
}
