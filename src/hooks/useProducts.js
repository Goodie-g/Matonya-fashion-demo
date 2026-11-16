import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabaseClient'

const PRODUCT_CARD_SELECT = `
  id, name, slug, base_price, compare_at_price, tags, rating, review_count,
  categories ( slug ),
  product_images ( image_url, position ),
  product_variants ( price, stock_quantity )
`

// Shape a DB product into what the storefront cards need.
function toCardProduct(p) {
  const images = [...(p.product_images || [])].sort((a, b) => a.position - b.position)
  const variantPrices = (p.product_variants || []).map(v => v.price ?? p.base_price)
  const price = variantPrices.length ? Math.min(...variantPrices) : Number(p.base_price)
  const totalStock = (p.product_variants || []).reduce((s, v) => s + v.stock_quantity, 0)
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: Number(price),
    compareAt: p.compare_at_price != null ? Number(p.compare_at_price) : null,
    tags: p.tags || [],
    rating: Number(p.rating),
    reviewCount: p.review_count,
    image: images[0]?.image_url || null,
    categorySlug: p.categories?.slug || null,
    totalStock,
  }
}

async function fetchProducts() {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_CARD_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data || []).map(toCardProduct)
}

export function useProducts() {
  return useQuery({ queryKey: ['products'], queryFn: fetchProducts })
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('categories')
        .select('id, name, slug')
        .order('name')
      if (error) throw error
      return data || []
    },
  })
}

export function useProduct(slug) {
  return useQuery({
    queryKey: ['product', slug],
    enabled: Boolean(slug),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, slug, description, features, base_price, compare_at_price,
          tags, rating, review_count,
          categories ( name, slug ),
          product_images ( image_url, position ),
          product_variants ( id, sku, color, size, price, stock_quantity, low_stock_threshold )
        `)
        .eq('slug', slug)
        .single()
      if (error) throw error

      const images = [...(data.product_images || [])].sort((a, b) => a.position - b.position)
      const variants = (data.product_variants || []).map(v => ({
        ...v,
        price: Number(v.price ?? data.base_price),
      }))
      return {
        ...data,
        base_price: Number(data.base_price),
        compare_at_price: data.compare_at_price != null ? Number(data.compare_at_price) : null,
        images: images.map(i => i.image_url),
        variants,
        colors: [...new Set(variants.map(v => v.color))],
        sizes: [...new Set(variants.map(v => v.size))],
      }
    },
  })
}

export function useRelatedProducts(product) {
  const { data: all } = useProducts()
  if (!product || !all) return []
  return all
    .filter(p => p.slug !== product.slug && p.categorySlug === product.categories?.slug)
    .slice(0, 4)
}
