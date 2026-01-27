'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { vappAccessRequestApi } from '@/lib/services/vapp/vapp-api-service'
import { toast } from 'sonner'

/**
 * useAccessRequests Hook
 * Fetches list of access requests for current user's department
 * 
 * @param {string} eventId - Event ID
 * @param {Object} filters - Optional filters (status, limit, offset)
 * @returns {Object} Requests data and loading state
 */
export function useAccessRequests(eventId, filters = {}) {
  const { client } = useTransport()
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [total, setTotal] = useState(0)
  const [error, setError] = useState(null)
  const clientRef = useRef(client)

  useEffect(() => {
    clientRef.current = client
  }, [client])

  useEffect(() => {
    if (!eventId || !clientRef.current) {
      setLoading(false)
      return
    }

    let cancelled = false

    const loadRequests = async () => {
      try {
        setLoading(true)
        setError(null)
        const call = (method, payload) => clientRef.current.call(method, payload)
        const result = await vappAccessRequestApi.listMy(call, eventId, filters)
        
        if (cancelled) return

        if (result?.status === 'fulfilled' && result?.response) {
          setRequests(result.response.requests || [])
          setTotal(result.response.total || 0)
        } else {
          const errorMsg = result?.response?.message || 'Failed to load requests'
          setError(errorMsg)
        }
      } catch (err) {
        if (cancelled) return
        const errorMsg = err?.message || 'Failed to load requests'
        setError(errorMsg)
        console.error('Failed to load requests:', err)
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    loadRequests()

    return () => {
      cancelled = true
    }
  }, [eventId, JSON.stringify(filters)])

  const refetch = useCallback(async () => {
    if (!eventId || !clientRef.current) return

    try {
      setLoading(true)
      setError(null)
      const call = (method, payload) => clientRef.current.call(method, payload)
      const result = await vappAccessRequestApi.listMy(call, eventId, filters)
      
      if (result?.status === 'fulfilled' && result?.response) {
        setRequests(result.response.requests || [])
        setTotal(result.response.total || 0)
      } else {
        const errorMsg = result?.response?.message || 'Failed to load requests'
        setError(errorMsg)
        toast.error(errorMsg)
      }
    } catch (err) {
      const errorMsg = err?.message || 'Failed to load requests'
      setError(errorMsg)
      toast.error(errorMsg)
      console.error('Failed to refetch requests:', err)
    } finally {
      setLoading(false)
    }
  }, [eventId, JSON.stringify(filters)])

  return {
    loading,
    requests,
    total,
    error,
    refetch,
  }
}
