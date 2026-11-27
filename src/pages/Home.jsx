import { Link } from 'react-router-dom'
import { ArrowRight, Truck, ShieldCheck, Banknote } from 'lucide-react'
import ProductCard from '../components/ProductCard'
import Spinner from '../components/Spinner'
import { useProducts } from '../hooks/useProducts'
import { BRAND, FREE_DELIVERY_THRESHOLD } from '../lib/constants'
import { formatPrice } from '../lib/format'

export default function Home() {
  const { data: products, isLoading } = useProducts()
  const newArrivals = (products || []).filter(p => p.tags.includes('new')).slice(0, 4)
  const bestsellers = (products || []).filter(p => p.tags.includes('bestseller')).slice(0, 4)

  return (
    <>
      {/* Hero — marketing content like this moves to Sanity in the CMS phase */}
      <section className="relative h-[85vh] min-h-[600px] flex items-center overflow-hidden">
        <img
          src="https://thumb.wikimedia.org/wikipedia/commons/thumb/c/c2/A_kitenge_dress.jpg/1920px-A_kitenge_dress.jpg"
          alt="Woman in a kitenge dress beside a dhow on the Tanzanian coast"
          className="absolute inset-0 w-full h-full object-cover object-[50%_15%]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/45 to-black/10" />
        <div className="relative z-10 mx-auto max-w-7xl px-6 w-full">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-white/80 mb-4">
              {BRAND.name} — {BRAND.city}
            </p>
            <h1 className="font-display text-[clamp(2.5rem,5vw,4rem)] text-white leading-[1.1] mb-6">
              Modern clothing, made in Tanzania.
            </h1>
            <p className="text-white/85 leading-relaxed mb-8 max-w-md">
              From kitenge shirts to everyday essentials — well-made pieces
              delivered to your door, anywhere in Tanzania. Pay cash on delivery
              or by mobile money.
            </p>
            <div className="flex gap-4 flex-wrap">
              <Link
                to="/shop"
                className="bg-white text-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-wider inline-flex items-center gap-2"
              >
                Shop All <ArrowRight size={16} />
              </Link>
              <Link
                to="/new"
                className="border border-white/50 text-white px-8 py-3.5 text-sm font-semibold uppercase tracking-wider"
              >
                New Arrivals
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust badges — what Tanzanian shoppers actually care about */}
      <section className="bg-sand border-b border-linen">
        <div className="mx-auto max-w-7xl px-6 grid sm:grid-cols-3">
          {[
            { icon: Truck, text: `Free delivery over ${formatPrice(FREE_DELIVERY_THRESHOLD)}` },
            { icon: Banknote, text: 'Cash on Delivery available' },
            { icon: ShieldCheck, text: 'M-Pesa · Tigo Pesa · Airtel Money' },
          ].map((item, i) => (
            <div
              key={i}
              className={`flex items-center justify-center gap-3 px-6 py-5 ${
                i < 2 ? 'sm:border-r border-linen' : ''
              }`}
            >
              <item.icon size={18} strokeWidth={1.5} className="text-smoke" />
              <span className="text-[13px] text-smoke font-medium">{item.text}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
              Just Landed
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">New Arrivals</h2>
          </div>
          <Link
            to="/new"
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b border-ink pb-0.5"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {newArrivals.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>

      {/* Brand story band */}
      <section className="bg-sand py-20">
        <div className="mx-auto max-w-7xl px-6 grid md:grid-cols-2 gap-16 items-center">
          <div>
            <img
              src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?w=800&q=80"
              alt="Kitenge fabric"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-3">
              The {BRAND.name} Standard
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2.25rem)] mb-5 leading-tight">
              Made for Tanzania, by Tanzania.
            </h2>
            <p className="text-smoke leading-relaxed mb-8">
              We source kitenge from Kariakoo's finest traders, leather from
              Mwanza workshops, and cotton that stands up to the coastal heat.
              Every {BRAND.name} piece is made to work hard and look sharp —
              from the office in Dodoma to weekends in Zanzibar.
            </p>
            <Link
              to="/about"
              className="text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-ink pb-0.5"
            >
              Our Story <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="flex justify-between items-end mb-10">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2">
              Proven Favorites
            </p>
            <h2 className="text-[clamp(1.5rem,3vw,2rem)]">Bestsellers</h2>
          </div>
          <Link
            to="/bestsellers"
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5 border-b border-ink pb-0.5"
          >
            View All <ArrowRight size={14} />
          </Link>
        </div>

        {isLoading ? (
          <Spinner />
        ) : (
          <div className="grid gap-8 grid-cols-2 lg:grid-cols-4">
            {bestsellers.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )}
      </section>
    </>
  )
}
