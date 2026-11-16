import { Link } from 'react-router-dom'
import RatingStars from './RatingStars'
import { formatPrice } from '../lib/format'

export default function ProductCard({ product }) {
  const isOnSale = product.compareAt && product.compareAt > product.price
  const discount = isOnSale ? Math.round((1 - product.price / product.compareAt) * 100) : null
  const soldOut = product.totalStock === 0

  return (
    <Link to={`/product/${product.slug}`} className="block group">
      <div className="relative overflow-hidden mb-4 bg-sand">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full aspect-[4/5] object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            loading="lazy"
          />
        ) : (
          <div className="w-full aspect-[4/5] flex items-center justify-center text-smoke text-sm">
            No image
          </div>
        )}
        {soldOut && (
          <div className="absolute inset-0 bg-cream/60 flex items-center justify-center">
            <span className="bg-ink text-white text-xs font-semibold uppercase tracking-wider px-4 py-2">
              Sold Out
            </span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.tags.includes('new') && (
            <span className="bg-ink text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
              New
            </span>
          )}
          {product.tags.includes('bestseller') && (
            <span className="bg-white text-ink border border-linen text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
              Bestseller
            </span>
          )}
          {isOnSale && (
            <span className="bg-sale text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider">
              {discount}% Off
            </span>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-1">
          <RatingStars rating={product.rating} size={12} />
          <span className="text-xs text-smoke">({product.reviewCount})</span>
        </div>

        <h3 className="font-sans text-sm font-medium mb-1.5 leading-snug">{product.name}</h3>

        <div className="flex items-center gap-2">
          <span className={`text-sm font-semibold ${isOnSale ? 'text-sale' : 'text-ink'}`}>
            {formatPrice(product.price)}
          </span>
          {isOnSale && (
            <span className="text-xs text-smoke line-through">{formatPrice(product.compareAt)}</span>
          )}
        </div>
      </div>
    </Link>
  )
}
