import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { useAuth } from '../../context/AuthContext'
import { DEMO } from '../../lib/constants'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Enter your password'),
})

export default function SignIn() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [error, setError] = useState('')
  const from = location.state?.from || '/account'

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
  })

  const useDemoAccount = (email) => {
    setValue('email', email, { shouldValidate: true })
    setValue('password', DEMO.password, { shouldValidate: true })
  }

  const onSubmit = async (values) => {
    setError('')
    const { error } = await signIn(values.email, values.password)
    if (error) {
      setError('Invalid email or password.')
      return
    }
    navigate(from, { replace: true })
  }

  const inputClass = 'w-full border border-linen bg-white px-3.5 py-2.5 text-sm outline-none focus:border-ink'

  return (
    <div className="mx-auto max-w-sm px-6 py-20">
      <h1 className="text-3xl mb-2">Sign In</h1>
      <p className="text-sm text-smoke mb-8">
        No account yet?{' '}
        <Link to="/sign-up" className="underline text-ink">Create one</Link>
      </p>

      <div className="border border-linen bg-sand p-4 mb-6">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-smoke mb-2">
          Demo accounts
        </p>
        <p className="text-xs text-smoke leading-relaxed mb-3">
          This is a portfolio demo. Use one of the seeded accounts below — no
          real payments are taken.
        </p>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => useDemoAccount(DEMO.customerEmail)}
            className="text-left text-xs border border-linen bg-white px-3 py-2 hover:border-ink"
          >
            <span className="font-semibold">Customer</span> · {DEMO.customerEmail}
          </button>
          <button
            type="button"
            onClick={() => useDemoAccount(DEMO.adminEmail)}
            className="text-left text-xs border border-linen bg-white px-3 py-2 hover:border-ink"
          >
            <span className="font-semibold">Admin</span> · {DEMO.adminEmail}
          </button>
        </div>
        <p className="text-[11px] text-smoke mt-2">Password: {DEMO.password}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="email">
            Email
          </label>
          <input id="email" type="email" className={inputClass} {...register('email')} />
          {errors.email && <p className="text-xs text-sale mt-1">{errors.email.message}</p>}
        </div>
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" htmlFor="password">
            Password
          </label>
          <input id="password" type="password" className={inputClass} {...register('password')} />
          {errors.password && <p className="text-xs text-sale mt-1">{errors.password.message}</p>}
        </div>

        {error && <p className="text-xs text-sale">{error}</p>}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-3.5 bg-accent text-white text-sm font-semibold uppercase tracking-wider disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>
    </div>
  )
}
