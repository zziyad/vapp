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
    // Toggle: Set VITE_USE_LOCAL=true in .env to force localhost, false or unset for production
    // If VITE_USE_LOCAL is not set, auto-detect based on hostname
    const forceLocal = import.meta.env.VITE_USE_LOCAL === 'true';
    const forceProduction = import.meta.env.VITE_USE_LOCAL === 'false';
    const autoDetectLocal = typeof window !== 'undefined' && 
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
    
    const useLocal = forceLocal || (!forceProduction && autoDetectLocal);
    
    // Create transport client
    const apiUrl = useLocal
      ? (import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:8005') + '/api'
      : (import.meta.env.VITE_API_URL || 'https://ts-int.digital') + '/api';
    
    const wsUrl = useLocal
      ? (import.meta.env.VITE_WS_URL_LOCAL || 'ws://localhost:8005/ws')
      : (import.meta.env.VITE_WS_URL || 'wss://ts-int.digital/ws');
    
    // Ensure production uses wss:// (secure WebSocket)
    const finalWsUrl = !useLocal && wsUrl.startsWith('ws://') 
      ? wsUrl.replace('ws://', 'wss://')
      : wsUrl;
    
    console.log('[Transport] Mode:', useLocal ? 'LOCAL' : 'PRODUCTION', { apiUrl, wsUrl: finalWsUrl });
    
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
