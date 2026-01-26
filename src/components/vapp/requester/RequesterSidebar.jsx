"use client";

import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { LayoutDashboard, FileText, FileEdit, AlertCircle, Bell } from "lucide-react";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: (eventId) => `/events/${eventId}/vapp/requester/dashboard`,
    icon: LayoutDashboard,
  },
  {
    label: "My Requests",
    href: (eventId) => `/events/${eventId}/vapp/requester/requests`,
    icon: FileText,
  },
  {
    label: "Drafts",
    href: (eventId) => `/events/${eventId}/vapp/requester/requests/drafts`,
    icon: FileEdit,
  },
  {
    label: "Need Info",
    href: (eventId) => `/events/${eventId}/vapp/requester/need-info`,
    icon: AlertCircle,
  },
  {
    label: "Notifications",
    href: (eventId) => `/events/${eventId}/vapp/requester/notifications`,
    icon: Bell,
  },
];

export function RequesterSidebar({ eventId }) {
  const location = useLocation();
  const pathname = location?.pathname || "";

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        const href = item.href(eventId);
        const Icon = item.icon;
        const isActive = (() => {
          if (!pathname) return false;
          if (pathname === href) return true;
          if (!pathname.startsWith(href + "/")) return false;

          if (href.endsWith("/vapp/requester/requests")) {
            const rest = pathname.slice((href + "/").length);
            const firstSegment = rest.split("/")[0];
            return firstSegment !== "drafts";
          }

          return true;
        })();

        return (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
