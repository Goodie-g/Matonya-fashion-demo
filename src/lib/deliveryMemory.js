// Remembers a customer's delivery details between checkouts.
//
// Guests are remembered via localStorage only. Signed-in customers get the
// same details saved onto their profile by place_order(), so the address
// follows the account across devices; localStorage stays the freshest source
// for the current device and the profile is the fallback.

const KEY = 'matonya:delivery'

export function loadDeliveryDetails() {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

export function saveDeliveryDetails(details) {
  try {
    localStorage.setItem(
      KEY,
      JSON.stringify({
        customerName: details.customerName || '',
        phone: details.phone || '',
        email: details.email || '',
        region: details.region || '',
        city: details.city || '',
        address: details.address || '',
        deliveryNotes: details.deliveryNotes || '',
        paymentMethod: details.paymentMethod || 'cod',
      })
    )
  } catch {
    // Storage can be unavailable (private mode, quota) — prefilling is a
    // nicety, never a requirement.
  }
}

// Checkout prefill order: what the customer typed last time on this device,
// then their profile (last order on this account, any device), then defaults.
export function buildDeliveryDefaults(profile) {
  const saved = loadDeliveryDetails()
  return {
    customerName: saved?.customerName || profile?.full_name || '',
    phone: saved?.phone || profile?.phone || '',
    email: saved?.email || profile?.email || '',
    region: saved?.region || profile?.default_region || 'Dar es Salaam',
    city: saved?.city || profile?.default_city || '',
    address: saved?.address || profile?.default_address || '',
    deliveryNotes: saved?.deliveryNotes || profile?.default_delivery_notes || '',
    paymentMethod: saved?.paymentMethod || 'cod',
  }
}
