# Matonya — Design System

A working reference for the storefront and admin UI. Every value here comes
from the code; the single source of truth is the `@theme` block in
[`src/index.css`](src/index.css) plus the component files listed at the end.

Tailwind CSS v4 generates utilities directly from the theme tokens, so
`--color-smoke` gives you `text-smoke`, `border-linen` gives you a linen border,
and `--font-display` gives you `font-display`.

---

## 1. Brand & principles

**Matonya** — modern Tanzanian clothing. *Tailored in Tanzania.* Based in Dar es
Salaam, delivering nationwide.

The interface is deliberately **quiet**: warm off-white paper, thin hairline
rules, no rounded corners, one serif voice for headings and one sans for
everything else. Product photography carries the colour; the UI does not
compete with it.

Four rules the code follows:

1. **Editorial, not app-like.** Serif display headings, hairline `linen`
   borders, generous whitespace, square corners.
2. **Content first.** No decorative gradients, shadows or icon clutter. The
   only shadow in the app is the cart drawer.
3. **Uppercase labels, sentence-case content.** Small caps-style eyebrows and
   buttons; body copy stays normal case.
4. **One accent for action.** Dark `accent`/`ink` is the only call-to-action
   colour; `sale` red is reserved for discounts, errors and money owed.

---

## 2. Design tokens

### 2.1 Colour

| Token | Hex | Utility | Role |
| --- | --- | --- | --- |
| `cream` | `#FAF8F5` | `bg-cream` | Page background — warm paper white |
| `sand` | `#F0EDE8` | `bg-sand` | Alternating sections, media placeholders, muted panels |
| `linen` | `#E0DCD5` | `border-linen`, `ring-linen` | **Every** hairline border, dividers, inactive outlines |
| `ink` | `#1A1A1A` | `text-ink`, `bg-ink` | Primary text, active nav pills, `New` badge, hover for primary buttons |
| `smoke` | `#6B6560` | `text-smoke` | Secondary text, meta, labels, placeholders, inactive nav |
| `accent` | `#2C2C2C` | `bg-accent` | Primary button fill, cart count bubble |
| `sale` | `#C44536` | `text-sale`, `bg-sale` | Discount prices, sale badges, form errors, unpaid status |
| `success` | `#3A5A40` | `text-success` | Paid status only |
| `white` | `#FFFFFF` | `bg-white` | Cards, tables, inputs sitting on cream |

Semantic pairings used throughout:

- Surface `cream` → panel/card `white` → muted band `sand`.
- Divider/border is always `linen` (1px). Selected state is `ring-2 ring-ink`.
- Never use pure black text; `ink` is the darkest value.

Contrast (measured):

| Pair | Ratio | Verdict |
| --- | --- | --- |
| `ink` on `cream` | 16.4:1 | AAA |
| `white` on `accent` | 14.0:1 | AAA |
| `smoke` on `cream` | 5.4:1 | AA |
| `smoke` on `sand` | 4.9:1 | AA (normal text only) |
| `sale` on `cream` | 4.7:1 | AA (normal text only) |
| `success` on `white` | 7.7:1 | AAA |

> `smoke` on `sand` is only 4.9:1 — fine at 13px+, avoid it for 10–11px copy.

Admin status colours intentionally step outside the palette and use Tailwind's
100/800 pairs (see §3.3).

### 2.2 Typography

Loaded in [`index.html`](index.html) from Google Fonts:

- **Playfair Display** 400/500/600 — `font-display`
- **Inter** 400/500/600/700 — `font-sans` (default on `body`)

`h1, h2, h3` get `font-display font-medium` by default; override with
`font-sans` when a heading should read as UI rather than editorial.

| Role | Classes | Notes |
| --- | --- | --- |
| Hero H1 | `font-display text-[clamp(2.5rem,5vw,4rem)] leading-[1.1]` | Home only, over imagery |
| Page H1 | `text-[clamp(1.75rem,4vw,2.5rem)]` | Shop, Checkout, Sale |
| Section H2 | `text-[clamp(1.5rem,3vw,2rem)]` | Home sections |
| Panel H2 | `font-display text-2xl` | Admin pages, PDP related |
| PDP title | `font-display text-[clamp(1.5rem,3vw,2rem)] leading-tight` | Product page |
| Body | `text-sm leading-relaxed` | Default UI copy |
| Dense body | `text-[13px] leading-relaxed` | Feature lists, meta rows, trust items |
| Meta / captions | `text-xs text-smoke` | Reviews, timestamps, helper text |
| Eyebrow | `text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke` | Section kickers (0.15em on hero) |
| Buttons | `text-sm font-semibold uppercase tracking-wider` | Full-size CTA |
| Small buttons / links | `text-xs font-semibold uppercase tracking-wider` | "View all", add-image controls |
| Micro badge | `text-[10px] font-semibold uppercase tracking-wider` | Product tags, status pills |
| Table head | `text-[11px] font-semibold uppercase tracking-[0.1em] text-smoke` | Admin tables |

Long-form copy (`About`) uses `text-[15px] leading-loose` and one `text-lg
leading-loose` lede.

### 2.3 Space & layout

- **Container:** `mx-auto max-w-7xl px-6` (1280px + 24px gutters) — every page.
- **Page padding:** `pt-12 pb-20` (catalogue/checkout), `pt-10 pb-20` (PDP),
  `py-20` (home sections), `py-10` (admin shell).
- **Section rhythm:** 48–80px between blocks; `mb-10` under section headers,
  `mb-8` between filter row and grid.
- **Product grid:** `grid grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-12`.
- **Admin KPI grid:** `grid sm:grid-cols-2 xl:grid-cols-4 gap-4`.
- **Admin shell:** `grid lg:grid-cols-[220px_1fr] gap-10 items-start`.
- **PDP:** `md:grid-cols-[1.2fr_1fr] gap-10 lg:gap-16`, sticky buy panel at
  `md:sticky md:top-24`.
- **Header height:** `h-[72px]`, sticky at `top-0 z-50`.

### 2.4 Shape, border & elevation

- **Radius is zero.** Buttons, inputs, cards, images, badges are all square.
  The only exceptions: admin nav item `rounded` (4px), cart count `rounded-full`,
  spinner `rounded-full`.
- **Border:** 1px `linen` on cards, inputs, table rows, nav and footer rules.
- **Selection:** `ring-2 ring-ink` (colour/size buttons, active thumbnail);
  inactive is `ring-1 ring-linen hover:ring-smoke`.
- **Elevation:** none, except the cart drawer (`shadow-2xl`) and its
  `bg-black/30` scrim. Hero imagery uses `bg-gradient-to-r from-black/60 to-black/10`.

### 2.5 Motion

| Where | Classes |
| --- | --- |
| Text/colour hovers | `transition-colors` |
| Product image zoom | `transition-transform duration-500 group-hover:scale-[1.03]` |
| Cart drawer | `transition-transform duration-300`, `translate-x-0` / `translate-x-full` |
| Accordion chevron | `transition-transform` + `rotate-180` |
| Spinner | `animate-spin` |

No entrance animations, parallax or scroll effects.

### 2.6 Iconography

[Lucide React](https://lucide.dev) only.

- Navbar utility icons: `size={20} strokeWidth={1.5}`
- Inline/trust icons: `size={16|18} strokeWidth={1.5}`
- Admin nav: `size={16} strokeWidth={1.75}`
- Ratings: `size={12|14}`, filled `fill-ink stroke-ink`, empty
  `fill-none stroke-linen`
- Icon-only buttons always carry `aria-label`; hit area padded with `p-1`/`p-2`.

---

## 3. Components

### 3.1 Buttons

| Variant | Recipe |
| --- | --- |
| **Primary** (default) | `bg-accent text-white text-sm font-semibold uppercase tracking-wider px-8 py-3.5 hover:bg-ink` |
| **Primary block** (cart, checkout, auth) | `w-full py-3.5` (PDP: `py-4`) |
| **Inverse** (on dark imagery) | `bg-white text-ink px-8 py-3.5 text-sm font-semibold uppercase tracking-wider` |
| **Inverse outline** | `border border-white/50 text-white px-8 py-3.5 …` |
| **Disabled** | `bg-linen text-smoke cursor-not-allowed` (or `disabled:opacity-60`) |
| **Text link** | `text-xs font-semibold uppercase tracking-wider inline-flex items-center gap-1.5 border-b border-ink pb-0.5` |
| **Admin action link** | `text-xs text-smoke underline hover:text-ink` |
| **Icon button** | `p-1` / `p-2`, lucide icon, `aria-label` |

Rules: sentence-case labels only ("Add to Cart", "Shop All"); no rounded
corners; outlined buttons are reserved for variant selectors and utility
actions (e.g. the demo-account quick-fill buttons), not secondary CTAs.
Cursor affordance is global: `button:not(:disabled)` and `[role="button"]`
get `cursor: pointer`, while disabled controls get `cursor: not-allowed`
(declared in the base layer of `src/index.css`).

### 3.2 Badges, chips & pills

**Product tag** (over image, top-left stack `flex flex-col gap-1.5`):

```jsx
'bg-ink text-white text-[10px] font-semibold px-2.5 py-1 uppercase tracking-wider'          // New
'bg-white text-ink border border-linen text-[10px] …'                                        // Bestseller
'bg-sale text-white text-[10px] …'                                                           // 20% Off
```

**Sold out overlay:** `absolute inset-0 bg-cream/60` + `bg-ink text-white text-xs
font-semibold uppercase tracking-wider px-4 py-2`.

**Filter chip** (shop + admin):

```jsx
// storefront
`px-4 py-2 text-xs font-semibold uppercase tracking-wider border transition-colors ${
  active ? 'bg-ink text-white border-ink' : 'bg-transparent text-smoke border-linen hover:border-ink'}`

// admin (denser, capitalised labels)
`px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider border capitalize ${
  active ? 'bg-ink text-white border-ink' : 'text-smoke border-linen hover:border-ink'}`
```

**Order status pill:** `text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5`
plus `pending → bg-yellow-100 text-yellow-800`, `confirmed|processing →
bg-blue-100 text-blue-800`, `shipped → bg-purple-100 text-purple-800`,
`delivered → bg-green-100 text-green-800`, `cancelled → bg-red-100 text-red-800`.

**Payment status:** `text-[10px] font-semibold uppercase` + `text-success` (paid)
or `text-sale` (unpaid/pending).

### 3.3 Forms

```jsx
const inputClass = 'w-full border border-linen bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink'
const labelClass = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'   // admin: text-[11px] text-smoke mb-1
const errorClass = 'text-xs text-sale mt-1'
```

- Inputs, selects and textareas share one recipe; admin uses `px-3 py-2`.
- Focus is communicated only by `focus:border-ink` (no ring) — see §5.
- Checkboxes are native, wrapped in `label.flex.items-center.gap-2.text-sm`.
- Field groups use `grid sm:grid-cols-2 gap-4`; full-width fields
  `sm:col-span-2`.
- Helper text: `text-xs text-smoke mt-2`.
- Demo/notice callout: `border border-linen bg-sand p-4` with an
  `text-[11px] font-semibold uppercase tracking-wider text-smoke` heading.

### 3.4 Cards, panels & tables

**Panel / section card** (admin, PDP trust block):

```jsx
<section className="border border-linen bg-white">
  <div className="px-5 py-4 border-b border-linen flex justify-between items-center">
    <h3 className="text-sm font-semibold uppercase tracking-wider">Title</h3>
    <Link className="text-xs text-smoke underline">Action</Link>
  </div>
  <div className="divide-y divide-linen">…rows…</div>
</section>
```

**Stat card:** `border border-linen bg-white p-5`; label
`text-[11px] font-semibold uppercase tracking-[0.12em] text-smoke mb-2`; value
`text-2xl font-display`; optional hint `text-xs text-smoke mt-1`.

**Table:**

```jsx
<div className="border border-linen bg-white overflow-x-auto">
  <table className="w-full text-sm min-w-[760px]">
    <thead><tr className="border-b border-linen text-left">
      <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-smoke">
    </tr></thead>
    <tbody className="divide-y divide-linen">
      <tr className="hover:bg-sand/50"><td className="px-4 py-3">…</td></tr>
    </tbody>
  </table>
</div>
```

### 3.5 Product card

Canonical merchandising unit (`ProductCard.jsx`):

- Image: `w-full aspect-[4/5] object-cover bg-sand`, lazy-loaded, zooms on
  hover (`scale-[1.03]`).
- Badges absolutely positioned top-left.
- Below image, in order: `RatingStars` + `(reviewCount)` → product name
  (`font-sans text-sm font-medium leading-snug`) → price
  (`text-sm font-semibold`, `text-sale` when discounted) with struck-through
  compare-at (`text-xs text-smoke line-through`).
- Sold-out: cream scrim over the image + `Sold Out` label.

### 3.6 Navigation & footer

**Navbar:** `sticky top-0 z-50 bg-cream border-b border-linen`, 72px, container
`max-w-7xl px-6`. Wordmark `font-display text-2xl tracking-tight`. Links
`text-sm uppercase tracking-wide`, active `font-semibold text-ink`, inactive
`text-smoke hover:text-ink`. Utilities right-aligned with `gap-4`. Search opens
a second row (`border-t border-linen`, transparent input). Mobile menu is a
stack of links with the same tracking.

**Footer:** `bg-sand border-t border-linen pt-16 pb-8`; four-column
`grid gap-12 sm:grid-cols-2 lg:grid-cols-4`; column headings
`text-xs font-semibold uppercase tracking-widest text-smoke mb-4`; links
`text-sm text-smoke hover:text-ink transition-colors`; bottom bar separated by
`border-t border-linen pt-6` with `text-xs text-smoke`.

### 3.7 Cart drawer

`fixed top-0 right-0 w-full max-w-[420px] h-screen bg-cream z-[101] shadow-2xl`,
scrim `fixed inset-0 bg-black/30 z-[100]`. Header `px-6 py-5 border-b
border-linen` with `font-display text-xl` title. Line items: 80×100 image,
`text-sm` name, `text-xs text-smoke` variant, quantity stepper in a
`border border-linen` group, `text-xs text-sale underline` remove. Footer sticky
`p-6 border-t border-linen` with subtotal, delivery note and primary block CTA.

### 3.8 Admin shell

`mx-auto max-w-7xl px-6 py-10 grid lg:grid-cols-[220px_1fr] gap-10 items-start`.
Sidebar heading `font-display text-xl`, nav items `px-3 py-2 text-sm rounded`,
active `bg-ink text-white font-semibold`, idle `text-smoke hover:bg-sand`.
Content headings `font-display text-2xl mb-6`.

### 3.9 Feedback & empty states

- **Spinner:** `h-8 w-8 animate-spin rounded-full border-2 border-linen border-t-ink`
  + `text-sm text-smoke` label; optional full-page wrapper.
- **Empty state:** centred, `py-20`, `text-xl` title, `text-sm text-smoke
  max-w-sm` message, optional action.
- **Inline error:** `text-xs text-sale` directly under the field.
- **Inline success/paid:** `text-success`.

### 3.10 Hero & marketing bands

Three layouts in use:

1. **Image hero** — `relative h-[85vh] min-h-[600px]` (About: `h-[50vh]
   min-h-[400px]`), full-bleed `object-cover` image (Home pins focus with
   `object-[50%_30%]`), dark gradient scrim — Home:
   `bg-gradient-to-r from-black/70 via-black/45 to-black/10`, About:
   `from-black/60 to-black/20` — white copy, eyebrow
   `text-xs … tracking-[0.15em] text-white/80`.
2. **Solid promo band** — `bg-accent text-white p-12` with white/80 body copy.
3. **Muted story band** — `bg-sand py-20`, two-column image + copy, standard
   eyebrow → H2 → body → text link.

---

## 4. Content & formatting

- **Voice:** plain, confident, locally grounded. Short sentences, no hype.
  US spellings (`color`, `favorites`, `personalize`), matching the UI labels.
- **Currency:** always via `formatPrice()` — `Intl.NumberFormat('en-TZ', { style:
  'currency', currency: 'TZS', maximumFractionDigits: 0 })`, rendered as
  `TSh 65,000`.
- **Dates:** `formatDate()` / `formatDateTime()` with `en-TZ` — `15 Nov 2026`,
  `15 Nov 2026, 12:07`.
- **Order references:** `MT-01030`.
- **SKUs:** `MT-<3-letter product>-<3-letter colour>-<size>` e.g.
  `MT-KIK-OCE-130X180CM`.
- **Labels:** uppercase + tracking for eyebrows, buttons, table heads, badges;
  everything else sentence case.
- **Numbers:** no decimals in prices; stock counts as plain integers.

---

## 5. Accessibility

What is already in place:

- Icon-only controls have `aria-label`s (cart, search, account, close, menu).
- Headings are semantic and ordered per page.
- Colour pairings meet AA at body sizes (see table in §2.1).
- Disabled states are both visual and semantic (`disabled` + `cursor-not-allowed`).

Known gaps worth fixing before a real launch:

1. **Focus visibility.** `outline-none` on inputs and no `focus-visible` ring on
   buttons/chips. Add a shared
   `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink
   focus-visible:ring-offset-2 focus-visible:ring-offset-cream`.
2. **Tiny secondary text.** `text-[10px]`/`text-[11px]` in `smoke` on `sand`
   sits at the AA boundary; bump to 12px or use `ink`.
3. **Image alt text.** Product images use the product name (good); gallery
   thumbnails use `alt=""` (decorative, acceptable) but the hero/story images
   are descriptive text, not decorative.
4. **Skip link.** None; consider one before `<Navbar />`.

---

## 6. Extending the system

- **Add a colour:** declare `--color-<name>: #hex` inside `@theme` in
  `src/index.css` → utilities appear automatically. Prefer reusing
  `cream/sand/linen/ink/smoke/accent/sale/success` before adding.
- **Add a type style:** compose from the scale above; do not introduce new
  font families. Serif is only for display/headings.
- **New component:** build from panel + hairline + uppercase label primitives;
  keep radius at 0 and avoid shadows.
- **Never** hard-code `#` colours or `font-family` in components — use tokens.
- Repeated class strings (`inputClass`, `labelClass`, `errClass`) are declared
  locally inside pages; if a third page needs them, extract to
  `src/components/ui/`.

---

## 7. File map

| Concern | File |
| --- | --- |
| Tokens, base body/heading styles | `src/index.css` |
| Fonts, document head | `index.html` |
| Brand name/contact, delivery + payment constants | `src/lib/constants.js` |
| Currency/date formatting | `src/lib/format.js` |
| Navbar / footer / cart drawer | `src/components/{Navbar,Footer,CartDrawer}.jsx` |
| Product card / grid / rating | `src/components/{ProductCard,CatalogGrid,RatingStars}.jsx` |
| Loading & empty states | `src/components/Spinner.jsx` |
| Admin shell & KPI card | `src/components/admin/{AdminLayout,StatCard}.jsx` |
| Page-level layout references | `src/pages/Home.jsx`, `ProductPage.jsx`, `Checkout.jsx`, `pages/admin/*` |
