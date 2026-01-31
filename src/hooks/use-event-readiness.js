"use client";

import { useEffect, useState } from "react";
import { useTransport } from "@/contexts/TransportContext";
import { vappConfigApi } from "@/lib/services/vapp/vapp-api-service";
import { ErrorHandler } from "@/lib/transport/ErrorHandler";

/**
 * useEventReadiness Hook
 * @param {string} eventId
 * @returns {{ readiness: 'READY' | 'NOT_READY' | null, loading: boolean }}
 */
export function useEventReadiness(eventId) {
  const { client, wsConnected } = useTransport();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);
  const errorHandler = new ErrorHandler({ debug: false });

  useEffect(() => {
    if (!wsConnected || !eventId || !client?.wsTransport) {
      // Reset to null if not connected (don't show error state)
      if (!wsConnected) {
        setReadiness(null);
        setLoading(false);
      }
      return;
    }

    const call = client.wsTransport.call.bind(client.wsTransport);
    let cancelled = false;

    const loadReadiness = async (retryCount = 0) => {
      if (cancelled) return;
      
      try {
        setLoading(true);
        const result = await vappConfigApi.readiness(call, eventId);

        if (cancelled) return;

        if (result?.status === "fulfilled" && result?.response) {
          const isReady = result.response.isReady || result.response.ready || false;
          setReadiness(isReady ? "READY" : "NOT_READY");
        } else {
          setReadiness("NOT_READY");
        }
      } catch (error) {
        if (cancelled) return;
        
        // Check if it's a retryable error
        const isRetryable = errorHandler.isRetryable(error);
        
        // Retry on retryable errors (up to 2 times)
        if (isRetryable && retryCount < 2 && wsConnected) {
          // Wait a bit and retry
          await new Promise(resolve => setTimeout(resolve, 1000 * (retryCount + 1)));
          if (!cancelled && wsConnected) {
            return loadReadiness(retryCount + 1);
          }
        }
        
        // Handle error with appropriate logging
        errorHandler.handleError(error, { operation: 'loadReadiness', eventId });
        
        setReadiness("NOT_READY");
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadReadiness();
    
    return () => {
      cancelled = true;
    };
  }, [wsConnected, eventId, client]);

  return { readiness, loading };
}
