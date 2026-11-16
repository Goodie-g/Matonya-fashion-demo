import { Link, useLocation, useNavigate } from 'react-router-dom'
import { ShoppingBag, Menu, X, Search, User, LayoutDashboard } from 'lucide-react'
import { useState } from 'react'
import { useCart } from '../context/CartContext'
import { useAuth } from '../context/AuthContext'
import { BRAND } from '../lib/constants'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [query, setQuery] = useState('')
  const location = useLocation()
  const navigate = useNavigate()
  const { count, openCart } = useCart()
  const { user, isAdmin } = useAuth()

  const links = [
    { to: '/new', label: 'New' },
    { to: '/bestsellers', label: 'Bestsellers' },
    { to: '/sale', label: 'Sale' },
    { to: '/shop', label: 'Shop All' },
    { to: '/about', label: 'About' },
  ]

  const isActive = (path) => location.pathname === path

  const submitSearch = (e) => {
    e.preventDefault()
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setSearchOpen(false)
    setQuery('')
  }

  return (
    <header className="sticky top-0 z-50 bg-cream border-b border-linen">
      <div className="mx-auto max-w-7xl px-6 flex items-center justify-between h-[72px]">
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden p-2"
          aria-label="Menu"
        >
          {mobileOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link to="/" className="font-display text-2xl tracking-tight">
          {BRAND.name}
        </Link>

        <nav className="hidden md:flex gap-8 items-center">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              className={`text-sm uppercase tracking-wide transition-colors ${
                isActive(link.to) ? 'font-semibold text-ink' : 'text-smoke hover:text-ink'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex gap-4 items-center">
          <button onClick={() => setSearchOpen(!searchOpen)} className="p-1" aria-label="Search">
            <Search size={20} strokeWidth={1.5} />
          </button>

          {isAdmin && (
            <Link to="/admin" className="p-1" aria-label="Admin dashboard" title="Admin">
              <LayoutDashboard size={20} strokeWidth={1.5} />
            </Link>
          )}

          <Link to={user ? '/account' : '/sign-in'} className="p-1" aria-label="Account">
            <User size={20} strokeWidth={1.5} />
          </Link>

          <button onClick={openCart} className="p-1 relative" aria-label="Cart">
            <ShoppingBag size={20} strokeWidth={1.5} />
            {count > 0 && (
              <span className="absolute -top-1 -right-1 bg-accent text-white text-[10px] w-[18px] h-[18px] rounded-full flex items-center justify-center font-semibold">
                {count}
              </span>
            )}
          </button>
        </div>
      </div>

      {searchOpen && (
        <form onSubmit={submitSearch} className="border-t border-linen">
          <div className="mx-auto max-w-7xl px-6 py-3 flex gap-3">
            <input
              autoFocus
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search kitenge, t-shirts, sandals…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-smoke"
            />
            <button type="submit" className="text-sm font-semibold uppercase tracking-wide">
              Search
            </button>
          </div>
        </form>
      )}

      {mobileOpen && (
        <nav className="md:hidden px-6 pt-4 pb-6 flex flex-col gap-4 border-t border-linen">
          {links.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMobileOpen(false)}
              className={`uppercase tracking-wider ${
                isActive(link.to) ? 'font-semibold text-ink' : 'text-smoke'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  )
}
