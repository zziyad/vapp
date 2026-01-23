/**
 * Auth Context (v2 - Using Transport Client)
 * 
 * Simplified auth context using the new transport system.
 * Now delegates all network calls to the transport client.
 */

import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { 
  executeTokenRefresh, 
  clearTokenState, 
  setupBroadcastListener,
  closeBroadcastChannel 
} from '@/lib/auth/token-controller'
import { useTransport } from './TransportContext'

const AuthContext = createContext(undefined)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastErrorMessage, setLastErrorMessage] = useState(undefined)

  const { client } = useTransport()

  // Refs to avoid circular dependencies
  const performRefreshRef = useRef(null)
  const logoutRef = useRef(null)

  // Fetch current user data
  const fetchUserData = useCallback(async () => {
    if (!client) return null

    try {
      const result = await client.api.auth.me({})
      
      if (result && result.status === 'success') {
        return result.response
      }
      return null
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      return null
    }
  }, [client])

  // Perform token refresh
  const performRefresh = useCallback(async () => {
    if (!client) return false

    try {
      const result = await client.api.auth.refresh({})
      const refreshed = result?.status === 'refreshed'
      
      if (refreshed && result.response) {
        setUser(result.response)
      }

      return refreshed
    } catch (error) {
      console.error('Failed to refresh tokens:', error)
      return false
    }
  }, [client])

  // Assign to ref
  performRefreshRef.current = performRefresh

  // Refresh tokens (exposed to components)
  const refreshTokens = useCallback(async () => {
    setIsRefreshing(true)
    try {
      const ok = await executeTokenRefresh(performRefresh)
      return ok
    } finally {
      setIsRefreshing(false)
    }
  }, [performRefresh])

  // Check auth status
  const checkAuthStatus = useCallback(async () => {
    try {
      const userData = await fetchUserData()
      if (userData) {
        setUser(userData)
        return
      }

      // If failed, try to refresh tokens
      const refreshSuccess = await refreshTokens()
      if (!refreshSuccess) {
        setUser(null)
      }
    } catch (error) {
      console.error('Failed to check auth status:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }, [fetchUserData, refreshTokens])

  // Login
  const login = useCallback(
    async (email, password) => {
      if (!client) return false

      try {
        setLastErrorMessage(undefined)

        const result = await client.api.auth.signin({ email, password })

        if (result && result.status === 'logged') {
          const userData = await fetchUserData()
          if (userData) {
            setUser(userData)
            await new Promise(resolve => setTimeout(resolve, 50))
            return true
          }
        } else {
          const errorMessage =
            result?.response?.message ||
            result?.response ||
            'Invalid credentials'
          setLastErrorMessage(errorMessage)
          return false
        }
      } catch (error) {
        console.error('Login failed:', error)
        setLastErrorMessage(error.message || 'An unexpected error occurred. Please try again.')
        return false
      }
      return false
    },
    [client, fetchUserData]
  )

  // Logout
  const logout = useCallback(async () => {
    if (!client) return

    try {
      await client.api.auth.logout({})
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUser(null)
      clearTokenState()
    }
  }, [client])

  // Assign to ref
  logoutRef.current = logout

  // Setup cross-tab sync
  useEffect(() => {
    const cleanup = setupBroadcastListener({
      onTokenRefreshed: async () => {
        await checkAuthStatus()
      },
      onLogout: () => {
        setUser(null)
      },
    })

    return () => {
      cleanup()
      closeBroadcastChannel()
    }
  }, [checkAuthStatus])

  // Initial auth check on mount (wait for client)
  useEffect(() => {
    if (client) {
      checkAuthStatus()
    }
  }, [client, checkAuthStatus])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      isRefreshing,
      login,
      logout,
      refreshTokens,
      lastErrorMessage,
    }),
    [user, isLoading, isRefreshing, login, logout, refreshTokens, lastErrorMessage]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
