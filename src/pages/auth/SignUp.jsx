import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'

const tzPhone = /^(\+255|0)(6|7)\d{8}$/

const schema = z.object({
  fullName: z.string().min(2, 'Please enter your full name'),
  email: z.string().email('Enter a valid email'),
  phone: z.string().regex(tzPhone, 'Enter a valid Tanzanian number, e.g. 0712 345 678'),
  password: z.string().min(6, 'At least 6 characters'),
})

export default function SignUp() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const onSubmit = async (values) => {
    setError('')
    const { error } = await signUp(values)
    if (error) {
      setError(error.message)
      return
    }
    navigate('/account', { replace: true })
  }

  const inputClass = 'w-full border border-linen bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink'
  const labelClass = 'block text-xs font-semibold uppercase tracking-wider mb-1.5'

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-3xl mb-2">Create Account</h1>
      <p className="text-sm text-smoke mb-6">
        Already registered?{' '}
        <Link to="/sign-in" className="underline text-ink">Sign in</Link>
      </p>

      <p className="text-xs text-smoke border border-linen bg-sand px-3 py-2.5 mb-6">
        Demo store — accounts you create here only exist in this demo database.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass} htmlFor="fullName">Full name</label>
          <input id="fullName" className={inputClass} {...register('fullName')} />
          {errors.fullName && <p className="text-xs text-sale mt-1">{errors.fullName.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="email">Email</label>
          <input id="email" type="email" className={inputClass} {...register('email')} />
          {errors.email && <p className="text-xs text-sale mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="phone">Phone</label>
          <input id="phone" placeholder="0712 345 678" className={inputClass} {...register('phone')} />
          {errors.phone && <p className="text-xs text-sale mt-1">{errors.phone.message}</p>}
        </div>
        <div>
          <label className={labelClass} htmlFor="password">Password</label>
          <input id="password" type="password" className={inputClass} {...register('password')} />
          {errors.password && <p className="text-xs text-sale mt-1">{errors.password.message}</p>}
        </div>

        {error && <p className="text-xs text-sale">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-accent text-white text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account…' : 'Create Account'}
        </button>
      </form>
    </div>
  )
}
