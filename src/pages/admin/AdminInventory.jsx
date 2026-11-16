import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { History, PackagePlus, X } from 'lucide-react'
import Spinner from '../../components/Spinner'
import { useAdjustInventory, useInventory, useInventoryMovements } from '../../hooks/useAdmin'
import { INVENTORY_REASONS } from '../../lib/constants'
import { formatDateTime } from '../../lib/format'

const adjustSchema = z.object({
  change: z.coerce.number().int().refine(v => v !== 0, 'Enter a non-zero change'),
  reason: z.enum(INVENTORY_REASONS),
  note: z.string().optional(),
})

export default function AdminInventory() {
  const { data: variants, isLoading } = useInventory()
  const [adjusting, setAdjusting] = useState(null)   // variant being adjusted
  const [historyFor, setHistoryFor] = useState(null) // variant whose history is shown

  if (isLoading) return <Spinner />

  return (
    <div>
      <h2 className="font-display text-2xl mb-2">Inventory</h2>
      <p className="text-sm text-smoke mb-6">
        Every stock change is recorded — sales deduct automatically at checkout.
      </p>

      <div className="border border-linen bg-white overflow-x-auto">
        <table className="w-full text-sm min-w-[760px]">
          <thead>
            <tr className="border-b border-linen text-left">
              <Th>SKU</Th>
              <Th>Product</Th>
              <Th>Variant</Th>
              <Th>Stock</Th>
              <Th>Alert at</Th>
              <Th>Status</Th>
              <Th></Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-linen">
            {(variants || []).map(v => {
              const low = v.stock_quantity <= v.low_stock_threshold
              return (
                <tr key={v.id} className="hover:bg-sand/50">
                  <Td><span className="font-mono text-xs">{v.sku}</span></Td>
                  <Td>{v.products?.name}</Td>
                  <Td>{v.color} / {v.size}</Td>
                  <Td><span className="font-semibold">{v.stock_quantity}</span></Td>
                  <Td className="text-smoke">{v.low_stock_threshold}</Td>
                  <Td>
                    <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 ${
                      v.stock_quantity === 0
                        ? 'bg-red-100 text-red-800'
                        : low
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-green-100 text-green-800'
                    }`}>
                      {v.stock_quantity === 0 ? 'Out' : low ? 'Low' : 'OK'}
                    </span>
                  </Td>
                  <Td>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setAdjusting(v)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-smoke hover:text-ink"
                      >
                        <PackagePlus size={13} /> Adjust
                      </button>
                      <button
                        onClick={() => setHistoryFor(v)}
                        className="inline-flex items-center gap-1 text-xs font-semibold text-smoke hover:text-ink"
                      >
                        <History size={13} /> History
                      </button>
                    </div>
                  </Td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {adjusting && <AdjustModal variant={adjusting} onClose={() => setAdjusting(null)} />}
      {historyFor && <HistoryModal variant={historyFor} onClose={() => setHistoryFor(null)} />}
    </div>
  )
}

function AdjustModal({ variant, onClose }) {
  const adjust = useAdjustInventory()
  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(adjustSchema),
    defaultValues: { change: 10, reason: 'restock', note: '' },
  })
  const change = Number(watch('change')) || 0
  const projected = variant.stock_quantity + change

  const onSubmit = async (values) => {
    try {
      await adjust.mutateAsync({
        variantId: variant.id,
        change: values.change,
        reason: values.reason,
        note: values.note,
      })
      onClose()
    } catch {
      // shown below
    }
  }

  const inputClass = 'w-full border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-ink'

  return (
    <Modal onClose={onClose} title={`Adjust stock — ${variant.sku}`}>
      <p className="text-sm text-smoke mb-4">
        {variant.products?.name} · {variant.color} / {variant.size} · current stock{' '}
        <span className="font-semibold text-ink">{variant.stock_quantity}</span>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-smoke mb-1">
              Change (+ / −)
            </label>
            <input type="number" className={inputClass} {...register('change')} />
            {errors.change && <p className="text-xs text-sale mt-1">{errors.change.message}</p>}
          </div>
          <div>
            <label className="block text-[11px] font-semibold uppercase tracking-wider text-smoke mb-1">
              Reason
            </label>
            <select className={inputClass} {...register('reason')}>
              {INVENTORY_REASONS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-smoke mb-1">
            Note (optional)
          </label>
          <input className={inputClass} placeholder="e.g. Supplier delivery, damaged in transit…" {...register('note')} />
        </div>

        {projected < 0 && (
          <p className="text-xs text-sale">Stock cannot go below zero (projected: {projected}).</p>
        )}
        {adjust.isError && (
          <p className="text-xs text-sale">{adjust.error?.message}</p>
        )}

        <button
          type="submit"
          disabled={adjust.isPending || projected < 0}
          className="w-full py-3 bg-ink text-white text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
        >
          {adjust.isPending ? 'Saving…' : `Apply (new stock: ${projected})`}
        </button>
      </form>
    </Modal>
  )
}

function HistoryModal({ variant, onClose }) {
  const { data: movements, isLoading } = useInventoryMovements(variant.id)

  return (
    <Modal onClose={onClose} title={`History — ${variant.sku}`}>
      {isLoading ? (
        <Spinner />
      ) : !movements?.length ? (
        <p className="text-sm text-smoke">No movements recorded yet.</p>
      ) : (
        <div className="divide-y divide-linen max-h-80 overflow-auto">
          {movements.map(m => (
            <div key={m.id} className="py-2.5 flex justify-between items-center gap-4">
              <div>
                <p className="text-sm">
                  <span className={`font-semibold ${m.change > 0 ? 'text-success' : 'text-sale'}`}>
                    {m.change > 0 ? '+' : ''}{m.change}
                  </span>
                  {' '}<span className="capitalize text-smoke">{m.reason}</span>
                  {m.order_id && <span className="text-xs text-smoke"> · order</span>}
                </p>
                {m.note && <p className="text-xs text-smoke">{m.note}</p>}
              </div>
              <p className="text-xs text-smoke whitespace-nowrap">{formatDateTime(m.created_at)}</p>
            </div>
          ))}
        </div>
      )}
    </Modal>
  )
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-cream border border-linen w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-display text-lg">{title}</h3>
          <button onClick={onClose} aria-label="Close"><X size={18} /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

function Th({ children }) {
  return (
    <th className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-smoke">
      {children}
    </th>
  )
}

function Td({ children }) {
  return <td className="px-4 py-3">{children}</td>
}
