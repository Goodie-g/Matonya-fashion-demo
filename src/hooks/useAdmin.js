import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

function useAdminInvalidator(keys) {
  const queryClient = useQueryClient()
  return () => keys.forEach(k => queryClient.invalidateQueries({ queryKey: [k] }))
}

// ------------------------------------------------------------
// Dashboard
// ------------------------------------------------------------
export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const [ordersRes, customersRes, expensesRes, lowStockRes] = await Promise.all([
        supabase
          .from('orders')
          .select('id, order_number, customer_name, status, payment_status, total, created_at')
          .order('created_at', { ascending: false }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
        supabase.from('expenses').select('amount'),
        supabase
          .from('product_variants')
          .select('id, sku, color, size, stock_quantity, low_stock_threshold, products ( name )')
          .order('stock_quantity', { ascending: true }),
      ])
      for (const r of [ordersRes, customersRes, expensesRes, lowStockRes]) {
        if (r.error) throw r.error
      }

      const orders = ordersRes.data || []
      const valid = orders.filter(o => o.status !== 'cancelled')
      const revenue = valid.reduce((s, o) => s + Number(o.total), 0)
      const expenses = (expensesRes.data || []).reduce((s, e) => s + Number(e.amount), 0)

      return {
        revenue,
        expenses,
        net: revenue - expenses,
        orderCount: orders.length,
        avgOrderValue: valid.length ? revenue / valid.length : 0,
        customerCount: customersRes.count ?? 0,
        recentOrders: orders.slice(0, 6),
        lowStock: (lowStockRes.data || []).filter(v => v.stock_quantity <= v.low_stock_threshold).slice(0, 8),
      }
    },
  })
}

// ------------------------------------------------------------
// Orders
// ------------------------------------------------------------
export function useAdminOrders(statusFilter) {
  return useQuery({
    queryKey: ['admin-orders', statusFilter || 'all'],
    queryFn: async () => {
      let q = supabase
        .from('orders')
        .select('id, order_number, customer_name, phone, region, status, payment_status, payment_method, total, created_at')
        .order('created_at', { ascending: false })
      if (statusFilter) q = q.eq('status', statusFilter)
      const { data, error } = await q
      if (error) throw error
      return data || []
    },
  })
}

export function useAdminOrder(id) {
  return useQuery({
    queryKey: ['admin-order', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items ( id, product_name, variant_label, sku, quantity, unit_price, line_total )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return data
    },
  })
}

export function useUpdateOrder() {
  const invalidate = useAdminInvalidator(['admin-orders', 'admin-order', 'admin-stats'])
  return useMutation({
    mutationFn: async ({ id, ...fields }) => {
      const { error } = await supabase.from('orders').update(fields).eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

// ------------------------------------------------------------
// Products (admin CRUD)
// ------------------------------------------------------------
export function useAdminProducts() {
  return useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, base_price, compare_at_price, tags, is_active, created_at,
          categories ( name ),
          product_images ( image_url, position ),
          product_variants ( id, stock_quantity )
        `)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data || []).map(p => ({
        ...p,
        image: [...(p.product_images || [])].sort((a, b) => a.position - b.position)[0]?.image_url || null,
        variantCount: (p.product_variants || []).length,
        totalStock: (p.product_variants || []).reduce((s, v) => s + v.stock_quantity, 0),
      }))
    },
  })
}

export function useAdminProduct(id) {
  return useQuery({
    queryKey: ['admin-product', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images ( id, image_url, position ),
          product_variants ( id, sku, color, size, price, stock_quantity, low_stock_threshold )
        `)
        .eq('id', id)
        .single()
      if (error) throw error
      return {
        ...data,
        product_images: [...(data.product_images || [])].sort((a, b) => a.position - b.position),
      }
    },
  })
}

// Create or update a product together with its images and variants.
// Variants are upserted on (product_id, color, size) so sales history
// (order_items / inventory_movements) is never destroyed by an edit.
export function useSaveProduct() {
  const invalidate = useAdminInvalidator(['admin-products', 'admin-product', 'products', 'product', 'admin-stats'])
  return useMutation({
    mutationFn: async ({ id, product, images, variants }) => {
      let productId = id

      if (productId) {
        const { error } = await supabase.from('products').update(product).eq('id', productId)
        if (error) throw error
      } else {
        const { data, error } = await supabase.from('products').insert(product).select('id').single()
        if (error) throw error
        productId = data.id
      }

      // Images: safe to replace wholesale (nothing references them).
      const { error: delImgErr } = await supabase.from('product_images').delete().eq('product_id', productId)
      if (delImgErr) throw delImgErr
      if (images.length) {
        const { error } = await supabase
          .from('product_images')
          .insert(images.map((url, i) => ({ product_id: productId, image_url: url, position: i })))
        if (error) throw error
      }

      // Variants: upsert, then delete rows the form no longer contains.
      const { error: varErr } = await supabase
        .from('product_variants')
        .upsert(
          variants.map(v => ({ ...v, product_id: productId })),
          { onConflict: 'product_id,color,size' }
        )
      if (varErr) throw varErr

      const keepKeys = variants.map(v => `${v.color}::${v.size}`)
      const { data: existing, error: fetchErr } = await supabase
        .from('product_variants')
        .select('id, color, size')
        .eq('product_id', productId)
      if (fetchErr) throw fetchErr
      const toDelete = (existing || [])
        .filter(v => !keepKeys.includes(`${v.color}::${v.size}`))
        .map(v => v.id)
      if (toDelete.length) {
        const { error } = await supabase.from('product_variants').delete().in('id', toDelete)
        if (error) throw error
      }

      return productId
    },
    onSuccess: invalidate,
  })
}

// ------------------------------------------------------------
// Inventory
// ------------------------------------------------------------
export function useInventory() {
  return useQuery({
    queryKey: ['admin-inventory'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_variants')
        .select('id, sku, color, size, stock_quantity, low_stock_threshold, products ( name, slug )')
        .order('stock_quantity', { ascending: true })
      if (error) throw error
      return data || []
    },
  })
}

export function useInventoryMovements(variantId) {
  return useQuery({
    queryKey: ['admin-movements', variantId],
    enabled: Boolean(variantId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_movements')
        .select('id, change, reason, note, order_id, created_at')
        .eq('variant_id', variantId)
        .order('created_at', { ascending: false })
        .limit(20)
      if (error) throw error
      return data || []
    },
  })
}

export function useAdjustInventory() {
  const invalidate = useAdminInvalidator(['admin-inventory', 'admin-movements', 'admin-stats', 'products', 'product'])
  return useMutation({
    mutationFn: async ({ variantId, change, reason, note }) => {
      const { error } = await supabase.rpc('adjust_inventory', {
        p_variant_id: variantId,
        p_change: change,
        p_reason: reason,
        p_note: note || '',
      })
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

// ------------------------------------------------------------
// Customers
// ------------------------------------------------------------
export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin-customers'],
    queryFn: async () => {
      const [profilesRes, ordersRes] = await Promise.all([
        supabase.from('profiles').select('id, full_name, email, phone, role, created_at').order('created_at', { ascending: false }),
        supabase.from('orders').select('user_id, total').not('user_id', 'is', null),
      ])
      if (profilesRes.error) throw profilesRes.error
      if (ordersRes.error) throw ordersRes.error

      const byUser = {}
      for (const o of ordersRes.data || []) {
        byUser[o.user_id] = byUser[o.user_id] || { count: 0, spent: 0 }
        byUser[o.user_id].count += 1
        byUser[o.user_id].spent += Number(o.total)
      }
      return (profilesRes.data || []).map(p => ({
        ...p,
        orderCount: byUser[p.id]?.count || 0,
        totalSpent: byUser[p.id]?.spent || 0,
      }))
    },
  })
}

// ------------------------------------------------------------
// Expenses / finance
// ------------------------------------------------------------
export function useExpenses() {
  return useQuery({
    queryKey: ['admin-expenses'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('incurred_on', { ascending: false })
      if (error) throw error
      return data || []
    },
  })
}

export function useAddExpense() {
  const invalidate = useAdminInvalidator(['admin-expenses', 'admin-stats'])
  return useMutation({
    mutationFn: async (expense) => {
      const { error } = await supabase.from('expenses').insert(expense)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}

export function useDeleteExpense() {
  const invalidate = useAdminInvalidator(['admin-expenses', 'admin-stats'])
  return useMutation({
    mutationFn: async (id) => {
      const { error } = await supabase.from('expenses').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: invalidate,
  })
}
