import { Link } from 'react-router-dom'
import { BRAND, PAYMENT_METHODS } from '../lib/constants'

export default function Footer() {
  const linkClass = 'text-sm text-smoke hover:text-ink transition-colors'
  const headingClass = 'text-xs font-semibold uppercase tracking-widest mb-4 text-smoke'

  return (
    <footer className="bg-sand border-t border-linen pt-16 pb-8">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 mb-12 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="font-display text-xl mb-4">{BRAND.name}</h3>
            <p className="text-sm text-smoke max-w-[280px] leading-relaxed">
              Quality menswear rooted in Tanzania. Crafted in {BRAND.city},
              delivered nationwide — from Dodoma to Zanzibar.
            </p>
          </div>

          <div>
            <h4 className={headingClass}>Shop</h4>
            <div className="flex flex-col gap-2.5">
              <Link to="/new" className={linkClass}>New Arrivals</Link>
              <Link to="/bestsellers" className={linkClass}>Bestsellers</Link>
              <Link to="/sale" className={linkClass}>Sale</Link>
              <Link to="/shop" className={linkClass}>Shop All</Link>
            </div>
          </div>

          <div>
            <h4 className={headingClass}>We Accept</h4>
            <div className="flex flex-col gap-2.5">
              {PAYMENT_METHODS.map(m => (
                <span key={m.id} className="text-sm text-smoke">{m.label}</span>
              ))}
            </div>
          </div>

          <div>
            <h4 className={headingClass}>Contact</h4>
            <div className="flex flex-col gap-2.5 text-sm text-smoke">
              <span>{BRAND.city}, Tanzania</span>
              <a href={`tel:${BRAND.phone.replace(/\s/g, '')}`} className={linkClass}>{BRAND.phone}</a>
              <a href={`mailto:${BRAND.email}`} className={linkClass}>{BRAND.email}</a>
              <a
                href={`https://wa.me/${BRAND.whatsapp}`}
                target="_blank"
                rel="noreferrer"
                className={linkClass}
              >
                WhatsApp us
              </a>
            </div>
          </div>
        </div>

        <div className="border-t border-linen pt-6 flex flex-wrap justify-between items-center gap-4">
          <p className="text-xs text-smoke">© 2026 {BRAND.name}. All rights reserved.</p>
          <p className="text-xs text-smoke">Portfolio demo project</p>
        </div>
      </div>
    </footer>
  )
}
