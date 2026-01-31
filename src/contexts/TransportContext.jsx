/**
 * Transport Context
 * 
 * Provides transport client to the entire application.
 * Manages WebSocket connection state and events.
 */

import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { Client } from '@/lib/transport';

const TransportContext = createContext(null);

export function TransportProvider({ children }) {
  const [client, setClient] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [httpConnected, setHttpConnected] = useState(true);
  const clientRef = useRef(null);

  useEffect(() => {
    // Runtime detection based on current hostname (works even with baked-in build URLs)
    const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
    const currentProtocol = typeof window !== 'undefined' ? window.location.protocol : 'https:';
    const isHttps = currentProtocol === 'https:';
    const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
    
    // Toggle: Set VITE_USE_LOCAL=true in .env to force localhost, false or unset for production
    // Vite bakes env vars at build time, so we check the string value
    const envUseLocal = import.meta.env.VITE_USE_LOCAL;
    const forceLocal = envUseLocal === 'true' || envUseLocal === true;
    const forceProduction = envUseLocal === 'false' || envUseLocal === false;
    
    // Runtime detection: use localhost only if forced OR (not forced to production AND actually on localhost)
    const useLocal = forceLocal || (!forceProduction && isLocalhost);
    
    // Create transport client - ALWAYS use current origin for production (runtime detection)
    let apiUrl, wsUrl;
    if (useLocal) {
      // Local development
      apiUrl = (import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8005') + '/api';
      wsUrl = (import.meta.env.VITE_WS_URL_LOCAL || 'ws://localhost:8005/ws');
    } else {
      // Production: ALWAYS use current origin (runtime detection, not baked-in URLs)
      if (typeof window !== 'undefined') {
        const origin = window.location.origin;
        apiUrl = `${origin}/api`;
        wsUrl = isHttps ? `${origin.replace('https://', 'wss://')}/ws` : `${origin.replace('http://', 'ws://')}/ws`;
      } else {
        // Fallback to env vars if window is not available (SSR)
        apiUrl = (import.meta.env.VITE_API_URL || 'https://ts-int.digital') + '/api';
        wsUrl = (import.meta.env.VITE_WS_URL || 'wss://ts-int.digital/ws');
      }
    }
    
    // Ensure production uses wss:// (secure WebSocket)
    const finalWsUrl = !useLocal && wsUrl.startsWith('ws://') 
      ? wsUrl.replace('ws://', 'wss://')
      : wsUrl;
    
    console.log('[Transport] Config:', { 
      envUseLocal,
      forceLocal,
      forceProduction,
      isLocalhost,
      useLocal,
      hostname: currentHostname,
      apiUrl, 
      wsUrl: finalWsUrl 
    });
    
    const transportClient = new Client({
      apiUrl,
      wsUrl: finalWsUrl,
      preferWebSocket: false, // Start with HTTP, enable WS later if needed
      autoConnectWebSocket: true, // Auto-connect WebSocket in background
    });

    clientRef.current = transportClient;
    setClient(transportClient);

    // Listen for WebSocket connection events
    const handleWsConnected = () => {
      console.log('[Transport] WebSocket connected ✓');
      setWsConnected(true);
    };

    const handleWsDisconnected = () => {
      // Don't log disconnection as error - backend might not have WS yet
      setWsConnected(false);
    };

    transportClient.on('ws:connected', handleWsConnected);
    transportClient.on('ws:disconnected', handleWsDisconnected);

    // Cleanup on unmount
    return () => {
      transportClient.off('ws:connected', handleWsConnected);
      transportClient.off('ws:disconnected', handleWsDisconnected);
      transportClient.close();
    };
  }, []);

  const value = {
    client,
    wsConnected,
    httpConnected,
    status: client?.getStatus(),
  };

  return (
    <TransportContext.Provider value={value}>
      {children}
    </TransportContext.Provider>
  );
}

export function useTransport() {
  const context = useContext(TransportContext);
  if (!context) {
    throw new Error('useTransport must be used within TransportProvider');
  }
  return context;
}
