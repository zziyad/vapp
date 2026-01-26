"use client";

import { useEffect, useState } from "react";
import { useTransport } from "@/contexts/TransportContext";
import { vappConfigApi } from "@/lib/services/vapp/vapp-api-service";

/**
 * useEventReadiness Hook
 * @param {string} eventId
 * @returns {{ readiness: 'READY' | 'NOT_READY' | null, loading: boolean }}
 */
export function useEventReadiness(eventId) {
  const { client, wsConnected } = useTransport();
  const [readiness, setReadiness] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!wsConnected || !eventId || !client?.wsTransport) return;

    const call = client.wsTransport.call.bind(client.wsTransport);

    const loadReadiness = async () => {
      try {
        setLoading(true);
        const result = await vappConfigApi.readiness(call, eventId);

        if (result?.status === "fulfilled" && result?.response) {
          const isReady = result.response.isReady || result.response.ready || false;
          setReadiness(isReady ? "READY" : "NOT_READY");
        } else {
          setReadiness("NOT_READY");
        }
      } catch (error) {
        console.error("Failed to load readiness:", error);
        setReadiness("NOT_READY");
      } finally {
        setLoading(false);
      }
    };

    loadReadiness();
  }, [wsConnected, eventId, client]);

  return { readiness, loading };
}
