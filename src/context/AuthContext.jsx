import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const AuthContext = createContext(null)
export const useAuth = () => useContext(AuthContext)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
      if (!newSession) setProfile(null)
    })
    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) return
    let cancelled = false
    supabase
      .from('profiles')
      .select('id, full_name, email, phone, role')
      .eq('id', session.user.id)
      .single()
      .then(({ data }) => {
        if (!cancelled) setProfile(data)
      })
    return () => { cancelled = true }
  }, [session?.user?.id])

  const signIn = (email, password) =>
    supabase.auth.signInWithPassword({ email, password })

  const signUp = ({ email, password, fullName, phone }) =>
    supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, phone } },
    })

  const signOut = () => supabase.auth.signOut()

  const value = {
    session,
    user: session?.user || null,
    profile,
    isAdmin: profile?.role === 'admin',
    loading,
    signIn,
    signUp,
    signOut,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
