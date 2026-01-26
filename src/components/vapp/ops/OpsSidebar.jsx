"use client";

import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ClipboardList,
  FileCheck,
  QrCode,
  Search,
  ChevronRight,
} from "lucide-react";
import { usePermissions, PERMISSIONS } from "@/components/permissions";

const NAV_ITEMS = [
  {
    label: "Ops Dashboard",
    href: (eventId) => `/events/${eventId}/vapp/ops/dashboard`,
    icon: LayoutDashboard,
  },
  {
    label: "Review Center",
    icon: ClipboardList,
    children: [
      {
        label: "Review Queue",
        href: (eventId) => `/events/${eventId}/vapp/ops/review/queue`,
        permission: PERMISSIONS.VAPP.REVIEW.READ,
      },
      {
        label: "Need Info",
        href: (eventId) => `/events/${eventId}/vapp/ops/review/need-info`,
        permission: PERMISSIONS.VAPP.REVIEW.READ,
      },
      {
        label: "Approved",
        href: (eventId) => `/events/${eventId}/vapp/ops/review/approved`,
        permission: PERMISSIONS.VAPP.REVIEW.READ,
      },
      {
        label: "Rejected",
        href: (eventId) => `/events/${eventId}/vapp/ops/review/rejected`,
        permission: PERMISSIONS.VAPP.REVIEW.READ,
      },
    ],
  },
  {
    label: "Permit Center",
    icon: FileCheck,
    children: [
      {
        label: "Generate Permits",
        href: (eventId) => `/events/${eventId}/vapp/ops/permits/generate`,
        permission: PERMISSIONS.VAPP.PERMIT.GENERATE,
      },
      {
        label: "Print Center",
        href: (eventId) => `/events/${eventId}/vapp/ops/permits/print`,
        permission: PERMISSIONS.VAPP.PERMIT.PRINT_LIST_PENDING,
      },
      {
        label: "Issue Center",
        href: (eventId) => `/events/${eventId}/vapp/ops/permits/issue`,
        permission: PERMISSIONS.VAPP.PERMIT.ISSUE,
      },
      {
        label: "Distribution",
        href: (eventId) => `/events/${eventId}/vapp/ops/permits/distribution`,
        permission: PERMISSIONS.VAPP.PERMIT.DISTRIBUTION_LIST_READY,
      },
      {
        label: "All Permits",
        href: (eventId) => `/events/${eventId}/vapp/ops/permits`,
        permission: PERMISSIONS.VAPP.PERMIT.LIST,
      },
    ],
  },
  {
    label: "Checkpoint",
    icon: QrCode,
    children: [
      {
        label: "Verify Permit",
        href: (eventId) => `/events/${eventId}/vapp/ops/checkpoint/verify`,
        permission: PERMISSIONS.VAPP.CHECKPOINT?.VERIFY || "vapp.checkpoint.verify",
      },
      {
        label: "Checkpoint Log",
        href: (eventId) => `/events/${eventId}/vapp/ops/checkpoint/log`,
        permission: PERMISSIONS.VAPP.CHECKPOINT?.READ || "vapp.checkpoint.read",
      },
    ],
  },
  {
    label: "Tools",
    icon: Search,
    children: [
      {
        label: "Search",
        href: (eventId) => `/events/${eventId}/vapp/ops/search`,
        permission: PERMISSIONS.VAPP.REVIEW.READ,
      },
      {
        label: "Audit Log",
        href: (eventId) => `/events/${eventId}/vapp/ops/audit`,
        permission: PERMISSIONS.VAPP.AUDIT.LIST,
      },
    ],
  },
];

export function OpsSidebar({ eventId }) {
  const location = useLocation();
  const { can } = usePermissions();
  const [expandedSections, setExpandedSections] = useState({
    review_center: true,
    permit_center: true,
    checkpoint: false,
    tools: false,
  });

  const pathname = location?.pathname || "";

  const isChildActive = (child, href) => {
    if (pathname === href) return true;
    if (!pathname.startsWith(href + "/")) return false;

    if (child?.label === "All Permits") {
      const rest = pathname.slice((href + "/").length);
      const firstSeg = rest.split("/")[0];
      const reserved = new Set(["generate", "print", "issue", "distribution"]);
      return !reserved.has(firstSeg);
    }

    return true;
  };

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  return (
    <nav className="flex flex-col gap-1">
      {NAV_ITEMS.map((item) => {
        if (item.children) {
          const visibleChildren = item.children.filter((child) => can(child.permission));
          if (visibleChildren.length === 0) return null;

          const sectionKey = item.label.toLowerCase().replace(/\s+/g, "_");
          const isExpanded = expandedSections[sectionKey];

          return (
            <div key={item.label}>
              <button
                onClick={() => toggleSection(sectionKey)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <div className="flex items-center gap-3">
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </div>
                <ChevronRight
                  className={cn(
                    "h-4 w-4 transition-transform",
                    isExpanded && "rotate-90"
                  )}
                />
              </button>
              {isExpanded && (
                <div className="ml-7 mt-1 space-y-1">
                  {visibleChildren.map((child) => {
                    const href = child.href(eventId);
                    const active = isChildActive(child, href);
                    return (
                      <Link
                        key={href}
                        to={href}
                        className={cn(
                          "block px-3 py-2 rounded-md text-sm transition-colors",
                          active
                            ? "bg-primary text-primary-foreground"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {child.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }

        const href = item.href(eventId);
        const Icon = item.icon;
        const active = pathname === href || pathname.startsWith(href + "/");

        return (
          <Link
            key={href}
            to={href}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              active
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
