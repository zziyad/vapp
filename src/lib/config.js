'use client'

// Centralized client-side configuration for API, WebSocket, queries, and security

export const appConfig = {
  // debug: 'true',
  debug: import.meta.env.VITE_DEBUG === 'true',
  api: {
    // Base URL for the backend (HTTP). Used to derive WS URL when explicit WS is not provided
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:8001',
    // Next.js BFF base path (proxied endpoints)
    bffBasePath: '/api',
    // RPC subpath on the BFF
    rpcPath: '/rpc',
  },
  ws: {
    // Optional explicit WS URL override; if null, it will be derived from api.baseUrl
    url: import.meta.env.VITE_WS_URL || null,
    callTimeoutMs: 7_000,
    pingIntervalMs: 60_000,
    reconnectDelayMs: 2_000,
    waitForConnectedTimeoutMs: 3_000,
  },
  query: {
    retry: false,
    refetchOnReconnect: true,
    refetchOnWindowFocus: false,
    staleTimeMs: 30_000,
    gcTime: 5 * 60 * 1000, // 5 minutes - keep cache longer
  },
  upload: {
    maxRows: 50_000,
    chunkSize: 2_000,
    dryRunThreshold: 50,
  },
  table: {
    virtualizeThreshold: 2_000,
    searchDebounceMs: 300,
  },
  concurrency: {
    wsRetrySemaphore: { concurrency: 1, size: 100, timeoutMs: 5_000 },
  },
  security: {
    xRequestedWithHeader: 'XMLHttpRequest',
  },
}

export function getRpcUrl() {
  const url = `${appConfig.api.bffBasePath}${appConfig.api.rpcPath}`
  return url
}

export function getWsUrl() {
  // Use explicit WS URL if provided via environment variable
  if (appConfig.ws.url) return appConfig.ws.url
  
  if (typeof window !== 'undefined') {
    // Derive WS URL from the current browser origin to keep cookies scoped
    const { protocol, hostname, port } = window.location
    const isHttps = protocol === 'https:'
    const wsProto = isHttps ? 'wss' : 'ws'
    
    // Use WebSocket through nginx on standard ports (80/443)
    // WebSocket endpoint is /ws (proxied to backend:8001 root path)
    if (port && port !== '80' && port !== '443' && port !== '') {
      // Development: use explicit port
      return `${wsProto}://${hostname}:${port}/ws`
    }
    // Production: use standard ports through nginx
    return `${wsProto}://${hostname}/ws`
  }
  
  // Fallback: derive from API base URL
  const httpUrl = appConfig.api.baseUrl
  return httpUrl
    .replace('http://', 'ws://')
    .replace('https://', 'wss://')
    .replace(':8001', '') + '/ws'
}



