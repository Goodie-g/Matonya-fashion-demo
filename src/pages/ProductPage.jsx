import { useParams, Link } from 'react-router-dom'
import { useMemo, useState } from 'react'
import { ChevronDown, Truck, ShieldCheck, Banknote } from 'lucide-react'
import { useProduct, useRelatedProducts } from '../hooks/useProducts'
import { useCart } from '../context/CartContext'
import ProductCard from '../components/ProductCard'
import RatingStars from '../components/RatingStars'
import Spinner from '../components/Spinner'
import { formatPrice } from '../lib/format'
import { FREE_DELIVERY_THRESHOLD } from '../lib/constants'

export default function ProductPage() {
  const { slug } = useParams()
  const { data: product, isLoading, isError } = useProduct(slug)
  const related = useRelatedProducts(product)
  const { addItem } = useCart()

  const [selectedColor, setSelectedColor] = useState(null)
  const [selectedSize, setSelectedSize] = useState(null)
  const [activeImage, setActiveImage] = useState(0)
  const [openSection, setOpenSection] = useState('details')

  const color = selectedColor ?? product?.colors[0]
  const size = selectedSize

  // Resolve the exact variant (color + size) the customer picked.
  const variant = useMemo(() => {
    if (!product || !color || !size) return null
    return product.variants.find(v => v.color === color && v.size === size) || null
  }, [product, color, size])

  if (isLoading) return <Spinner fullPage />

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-20 text-center">
        <h1 className="text-2xl mb-4">Product not found</h1>
        <Link to="/shop" className="text-sm underline">Back to Shop</Link>
      </div>
    )
  }

  const sizesForColor = product.variants
    .filter(v => v.color === color)
    .map(v => ({ size: v.size, stock: v.stock_quantity }))
  const inStock = variant && variant.stock_quantity > 0
  const isOnSale = product.compare_at_price && product.compare_at_price > (variant?.price ?? product.base_price)
  const displayPrice = variant?.price ?? product.base_price

  const handleAddToCart = () => {
    if (!variant || !inStock) return
    addItem({
      variantId: variant.id,
      productId: product.id,
      slug: product.slug,
      name: product.name,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      image: product.images[0],
      quantity: 1,
    })
  }

  const sections = [
    {
      id: 'details',
      title: 'Details',
      content: (
        <ul className="pl-4 flex flex-col gap-2 list-disc">
          {product.features.map((f, i) => (
            <li key={i} className="text-[13px] text-smoke leading-relaxed">{f}</li>
          ))}
        </ul>
      ),
    },
    {
      id: 'delivery',
      title: 'Delivery & Returns',
      content: (
        <div className="text-[13px] text-smoke leading-relaxed space-y-2">
          <p>Dar es Salaam: 1–2 days · Upcountry: 2–4 days · Zanzibar: 3–5 days.</p>
          <p>Free delivery on orders over {formatPrice(FREE_DELIVERY_THRESHOLD)}.</p>
          <p>Returns accepted within 14 days in original condition.</p>
        </div>
      ),
    },
  ]

  return (
    <div className="mx-auto max-w-7xl px-6 pt-10 pb-20">
      <nav className="text-xs text-smoke mb-8 flex gap-2">
        <Link to="/" className="hover:text-ink">Home</Link>
        <span>/</span>
        <Link to="/shop" className="hover:text-ink">Shop</Link>
        <span>/</span>
        <span className="text-ink">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16 items-start">
        {/* Images */}
        <div>
          <img
            src={product.images[activeImage]}
            alt={product.name}
            className="w-full aspect-[4/5] object-cover mb-3 bg-sand"
          />
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImage(i)}
                  className={`w-[72px] aspect-square overflow-hidden ${
                    i === activeImage ? 'ring-2 ring-ink' : 'ring-1 ring-linen'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Purchase panel */}
        <div className="md:sticky md:top-24">
          {isOnSale && (
            <span className="inline-block bg-sale text-white text-[11px] font-semibold px-2.5 py-1 uppercase tracking-wider mb-3">
              {Math.round((1 - displayPrice / product.compare_at_price) * 100)}% Off
            </span>
          )}

          <h1 className="font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight mb-3">
            {product.name}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <RatingStars rating={product.rating} />
            <span className="text-[13px] text-smoke">
              {product.rating} ({product.review_count} reviews)
            </span>
          </div>

          <div className="flex items-center gap-3 mb-6">
            <span className={`text-xl font-semibold ${isOnSale ? 'text-sale' : 'text-ink'}`}>
              {formatPrice(displayPrice)}
            </span>
            {isOnSale && (
              <span className="text-smoke line-through">{formatPrice(product.compare_at_price)}</span>
            )}
          </div>

          <p className="text-sm text-smoke leading-relaxed mb-7">{product.description}</p>

          {/* Color */}
          <div className="mb-5">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5">
              Color: {color}
            </p>
            <div className="flex gap-2.5 flex-wrap">
              {product.colors.map(c => (
                <button
                  key={c}
                  onClick={() => { setSelectedColor(c); setSelectedSize(null) }}
                  className={`px-4 py-2 text-[13px] ${
                    color === c
                      ? 'ring-2 ring-ink font-semibold'
                      : 'ring-1 ring-linen hover:ring-smoke'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Size — stock-aware */}
          <div className="mb-7">
            <p className="text-xs font-semibold uppercase tracking-wider mb-2.5">Size</p>
            <div className="flex gap-2 flex-wrap">
              {sizesForColor.map(({ size: s, stock }) => (
                <button
                  key={s}
                  onClick={() => stock > 0 && setSelectedSize(s)}
                  disabled={stock === 0}
                  className={`min-w-12 px-3.5 py-2.5 text-[13px] ${
                    size === s
                      ? 'ring-2 ring-ink font-semibold'
                      : stock === 0
                        ? 'ring-1 ring-linen text-smoke/50 line-through cursor-not-allowed'
                        : 'ring-1 ring-linen hover:ring-smoke'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {!size && (
              <p className="text-xs text-smoke mt-2">Please select a size</p>
            )}
            {variant && variant.stock_quantity <= variant.low_stock_threshold && variant.stock_quantity > 0 && (
              <p className="text-xs text-sale mt-2">
                Only {variant.stock_quantity} left in stock
              </p>
            )}
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!inStock}
            className={`w-full py-4 text-sm font-semibold uppercase tracking-wider mb-3 transition-colors ${
              inStock
                ? 'bg-accent text-white hover:bg-ink'
                : 'bg-linen text-smoke cursor-not-allowed'
            }`}
          >
            {!size ? 'Select a Size' : inStock ? 'Add to Cart' : 'Out of Stock'}
          </button>

          <div className="flex flex-col gap-2.5 p-4 bg-sand mb-8">
            {[
              { icon: Truck, text: `Free delivery over ${formatPrice(FREE_DELIVERY_THRESHOLD)}` },
              { icon: Banknote, text: 'Cash on Delivery available' },
              { icon: ShieldCheck, text: 'M-Pesa · Tigo Pesa · Airtel Money' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <item.icon size={16} strokeWidth={1.5} className="text-smoke" />
                <span className="text-[13px] text-smoke">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Accordions */}
          <div>
            {sections.map(section => (
              <div key={section.id} className="border-t border-linen">
                <button
                  onClick={() => setOpenSection(openSection === section.id ? '' : section.id)}
                  className="w-full py-4 flex justify-between items-center"
                >
                  <span className="text-[13px] font-semibold uppercase tracking-wider">
                    {section.title}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${openSection === section.id ? 'rotate-180' : ''}`}
                  />
                </button>
                {openSection === section.id && (
                  <div className="pb-4">{section.content}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-2xl mb-8">You May Also Like</h2>
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </div>
  )
}
