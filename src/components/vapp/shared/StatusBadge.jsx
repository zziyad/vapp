"use client";

import { Badge } from "@/components/ui/badge";

const STATUS_VARIANTS = {
  // AccessRequest statuses
  draft: { variant: "outline", className: "bg-gray-100 text-gray-700 border-gray-300" },
  submitted: { variant: "default", className: "" },
  under_review: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-300" },
  approved: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
  partially_approved: { variant: "default", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  rejected: { variant: "default", className: "bg-red-100 text-red-700 border-red-300" },
  need_info: { variant: "default", className: "bg-orange-100 text-orange-700 border-orange-300" },
  cancelled: { variant: "outline", className: "" },
  
  // Permit statuses
  generated: { variant: "default", className: "" },
  printed: { variant: "default", className: "bg-blue-100 text-blue-700 border-blue-300" },
  verified: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
  issued: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
  distributed: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
  active: { variant: "default", className: "bg-green-100 text-green-700 border-green-300" },
  suspended: { variant: "default", className: "bg-yellow-100 text-yellow-700 border-yellow-300" },
  expired: { variant: "outline", className: "" },
};

export function StatusBadge({ status, className }) {
  const config = STATUS_VARIANTS[status] || { variant: "outline", className: "" };
  
  return (
    <Badge variant={config.variant} className={`${config.className} ${className || ""}`}>
      {status ? status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase()) : "Unknown"}
    </Badge>
  );
}

export default StatusBadge;
