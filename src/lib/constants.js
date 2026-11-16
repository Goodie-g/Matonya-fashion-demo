// Brand & business constants — single place to rebrand the store.
export const BRAND = {
  name: 'Mizizi',
  tagline: 'Rooted in Tanzania',
  city: 'Dar es Salaam',
  phone: '+255 712 345 678',
  whatsapp: '255712345678',
  email: 'hello@mizizi.co.tz',
}

// All 31 regions of Tanzania (mainland + Zanzibar).
export const TZ_REGIONS = [
  'Arusha', 'Dar es Salaam', 'Dodoma', 'Geita', 'Iringa', 'Kagera',
  'Katavi', 'Kigoma', 'Kilimanjaro', 'Lindi', 'Manyara', 'Mara',
  'Mbeya', 'Mjini Magharibi', 'Morogoro', 'Mtwara', 'Mwanza', 'Njombe',
  'Pemba North', 'Pemba South', 'Pwani', 'Rukwa', 'Ruvuma', 'Shinyanga',
  'Simiyu', 'Singida', 'Songwe', 'Tabora', 'Tanga', 'Unguja North',
  'Unguja South',
]

// Must match the delivery rules in supabase/schema.sql → place_order().
export const FREE_DELIVERY_THRESHOLD = 150000
export const DELIVERY_FEE_DAR = 5000
export const DELIVERY_FEE_UPCOUNTRY = 10000

export function deliveryFeeFor(region, subtotal) {
  if (subtotal >= FREE_DELIVERY_THRESHOLD) return 0
  return region === 'Dar es Salaam' ? DELIVERY_FEE_DAR : DELIVERY_FEE_UPCOUNTRY
}

// MVP payment methods. Manual mobile money = customer pays after
// confirmation call; the orders/payments schema is designed so a real
// gateway can be plugged in later (see payments table + provider column).
export const PAYMENT_METHODS = [
  {
    id: 'cod',
    label: 'Cash on Delivery',
    description: 'Pay in cash when your order arrives.',
  },
  {
    id: 'mpesa',
    label: 'M-Pesa',
    description: 'We will call to confirm, then share our Lipa Namba details.',
  },
  {
    id: 'tigopesa',
    label: 'Tigo Pesa',
    description: 'We will call to confirm, then share payment details.',
  },
  {
    id: 'airtelmoney',
    label: 'Airtel Money',
    description: 'We will call to confirm, then share payment details.',
  },
]

export const ORDER_STATUSES = [
  'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled',
]

export const EXPENSE_CATEGORIES = [
  'Packaging', 'Delivery', 'Advertising', 'Supplier', 'Rent', 'Salaries', 'Other',
]

export const INVENTORY_REASONS = ['restock', 'adjustment', 'damage', 'return']
