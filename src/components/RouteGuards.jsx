import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import Spinner from './Spinner'

export function RequireAuth({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <Spinner fullPage />
  if (!user) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  return children
}

export function RequireAdmin({ children }) {
  const { user, isAdmin, loading, profile } = useAuth()
  const location = useLocation()

  if (loading || (user && !profile)) return <Spinner fullPage />
  if (!user) return <Navigate to="/sign-in" state={{ from: location.pathname }} replace />
  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-md px-6 py-24 text-center">
        <h1 className="text-2xl mb-3">Access denied</h1>
        <p className="text-smoke text-sm">
          This area is restricted to store administrators.
        </p>
      </div>
    )
  }
  return children
}
