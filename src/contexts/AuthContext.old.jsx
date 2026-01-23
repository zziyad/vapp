import { createContext, useContext, useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { getRpcUrl, appConfig } from '@/lib/config'
import { 
  executeTokenRefresh, 
  clearTokenState, 
  setupBroadcastListener,
  closeBroadcastChannel 
} from '@/lib/auth/token-controller'

const AuthContext = createContext(undefined)

const RPC_URL = getRpcUrl()
const API_URL = appConfig.api.baseUrl

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastErrorMessage, setLastErrorMessage] = useState(undefined)

  // Refs to avoid circular dependencies
  const performRefreshRef = useRef(null)
  const logoutRef = useRef(null)

  // Simple fetch with credentials
  const simpleFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'X-Requested-With': appConfig.security.xRequestedWithHeader,
      ...(options.headers || {}),
    }

    return await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })
  }, [])

  // Authenticated fetch with automatic retry on 401
  const authenticatedFetch = useCallback(async (url, options = {}) => {
    const headers = {
      'X-Requested-With': appConfig.security.xRequestedWithHeader,
      ...(options.headers || {}),
    }

    let response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    })

    // Handle 401 - try to refresh token
    if (response.status === 401) {
      try {
        setIsRefreshing(true)
        const ok = await executeTokenRefresh(performRefreshRef.current)
        setIsRefreshing(false)

        if (ok) {
          // Retry request with fresh token
          return fetch(url, {
            ...options,
            headers,
            credentials: 'include',
          })
        }
        
        // Refresh failed, logout
        await logoutRef.current()
      } catch {
        setIsRefreshing(false)
        await logoutRef.current()
      }
    }

    return response
  }, [])

  // Fetch current user data
  const fetchUserData = useCallback(async () => {
    try {
      const requestBody = {
        type: 'call',
        id: '1',
        method: 'auth/me',
        args: {},
      }

      const res = await authenticatedFetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })

      if (res.ok) {
        const text = await res.text()
        if (!text || text.trim().length === 0) {
          console.error('Empty response from server')
          return null
        }
        
        const data = JSON.parse(text)
        if (data.result && data.result.status === 'success') {
          return data.result.response
        }
      }
      return null
    } catch (error) {
      console.error('Failed to fetch user data:', error)
      return null
    }
  }, [authenticatedFetch])

  // Perform token refresh
  const performRefresh = useCallback(async () => {
    try {
      const res = await simpleFetch(`${API_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!res.ok) {
        return false
      }

      const text = await res.text()
      if (!text || text.trim().length === 0) {
        return false
      }

      const data = JSON.parse(text)
      const refreshed = data?.result?.status === 'refreshed'
      
      if (refreshed && data.result.response) {
        // Update user with refreshed data
        setUser(data.result.response)
      }

      return refreshed
    } catch (error) {
      console.error('Failed to refresh tokens:', error)
      return false
    }
  }, [simpleFetch])

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
      // Try to get current user
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
      try {
        setLastErrorMessage(undefined)

        const requestBody = {
          type: 'call',
          id: '1',
          method: 'auth/signin',
          args: { email, password },
        }

        const res = await simpleFetch(RPC_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        })

        if (!res.ok) {
          setLastErrorMessage('Login failed. Please check your credentials.')
          return false
        }

        const text = await res.text()
        
        if (!text || text.trim().length === 0) {
          console.error('Empty response from server')
          setLastErrorMessage('Server returned empty response')
          return false
        }

        const data = JSON.parse(text)

        if (data.result && data.result.status === 'logged') {
          const userData = await fetchUserData()
          if (userData) {
            setUser(userData)
            return true
          }
        } else {
          const errorMessage =
            data?.error?.message ||
            data?.result?.response ||
            'Invalid credentials'
          setLastErrorMessage(errorMessage)
          return false
        }
      } catch (error) {
        console.error('Login failed:', error)
        setLastErrorMessage('An unexpected error occurred. Please try again.')
        return false
      }
      return false
    },
    [simpleFetch, fetchUserData]
  )

  // Logout
  const logout = useCallback(async () => {
    try {
      const requestBody = {
        type: 'call',
        id: '1',
        method: 'auth/logout',
        args: {},
      }

      await simpleFetch(RPC_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      })
    } catch (error) {
      console.error('Logout request failed:', error)
    } finally {
      setUser(null)
      clearTokenState()
    }
  }, [simpleFetch])

  // Assign to ref
  logoutRef.current = logout

  // Setup cross-tab sync
  useEffect(() => {
    const cleanup = setupBroadcastListener({
      onTokenRefreshed: async () => {
        // Token refreshed in another tab, re-check auth status
        await checkAuthStatus()
      },
      onLogout: () => {
        // Logout in another tab
        setUser(null)
      },
    })

    return () => {
      cleanup()
      closeBroadcastChannel()
    }
  }, [checkAuthStatus])

  // Initial auth check on mount
  useEffect(() => {
    checkAuthStatus()
  }, [checkAuthStatus])

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
