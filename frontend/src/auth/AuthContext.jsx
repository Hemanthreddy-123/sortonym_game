import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  // Always logged in as a Guest Player
  const [member, setMember] = useState({
    id: 'guest',
    name: 'Guest Player',
    email: 'guest@sortonym.com'
  })
  const [status, setStatus] = useState('ready')

  const updateMember = useCallback((updatedData) => {
    setMember((prev) => ({ ...prev, ...updatedData }))
  }, [])

  // Mocked empty functions for compatibility with components that might still call them
  const signIn = useCallback(async () => ({ success: true }), [])
  const signInWithOtp = useCallback(async () => ({ success: true }), [])
  const signInWithGoogle = useCallback(async () => ({ success: true }), [])
  const signOut = useCallback(async () => { }, [])
  const refresh = useCallback(async () => { }, [])

  const value = useMemo(
    () => ({
      token: 'guest-session',
      user: { id: 'guest', username: 'guest' },
      member,
      status,
      signIn,
      signInWithOtp,
      signInWithGoogle,
      signOut,
      refresh,
      updateMember
    }),
    [member, status, signIn, signInWithOtp, signInWithGoogle, signOut, refresh, updateMember],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
