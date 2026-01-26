"use client";

import { useLocation } from "react-router-dom";
import { WorkspaceTabs } from "./WorkspaceTabs";

export function VappPageHeader({ eventId, pageTitle, pageDescription }) {
  const location = useLocation();

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

  return (
    <div className="mb-8">
      <h1 className="text-4xl font-bold mb-2">VAPP</h1>
      <p className="text-lg text-gray-600 mb-6">{workspaceName}</p>

      <div className="mb-6" />

      <h2 className="text-3xl font-bold mb-2">{pageTitle}</h2>
      {pageDescription && (
        <p className="text-gray-600 mb-4">{pageDescription}</p>
      )}

      <WorkspaceTabs eventId={eventId} />
    </div>
  );
}
