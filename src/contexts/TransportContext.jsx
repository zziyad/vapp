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
    // Create transport client
    const apiUrl = import.meta.env.VITE_API_URL 
      ? `${import.meta.env.VITE_API_URL}/api`
      : 'http://localhost:8005/api';
    
    const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:8005/ws';
    
    const transportClient = new Client({
      apiUrl,
      wsUrl,
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
