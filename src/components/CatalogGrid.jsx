import { useMemo, useState } from 'react'
import ProductCard from './ProductCard'
import Spinner, { EmptyState } from './Spinner'

// Shared product grid with sorting, used by Shop All, New,
// Bestsellers, Sale and Search.
export default function CatalogGrid({ products, isLoading, showSort = true }) {
  const [sortBy, setSortBy] = useState('featured')

  const sorted = useMemo(() => {
    const list = [...(products || [])]
    if (sortBy === 'price-low') list.sort((a, b) => a.price - b.price)
    if (sortBy === 'price-high') list.sort((a, b) => b.price - a.price)
    if (sortBy === 'rating') list.sort((a, b) => b.rating - a.rating)
    return list
  }, [products, sortBy])

  if (isLoading) return <Spinner />

  return (
    <>
      {showSort && (
        <div className="flex justify-between items-center mb-8 pb-4 border-b border-linen flex-wrap gap-4">
          <p className="text-[13px] text-smoke">{sorted.length} items</p>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value)}
            className="text-[13px] px-3 py-2 border border-linen bg-cream text-ink"
          >
            <option value="featured">Featured</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="rating">Top Rated</option>
          </select>
        </div>
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title="No products found"
          message="Check back soon — new stock arrives regularly."
        />
      ) : (
        <div className="grid gap-x-8 gap-y-12 grid-cols-2 lg:grid-cols-4">
          {sorted.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </>
  )
}
