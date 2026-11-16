import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

// Orders belonging to the signed-in customer (RLS enforces ownership).
export function useMyOrders(userId) {
  return useQuery({
    queryKey: ['my-orders', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, order_number, status, payment_status, payment_method, total, created_at')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

// Checkout: the whole order is created server-side in one transaction
// (validates stock, prices from DB, decrements inventory, logs movements).
export function usePlaceOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (payload) => {
      const { data, error } = await supabase.rpc('place_order', {
        p_customer_name: payload.customerName,
        p_phone: payload.phone,
        p_email: payload.email || '',
        p_region: payload.region,
        p_city: payload.city,
        p_address: payload.address,
        p_delivery_notes: payload.deliveryNotes || '',
        p_payment_method: payload.paymentMethod,
        p_items: payload.items.map(i => ({ variant_id: i.variantId, quantity: i.quantity })),
      })
      if (error) throw error
      return data // { order_id, order_number, subtotal, delivery_fee, total }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] })
      queryClient.invalidateQueries({ queryKey: ['product'] })
    },
  })
}
