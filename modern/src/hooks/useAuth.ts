/**
 * React hook for Patreon authentication status.
 *
 * Checks /api/auth/check on mount and exposes user info + login/logout helpers.
 */

import { useState, useEffect } from 'react'

export interface AuthUser {
  authenticated: true
  name: string
  email: string
}

export interface AuthState {
  user: AuthUser | null
  loading: boolean
  error: string | null
}

export function useAuth(): AuthState & {
  login: (redirect?: string) => void
  logout: () => void
} {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/auth/check', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((data) => {
        if (data?.authenticated && data?.name) {
          setUser({
            authenticated: true,
            name: data.name,
            email: data.email ?? '',
          })
        } else {
          setUser(null)
        }
      })
      .catch((e) => {
        console.warn('Auth check failed:', e)
        setError('Unable to verify login status')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  const login = (redirect = window.location.pathname) => {
    window.location.href = `/api/auth/login?next=${encodeURIComponent(redirect)}`
  }

  const logout = () => {
    window.location.href = '/api/auth/logout'
  }

  return { user, loading, error, login, logout }
}