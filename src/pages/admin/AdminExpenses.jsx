import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Trash2 } from 'lucide-react'
import Spinner from '../../components/Spinner'
import StatCard from '../../components/admin/StatCard'
import { useAddExpense, useDeleteExpense, useExpenses } from '../../hooks/useAdmin'
import { EXPENSE_CATEGORIES } from '../../lib/constants'
import { formatDate, formatPrice } from '../../lib/format'

const expenseSchema = z.object({
  category: z.enum(EXPENSE_CATEGORIES),
  description: z.string().min(3, 'Describe the expense'),
  amount: z.coerce.number().positive('Amount must be greater than 0'),
  incurred_on: z.string().min(1, 'Pick a date'),
})

export default function AdminExpenses() {
  const { data: expenses, isLoading } = useExpenses()
  const addExpense = useAddExpense()
  const deleteExpense = useDeleteExpense()

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      category: 'Supplier',
      description: '',
      amount: '',
      incurred_on: new Date().toISOString().slice(0, 10),
    },
  })

  const total = (expenses || []).reduce((s, e) => s + Number(e.amount), 0)

  const onSubmit = async (values) => {
    await addExpense.mutateAsync(values)
    reset({ category: values.category, description: '', amount: '', incurred_on: values.incurred_on })
  }

  const inputClass = 'w-full border border-linen bg-white px-3 py-2 text-sm outline-none focus:border-ink'
  const labelClass = 'block text-[11px] font-semibold uppercase tracking-wider text-smoke mb-1'

  return (
    <div>
      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <h2 className="font-display text-2xl">Expenses</h2>
        <div className="w-56">
          <StatCard label="Total Expenses" value={formatPrice(total)} />
        </div>
      </div>

      {/* Add expense */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="border border-linen bg-white p-5 mb-8 grid sm:grid-cols-[140px_1fr_160px_150px_auto] gap-3 items-end"
      >
        <div>
          <label className={labelClass}>Category</label>
          <select className={inputClass} {...register('category')}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Description</label>
          <input className={inputClass} placeholder="e.g. Fabric from Kariakoo" {...register('description')} />
          {errors.description && <p className="text-xs text-sale mt-1">{errors.description.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Amount (TZS)</label>
          <input type="number" className={inputClass} {...register('amount')} />
          {errors.amount && <p className="text-xs text-sale mt-1">{errors.amount.message}</p>}
        </div>
        <div>
          <label className={labelClass}>Date</label>
          <input type="date" className={inputClass} {...register('incurred_on')} />
        </div>
        <button
          type="submit"
          disabled={addExpense.isPending}
          className="px-6 py-2.5 bg-ink text-white text-xs font-semibold uppercase tracking-wider disabled:opacity-60"
        >
          {addExpense.isPending ? 'Adding…' : 'Add'}
        </button>
      </form>

      {isLoading ? (
        <Spinner />
      ) : (
        <div className="border border-linen bg-white overflow-x-auto">
          <table className="w-full text-sm min-w-[640px]">
            <thead>
              <tr className="border-b border-linen text-left">
                <Th>Date</Th>
                <Th>Category</Th>
                <Th>Description</Th>
                <Th>Amount</Th>
                <Th></Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-linen">
              {(expenses || []).map(e => (
                <tr key={e.id} className="hover:bg-sand/50">
                  <Td className="text-smoke">{formatDate(e.incurred_on)}</Td>
                  <Td>
                    <span className="text-[10px] font-semibold uppercase tracking-wider bg-sand px-2 py-0.5">
                      {e.category}
                    </span>
                  </Td>
                  <Td>{e.description}</Td>
                  <Td className="font-semibold">{formatPrice(e.amount)}</Td>
                  <Td>
                    <button
                      onClick={() => deleteExpense.mutate(e.id)}
                      className="text-smoke hover:text-sale"
                      aria-label="Delete expense"
                    >
                      <Trash2 size={15} />
                    </button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
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
