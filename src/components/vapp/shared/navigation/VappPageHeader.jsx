"use client";

import { useState, useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { useTransport } from "@/contexts/TransportContext";
import { getEventAggregate } from "@/aggregates/event/get-event-aggregate";
import { vappAccessRequestApi } from "@/lib/services/vapp/vapp-api-service";
import { WorkspaceTabs } from "./WorkspaceTabs";
import { Clock } from "lucide-react";

export function VappPageHeader({ eventId, pageTitle, pageDescription }) {
  const location = useLocation();
  const { client } = useTransport();
  const [event, setEvent] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  const workspaceName = (() => {
    const match = location?.pathname?.match(/\/vapp\/(requester|ops|admin)/);
    if (!match) return "VAPP";

    const ws = match[1];
    const names = {
      requester: "Requester Portal",
      ops: "Operations Console",
      admin: "Manager / Config",
    };
    return names[ws] || "VAPP";
  })();

  const isRequesterPage = location?.pathname?.includes("/vapp/requester");

  // Load event for deadline configuration (only for requester pages)
  const eventAggregate = useMemo(() => {
    if (!client || !eventId || !isRequesterPage) return null;
    return getEventAggregate(eventId, client);
  }, [client, eventId, isRequesterPage]);

  useEffect(() => {
    if (!eventAggregate?.events || !eventId) return;

    const loadEvent = async (retryCount = 0) => {
      try {
        await eventAggregate.events.detail(eventId);
      } catch (err) {
        // Check if it's a WebSocket connection error
        const isConnectionError = err?.target || 
          (err?.message && (err.message.includes('WebSocket') || err.message.includes('Connection')));
        
        if (isConnectionError) {
          // Retry on connection errors (max 2 retries)
          if (retryCount < 2) {
            console.log(`[VappPageHeader] Retrying loadEvent (attempt ${retryCount + 1})...`);
            setTimeout(() => loadEvent(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
          // Silently fail after retries - this is non-critical (just deadline config)
          console.warn("[VappPageHeader] Failed to load event after retries (connection error)");
        } else {
          console.error("Failed to load event:", err);
        }
      }
    };

    loadEvent();

    const unsubscribe = eventAggregate.events.subscribe((state) => {
      if (state.detail) {
        setEvent(state.detail);
      }
    });

    return unsubscribe;
  }, [eventAggregate, eventId]);

  // Load submitted requests to find the most recent one within deadline
  useEffect(() => {
    if (!client || !eventId || !isRequesterPage || !event?.settings?.vapp?.request_edit_deadline_hours) return;

    const deadlineHours = event.settings.vapp.request_edit_deadline_hours;
    if (deadlineHours <= 0) return;

    const loadRequests = async () => {
      try {
        const call = (method, payload) => client.call(method, payload);
        const result = await vappAccessRequestApi.listMy(call, eventId, { status: 'submitted' });
        const requests = result?.response?.requests || [];

        // Find the most recent submitted request that's still within deadline
        const now = new Date();
        const deadlineMs = deadlineHours * 60 * 60 * 1000;

        const activeRequests = requests
          .filter(req => req.submitted_at)
          .map(req => {
            const submittedAt = new Date(req.submitted_at);
            const timeSinceSubmission = now.getTime() - submittedAt.getTime();
            const remaining = deadlineMs - timeSinceSubmission;
            return { ...req, remaining };
          })
          .filter(req => req.remaining > 0)
          .sort((a, b) => new Date(b.submitted_at) - new Date(a.submitted_at));

        if (activeRequests.length > 0) {
          setActiveRequest(activeRequests[0]);
        } else {
          setActiveRequest(null);
        }
      } catch (err) {
        // Check if it's a WebSocket connection error
        const isConnectionError = err?.target || 
          (err?.message && (err.message.includes('WebSocket') || err.message.includes('Connection')));
        
        if (isConnectionError) {
          // Silently fail - this is non-critical (just countdown timer)
          console.warn('[VappPageHeader] Failed to load requests for countdown (connection error)');
        } else {
          console.error('Failed to load requests for countdown:', err);
        }
      }
    };

    loadRequests();
    const interval = setInterval(loadRequests, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [client, eventId, isRequesterPage, event?.settings?.vapp?.request_edit_deadline_hours]);

  // Update countdown timer every second
  useEffect(() => {
    if (!activeRequest || !event?.settings?.vapp?.request_edit_deadline_hours) {
      setTimeRemaining(null);
      return;
    }

    const deadlineHours = event.settings.vapp.request_edit_deadline_hours;
    const updateCountdown = () => {
      const submittedAt = new Date(activeRequest.submitted_at);
      const now = new Date();
      const deadlineMs = deadlineHours * 60 * 60 * 1000;
      const timeSinceSubmission = now.getTime() - submittedAt.getTime();
      const remaining = deadlineMs - timeSinceSubmission;
      setTimeRemaining(remaining > 0 ? remaining : 0);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [activeRequest, event?.settings?.vapp?.request_edit_deadline_hours]);

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">VAPP</h1>
      <p className="text-lg text-gray-600 mb-6">{workspaceName}</p>

      <div className="mb-6" />

      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <h2 className="text-3xl font-bold mb-2">{pageTitle}</h2>
          {pageDescription && (
            <p className="text-gray-600 mb-4">{pageDescription}</p>
          )}
        </div>

        {/* Deadline Configuration - Show on all requester pages as Warning */}
        {isRequesterPage && event?.settings?.vapp?.request_edit_deadline_hours !== undefined && (
          <div className="rounded-lg border-2 border-yellow-400 dark:border-yellow-600 bg-yellow-50 dark:bg-yellow-950/30 p-4 text-sm min-w-[315px] mt-2 shadow-md">
            <div className="flex items-center gap-2 font-semibold text-yellow-900 dark:text-yellow-100 mb-1 text-base">
              <Clock className="h-4 w-4 text-yellow-700 dark:text-yellow-300" />
              ⚠️ Edit Deadline
            </div>
            <div className="text-yellow-800 dark:text-yellow-200">
              {event.settings.vapp.request_edit_deadline_hours > 0 ? (
                <>
           
                  {timeRemaining !== null && timeRemaining > 0 && (
                    <div className="pt-2 border-t border-yellow-300 dark:border-yellow-700">
                      <div className="text-xs text-yellow-700 dark:text-yellow-300 mb-1">
                        Time remaining for most recent request:
                      </div>
                      <div className="font-mono text-lg font-bold text-yellow-900 dark:text-yellow-100">
                        {Math.floor(timeRemaining / (60 * 60 * 1000))}h{' '}
                        {Math.floor((timeRemaining % (60 * 60 * 1000)) / (60 * 1000))}m{' '}
                        {Math.floor((timeRemaining % (60 * 1000)) / 1000)}s
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <span className="text-amber-700 dark:text-amber-400 font-medium text-sm">
                  Editing of submitted requests is disabled.
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <WorkspaceTabs eventId={eventId} />
    </div>
  );
}
