# Matonya — Fashion Store Demo

A portfolio-ready e-commerce storefront for **Matonya**, a fictional Tanzanian
clothing label. Built with React + Vite, Tailwind CSS and Supabase
(PostgreSQL, Auth, Row Level Security, RPC functions).

> **This is a demo.** No real payments are processed and the catalogue,
> customers and orders are seeded sample data.

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill in your Supabase values
npm run dev                  # http://localhost:5173
```

### Environment variables

`.env.local` (and `.env.example` for reference):

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
```

Both values come from **Supabase Dashboard → Project Settings → API**.

---

## Demo accounts

Sign in at `/sign-in`; the screen has one-click buttons that fill these in.

| Role     | Email                  | Password      |
| -------- | ---------------------- | ------------- |
| Admin    | `admin@matonya.co.tz`  | `Matonya2026!` |
| Customer | `demo@matonya.co.tz`   | `Matonya2026!` |

The seed also creates five additional customer accounts
(`amina.kessy@example.com`, `joseph.mwita@example.com`,
`neema.msuya@example.com`, `zawadi.ali@example.com`,
`baraka.mushi@example.com`) — all with the same password — with their own
order history.

The admin account unlocks `/admin`: dashboard KPIs, order management,
inventory adjustment, products and expenses.

---

## Features

**Storefront**
- Home, shop, category filtering, product detail with colour/size variants
- Cart (local storage), checkout with Tanzanian region/district delivery fees
- Checkout remembers each customer's delivery details — prefilled from their
  last order (localStorage for guests, saved to the profile when signed in)
- Customer order history and profile
- Guest checkout (no account required)

**Admin**
- Dashboard: revenue, order counts, low-stock alerts, recent orders
- Orders: status/payment updates
- Inventory: per-variant stock levels and audited adjustments
- Products: create/edit/delete with variants and images
- Expenses: simple business expense tracking

**Backend**
- Stock is validated and decremented atomically inside `place_order()`
- Prices are always read from the database, never trusted from the client
- Every stock change is written to `inventory_movements`
- Row Level Security: customers only see their own orders; admins see all
- Role-escalation guard prevents self-promotion to admin

---

## Design system

The visual language — colour tokens, type scale, spacing, component recipes and
accessibility notes — is documented in [`DESIGN.md`](DESIGN.md). Tokens are
defined once in the `@theme` block of `src/index.css` and consumed as Tailwind
utilities (`bg-cream`, `text-smoke`, `border-linen`, `font-display`).

---

## Database setup

The schema and demo data live in `supabase/`:

| File                  | Purpose                                              |
| --------------------- | ---------------------------------------------------- |
| `supabase/schema.sql` | Tables, triggers, RPC functions, RLS policies         |
| `supabase/seed.sql`   | Demo catalogue, accounts, orders, inventory, expenses |
| `supabase/config.toml`| Supabase CLI config (Postgres 17, seed wired up)      |

### Option A — Supabase SQL Editor (fastest)

1. Create a project at [supabase.com](https://supabase.com).
2. Open **SQL Editor**, paste the contents of `supabase/schema.sql`, run it.
3. Paste and run `supabase/seed.sql`.
4. In **Authentication → URL Configuration**, set the site URL to
   `http://localhost:5173`.
5. Copy the project URL and publishable key into `.env.local`.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref <project-ref>
npx supabase db push          # applies supabase/migrations (if you use them)
# or run the SQL files directly against the remote database
```

The seed is idempotent-ish: it does nothing if products already exist, so it
is safe to paste twice. To fully reset, drop the `public` schema objects and
re-run both files.

### What the seed contains

| Entity              | Rows |
| ------------------- | ---- |
| Categories          | 9    |
| Products            | 21   |
| Product variants    | 192  |
| Product images      | 39   |
| Accounts            | 7    |
| Orders              | 16   |
| Order items         | 32   |
| Payments            | 16   |
| Inventory movements | 230  |
| Expenses            | 14   |

Orders span every status (`pending`, `confirmed`, `processing`, `shipped`,
`delivered`, `cancelled`) and payment method (`cod`, `mpesa`, `tigopesa`,
`airtelmoney`, `card`). Four variants are deliberately low or out of stock so
the admin alerts and storefront sold-out states are demonstrable:

- `MT-SND-TAN-42` — 0 in stock
- `MT-KIT-SAF-M` — 1 in stock
- `MT-TEE-WHI-M` — 3 in stock
- `MT-DEN-IND-L` — 3 in stock

Images are external URLs, so the demo works with no storage setup: mostly
Unsplash for the garments plus Wikimedia Commons for the East African textiles
and beadwork (credits below). For a real deployment, upload to a public
Supabase Storage bucket and store those URLs instead.

### Image credits

The hero, Maasai shuka, kanga, kikoi, beaded cuff and denim jacket photos
come from Wikimedia Commons and are used under their respective licences:

| Product | File | Author | Licence |
| ------- | ---- | ------ | ------- |
| Maasai Shuka Throw | [Rubega (a maasai cloth)](https://commons.wikimedia.org/wiki/File:Rubega_(_a_maasai_cloth).jpg) | Rosemary S Haule | CC0 |
| Maasai Shuka Throw | [Masaai blankets at the Maasai market, Nairobi](https://commons.wikimedia.org/wiki/File:Masaai_blankets_at_the_Maasai_market._Nairobi_Kenya.jpg) | Laurakomanga | CC BY-SA 4.0 |
| Kanga Beach Wrap | [Kanga leso Kenya 01](https://commons.wikimedia.org/wiki/File:Kanga_leso_Kenya_01.jpg) | Avocado isl | CC BY-SA 4.0 |
| Kanga Beach Wrap | [A woman carries objects on the beaches of Zanzibar](https://commons.wikimedia.org/wiki/File:A_woman_carries_objects_on_the_beaches_of_Zanzibar.jpg) | Stechouse42 | CC BY-SA 4.0 |
| Kikoi Throw | [Colorful Kikoi Shukas](https://commons.wikimedia.org/wiki/File:Colorful_Kikoi_Shukas.jpg) | Chancebandit | CC BY-SA 4.0 |
| Kikoi Throw | [Kikoy fabric at the Maasai Market, Nairobi](https://commons.wikimedia.org/wiki/File:Kikoy_fabric_at_the_Maasai_Market_in_Nairobi,_Kenya.jpg) | Laurakomanga | CC BY-SA 4.0 |
| Beaded Maasai Cuff | [Bracelet 11-o.lau-F180.LA1029](https://commons.wikimedia.org/wiki/File:Bracelet_11-o.lau-F180.LA1029.jpg) | Simon Pierre Barrette | CC BY-SA 4.0 |
| Denim Trucker Jacket | [Laughing woman in jean jacket (Unsplash)](https://commons.wikimedia.org/wiki/File:Laughing_woman_in_jean_jacket_(Unsplash).jpg) | Alex Blăjan via Unsplash | CC0 |
| Home hero | [African print brothers](https://commons.wikimedia.org/wiki/File:African_print_brothers.jpg) | Zediajaab | CC BY-SA 4.0 |

---

## Deployment (Vercel)

The frontend is a static Vite build and deploys cleanly to Vercel. Supabase
stays where it is — only the React app is hosted.

1. Import the GitHub repo at [vercel.com/new](https://vercel.com/new), or run
   `npx vercel` from this folder.
2. Framework preset: **Vite** (auto-detected). Build `npm run build`,
   output `dist`.
3. Add the environment variables in **Project → Settings → Environment
   Variables** for Production, Preview and Development:

   ```
   VITE_SUPABASE_URL=https://<project-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=<publishable key>
   ```

4. Deploy. `vercel.json` already rewrites every route to `index.html`, so
   deep links such as `/shop` and `/admin` work on refresh.
5. In **Supabase → Authentication → URL Configuration**, add the deployed
   domain to **Site URL** and **Redirect URLs**.

## Project structure

```
src/
  components/     shared UI (nav, footer, product cards…)
  context/        Auth + Cart providers
  hooks/          React Query data hooks (storefront + admin)
  lib/            Supabase client, brand constants, helpers
  pages/          route pages (storefront, account, admin, auth)
  pages/admin/    admin dashboard sections
supabase/
  schema.sql      database schema, functions, RLS
  seed.sql        demo data
  config.toml     Supabase CLI configuration
```

---

## Notes & limitations

- Payment is recorded, not captured — `payments` is where a real mobile-money
  or card gateway would plug in.
- Email confirmation is enabled for sign-up; configure SMTP in Supabase for
  real email delivery.
- No CMS yet: marketing copy lives in React components. A headless CMS
  (Sanity) is the intended next phase.
