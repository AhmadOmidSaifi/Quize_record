import React, { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { tokenStore } from '../api/client'
import { login as loginRequest, register as registerRequest, RegisterPayload } from '../api/auth'

const USERNAME_KEY = 'arena_username'

interface AuthContextValue {
  username: string | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => void
  clearError: () => void
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [username, setUsername] = useState<string | null>(() => localStorage.getItem(USERNAME_KEY))
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => !!tokenStore.access)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setIsAuthenticated(!!tokenStore.access)
  }, [])

  const login = async (uname: string, password: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await loginRequest(uname, password)
      tokenStore.set(res.access, res.refresh)
      localStorage.setItem(USERNAME_KEY, uname)
      setUsername(uname)
      setIsAuthenticated(true)
    } catch (e: any) {
      setError(e?.detail?.detail || 'Invalid username or password')
      throw e
    } finally {
      setLoading(false)
    }
  }

  const register = async (payload: RegisterPayload) => {
    setLoading(true)
    setError(null)
    try {
      await registerRequest(payload)
      await login(payload.username, payload.password)
    } catch (e: any) {
      if (!error) {
        const detail = e?.detail
        const message = detail && typeof detail === 'object'
          ? Object.values(detail).flat().join(' ')
          : 'Could not create account'
        setError(message || 'Could not create account')
      }
      throw e
    } finally {
      setLoading(false)
    }
  }

  const logout = () => {
    tokenStore.clear()
    localStorage.removeItem(USERNAME_KEY)
    setUsername(null)
    setIsAuthenticated(false)
  }

  const clearError = () => setError(null)

  const value = useMemo(
    () => ({ username, isAuthenticated, loading, error, login, register, logout, clearError }),
    [username, isAuthenticated, loading, error]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
