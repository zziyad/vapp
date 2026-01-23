// Centralized configuration for API

export const appConfig = {
  api: {
    // Base URL for the backend API
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8005',
    // RPC endpoint path (backend expects /api prefix)
    rpcPath: '/api',
  },
  security: {
    xRequestedWithHeader: 'XMLHttpRequest',
  },
}

export function getRpcUrl() {
  return `${appConfig.api.baseUrl}${appConfig.api.rpcPath}`
}
