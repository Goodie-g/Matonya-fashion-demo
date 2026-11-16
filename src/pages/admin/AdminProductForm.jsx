import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useFieldArray, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2 } from 'lucide-react'
import Spinner from '../../components/Spinner'
import { useAdminProduct, useSaveProduct } from '../../hooks/useAdmin'
import { useCategories } from '../../hooks/useProducts'

const variantSchema = z.object({
  color: z.string().min(1, 'Required'),
  size: z.string().min(1, 'Required'),
  sku: z.string().min(3, 'Required'),
  price: z.coerce.number().positive().optional().or(z.literal('')),
  stockQuantity: z.coerce.number().int().min(0),
  lowStockThreshold: z.coerce.number().int().min(0),
})

const productSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  slug: z.string().min(2).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and dashes only'),
  categoryId: z.coerce.number().min(1, 'Choose a category'),
  basePrice: z.coerce.number().positive('Price must be greater than 0'),
  compareAtPrice: z.coerce.number().positive().optional().or(z.literal('')),
  tags: z.array(z.string()),
  description: z.string().min(10, 'Add a short description'),
  features: z.string(),
  isActive: z.boolean(),
  images: z.array(z.object({ url: z.string().url('Must be a valid URL').or(z.literal('')) })),
  variants: z.array(variantSchema).min(1, 'Add at least one variant'),
})

const TAG_OPTIONS = ['new', 'bestseller', 'sale']

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

export default function AdminProductForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const { data: categories } = useCategories()
  const { data: existing, isLoading } = useAdminProduct(isEdit ? id : null)
  const saveProduct = useSaveProduct()

  const {
    register, control, handleSubmit, watch, setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '', slug: '', categoryId: 0, basePrice: '', compareAtPrice: '',
      tags: [], description: '', features: '', isActive: true,
      images: [{ url: '' }],
      variants: [{ color: '', size: '', sku: '', price: '', stockQuantity: 10, lowStockThreshold: 5 }],
    },
  })

  const imagesField = useFieldArray({ control, name: 'images' })
  const variantsField = useFieldArray({ control, name: 'variants' })

  // Populate the form when editing.
  useEffect(() => {
    if (!existing) return
    setValue('name', existing.name)
    setValue('slug', existing.slug)
    setValue('categoryId', existing.category_id ?? 0)
    setValue('basePrice', existing.base_price)
    setValue('compareAtPrice', existing.compare_at_price ?? '')
    setValue('tags', existing.tags || [])
    setValue('description', existing.description || '')
    setValue('features', (existing.features || []).join('\n'))
    setValue('isActive', existing.is_active)
    setValue('images', existing.product_images.length ? existing.product_images.map(i => ({ url: i.image_url })) : [{ url: '' }])
    setValue('variants', existing.product_variants.map(v => ({
      color: v.color,
      size: v.size,
      sku: v.sku,
      price: v.price ?? '',
      stockQuantity: v.stock_quantity,
      lowStockThreshold: v.low_stock_threshold,
    })))
  }, [existing, setValue])

  const nameValue = watch('name')

  const suggestSku = (index) => {
    const color = watch(`variants.${index}.color`) || ''
    const size = watch(`variants.${index}.size`) || ''
    const prefix = 'MT-' + (slugify(nameValue).split('-').map(w => w[0]).join('').slice(0, 3) || 'PRD').toUpperCase()
    const c = color.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase()
    const s = size.replace(/[^A-Za-z0-9]/g, '').toUpperCase()
    if (c && s) setValue(`variants.${index}.sku`, `${prefix}-${c}-${s}`)
  }

  const onSubmit = async (values) => {
    try {
      await saveProduct.mutateAsync({
        id: isEdit ? Number(id) : undefined,
        product: {
          name: values.name,
          slug: values.slug,
          category_id: values.categoryId,
          base_price: values.basePrice,
          compare_at_price: values.compareAtPrice || null,
          tags: values.tags,
          description: values.description,
          features: values.features.split('\n').map(f => f.trim()).filter(Boolean),
          is_active: values.isActive,
        },
        images: values.images.map(i => i.url.trim()).filter(Boolean),
        variants: values.variants.map(v => ({
          color: v.color,
          size: v.size,
          sku: v.sku,
          price: v.price === '' ? null : v.price,
          stock_quantity: v.stockQuantity,
          low_stock_threshold: v.lowStockThreshold,
        })),
      })
      navigate('/admin/products')
    } catch {
      // surfaced below from mutation state
    }
  }

  if (isEdit && isLoading) return <Spinner />

  const inputClass = 'w-full border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-ink'
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-smoke mb-1'
  const errClass = 'text-xs text-sale mt-0.5'

  return (
    <div>
      <h2 className="font-display text-2xl mb-6">{isEdit ? 'Edit Product' : 'New Product'}</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-3xl">
        {/* Basics */}
        <section className="border border-linen bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider">Basics</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Name</label>
              <input
                className={inputClass}
                {...register('name')}
                onBlur={(e) => {
                  if (!isEdit && !watch('slug')) setValue('slug', slugify(e.target.value))
                }}
              />
              {errors.name && <p className={errClass}>{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Slug (URL)</label>
              <input className={inputClass} {...register('slug')} />
              {errors.slug && <p className={errClass}>{errors.slug.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Category</label>
              <select className={inputClass} {...register('categoryId')}>
                <option value={0}>Choose…</option>
                {(categories || []).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.categoryId && <p className={errClass}>{errors.categoryId.message}</p>}
            </div>
            <div className="flex items-end gap-3 pb-1">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" {...register('isActive')} />
                Visible in store
              </label>
            </div>
            <div>
              <label className={labelClass}>Base price (TZS)</label>
              <input type="number" className={inputClass} {...register('basePrice')} />
              {errors.basePrice && <p className={errClass}>{errors.basePrice.message}</p>}
            </div>
            <div>
              <label className={labelClass}>Compare-at price (optional)</label>
              <input type="number" className={inputClass} {...register('compareAtPrice')} />
              {errors.compareAtPrice && <p className={errClass}>{errors.compareAtPrice.message}</p>}
            </div>
          </div>
          <div>
            <label className={labelClass}>Tags</label>
            <div className="flex gap-4">
              {TAG_OPTIONS.map(tag => (
                <label key={tag} className="flex items-center gap-2 text-sm capitalize">
                  <input type="checkbox" value={tag} {...register('tags')} />
                  {tag}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className={labelClass}>Description</label>
            <textarea rows={3} className={inputClass} {...register('description')} />
            {errors.description && <p className={errClass}>{errors.description.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Features (one per line)</label>
            <textarea rows={4} className={inputClass} {...register('features')} />
          </div>
        </section>

        {/* Images */}
        <section className="border border-linen bg-white p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Images</h3>
            <button
              type="button"
              onClick={() => imagesField.append({ url: '' })}
              className="flex items-center gap-1 text-xs font-semibold text-smoke hover:text-ink"
            >
              <Plus size={14} /> Add image
            </button>
          </div>
          <p className="text-xs text-smoke">
            Paste image URLs (e.g. from your Supabase Storage bucket). First image is the cover.
          </p>
          {imagesField.fields.map((field, i) => (
            <div key={field.id} className="flex gap-2">
              <input className={inputClass} placeholder="https://…" {...register(`images.${i}.url`)} />
              <button
                type="button"
                onClick={() => imagesField.remove(i)}
                className="px-2 text-smoke hover:text-sale"
                aria-label="Remove image"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </section>

        {/* Variants */}
        <section className="border border-linen bg-white p-5 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-semibold uppercase tracking-wider">Variants (color × size)</h3>
            <button
              type="button"
              onClick={() => variantsField.append({ color: '', size: '', sku: '', price: '', stockQuantity: 10, lowStockThreshold: 5 })}
              className="flex items-center gap-1 text-xs font-semibold text-smoke hover:text-ink"
            >
              <Plus size={14} /> Add variant
            </button>
          </div>
          {errors.variants?.root && <p className={errClass}>{errors.variants.root.message}</p>}

          <div className="space-y-3">
            {variantsField.fields.map((field, i) => (
              <div key={field.id} className="grid grid-cols-2 sm:grid-cols-[1fr_1fr_1.4fr_1fr_1fr_1fr_auto] gap-2 items-end border border-linen p-3">
                <div>
                  <label className={labelClass}>Color</label>
                  <input className={inputClass} {...register(`variants.${i}.color`)} onBlur={() => suggestSku(i)} />
                </div>
                <div>
                  <label className={labelClass}>Size</label>
                  <input className={inputClass} {...register(`variants.${i}.size`)} onBlur={() => suggestSku(i)} />
                </div>
                <div>
                  <label className={labelClass}>SKU</label>
                  <input className={inputClass} {...register(`variants.${i}.sku`)} />
                </div>
                <div>
                  <label className={labelClass}>Price (opt.)</label>
                  <input type="number" className={inputClass} {...register(`variants.${i}.price`)} />
                </div>
                <div>
                  <label className={labelClass}>Stock</label>
                  <input type="number" className={inputClass} {...register(`variants.${i}.stockQuantity`)} />
                </div>
                <div>
                  <label className={labelClass}>Low alert</label>
                  <input type="number" className={inputClass} {...register(`variants.${i}.lowStockThreshold`)} />
                </div>
                <button
                  type="button"
                  onClick={() => variantsField.remove(i)}
                  className="p-2 text-smoke hover:text-sale"
                  aria-label="Remove variant"
                >
                  <Trash2 size={16} />
                </button>
                {(errors.variants?.[i]?.color || errors.variants?.[i]?.size || errors.variants?.[i]?.sku) && (
                  <p className={`${errClass} col-span-full`}>
                    Each variant needs a color, size and SKU.
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>

        {saveProduct.isError && (
          <p className="text-sm text-sale">
            Could not save product: {saveProduct.error?.message}
          </p>
        )}

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={isSubmitting || saveProduct.isPending}
            className="px-8 py-3.5 bg-ink text-white text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
          >
            {saveProduct.isPending ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Product'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin/products')}
            className="px-8 py-3.5 border border-linen text-sm font-semibold uppercase tracking-wider"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
