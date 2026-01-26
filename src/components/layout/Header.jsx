"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, User, UserCircle, LogOut, Edit, Users, Shield, Key, Home } from "lucide-react";
import { MenuToggleIcon } from "@/components/layout/header/MenuToggleIcon";
import { useScroll } from "@/components/layout/header/use-scroll";
import { Button, buttonVariants } from "@/components/ui/button";
import { Spinner } from "@/components/ui/blur-loading";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

export function Header() {
  const [open, setOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const scrolled = useScroll(10);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isLoading } = useAuth();
  const isAdmin =
    Array.isArray(user?.roles) &&
    user.roles.some((role) => role.name === "admin" || role.name === "super_admin");

  const userMenuRef = useRef(null);

  const currentEventId = useMemo(() => {
    const pathname = location?.pathname || "";
    const match = pathname.match(/^\/events\/([^/]+)(?:\/.*)?$/);
    return match ? match[1] : undefined;
  }, [location?.pathname]);

  const links = useMemo(() => {
    if (!currentEventId) return [];
    const base = `/events/${currentEventId}`;
    return [
      { label: "Dashboard", href: base },
      { label: "Flight Schedule", href: `${base}/airport-management/flight-schedule` },
      { label: "Airport Transport Ops", href: `${base}/airport-management/airport-transport-ops` },
      { label: "Airport Dispatch", href: `${base}/airport-management/airport-dispatch` },
      { label: "Passenger List", href: `${base}/hotel-management/hotel-transportation/passengers` },
      { label: "Hotel Transport Ops", href: `${base}/hotel-management/hotel-transport-ops` },
      { label: "Hotel Dispatch", href: `${base}/hotel-management/hotel-transportation/operation` },
      { label: "Driver Management", href: `${base}/fleet-management/drivers` },
      { label: "Fleet ID", href: `${base}/fleet-management/fleet-id` },
      { label: "Fleet Assignment", href: `${base}/fleet-management/assignment` },
      { label: "VAPP", href: `${base}/vapp` },
      { label: "Visa", href: `${base}/travel-management/visa` },
      { label: "Accommodation", href: `${base}/travel-management/accommodation` },
      { label: "Air Ticket", href: `${base}/travel-management/air-ticket` },
      { label: "Shuttle System", href: `${base}/mobility-management/shuttle-system` },
      { label: "Stadium Shuttle", href: `${base}/mobility-management/stadium-shuttle` },
      { label: "Employee List", href: `${base}/transport-workforce/employee-list` },
      { label: "Employee Assignment", href: `${base}/transport-workforce/employee-assignment` },
      { label: "Transport Report", href: `${base}/reports/transport-report` },
      { label: "Task", href: `${base}/reports/task` },
      { label: "Venues & Hotels", href: `${base}/venues-hotels` },
    ];
  }, [currentEventId]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Logout failed:", error);
    } finally {
      navigate("/login");
    }
  }, [logout, navigate]);

  const handleProfile = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/profile");
  }, [navigate]);

  const handleEvents = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/events");
  }, [navigate]);

  const handleFiles = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/files");
  }, [navigate]);

  const handleTransportDemo = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/transport-demo");
  }, [navigate]);

  const handleVappOps = useCallback(() => {
    setUserMenuOpen(false);
    if (currentEventId) {
      navigate(`/events/${currentEventId}/vapp/ops/dashboard`);
    }
  }, [currentEventId, navigate]);

  const handleVappRequester = useCallback(() => {
    setUserMenuOpen(false);
    if (currentEventId) {
      navigate(`/events/${currentEventId}/vapp/requester/dashboard`);
    }
  }, [currentEventId, navigate]);

  const handleUserManagement = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/admin/users");
  }, [navigate]);

  const handleRoleManagement = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/admin/roles");
  }, [navigate]);

  const handlePermissionMatrix = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/admin/permissions");
  }, [navigate]);

  const handleAdminDashboard = useCallback(() => {
    setUserMenuOpen(false);
    navigate("/admin");
  }, [navigate]);

  const handleEditEvent = useCallback(() => {
    setUserMenuOpen(false);
    if (currentEventId) {
      navigate(`/events?editEventId=${encodeURIComponent(currentEventId)}`);
    } else {
      navigate("/events");
    }
  }, [currentEventId, navigate]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const onDocClick = (e) => {
      if (!userMenuRef.current) return;
      if (!userMenuRef.current.contains(e.target)) setUserMenuOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === "Escape") setUserMenuOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50 md:top-4 md:max-w-3xl md:shadow":
            scrolled,
        }
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          {
            "md:px-2": scrolled,
          }
        )}
      >
        <Link className="rounded-md p-2 hover:bg-accent flex items-center" to="/events" title="Go to Events">
          <img src="/logo.png" alt="Logo" className="h-16 w-auto" />
        </Link>
        <div className="hidden items-center gap-2 md:flex">
          {isLoading ? (
            <Button variant="ghost" size="sm" disabled>
              <Spinner size="sm" />
            </Button>
          ) : user ? (
            <div className="relative" ref={userMenuRef}>
              <Button
                variant="outline"
                size="icon"
                className="border-black text-black hover:bg-black/5 rounded-full h-9 w-9"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <UserCircle className="h-7 w-7" />
              </Button>
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-gray-200 bg-white shadow-md overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-200 flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-gray-200 flex items-center justify-center">
                      <User className="h-4 w-4 text-black" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-medium text-black truncate">
                        {user.firstName
                          ? `${user.firstName} ${user.lastName || ""}`.trim()
                          : user.email}
                      </div>
                      {user.email && (
                        <div className="text-xs text-gray-600 truncate">
                          {user.email}
                        </div>
                      )}
                    </div>
                  </div>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleEditEvent}
                  >
                    <Edit className="h-4 w-4" />
                    Edit Event
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleEvents}
                  >
                    <Home className="h-4 w-4" />
                    Events
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleFiles}
                  >
                    <Users className="h-4 w-4" />
                    File Manager
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleTransportDemo}
                  >
                    <Shield className="h-4 w-4" />
                    Transport Demo
                  </button>
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate("/pages");
                    }}
                  >
                    <Home className="h-4 w-4" />
                    Pages Index
                  </button>
                  {currentEventId && (
                    <>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handleVappOps}
                      >
                        <Key className="h-4 w-4" />
                        VAPP Ops
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handleVappRequester}
                      >
                        <Key className="h-4 w-4" />
                        VAPP Requester
                      </button>
                    </>
                  )}
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleProfile}
                  >
                    <User className="h-4 w-4" />
                    Profile
                  </button>
                  {isAdmin && (
                    <>
                      <div className="border-t border-gray-200" />
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handleAdminDashboard}
                      >
                        <Home className="h-4 w-4" />
                        Admin Dashboard
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handleUserManagement}
                      >
                        <Users className="h-4 w-4" />
                        User Management
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handleRoleManagement}
                      >
                        <Shield className="h-4 w-4" />
                        Role Management
                      </button>
                      <button
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                        onClick={handlePermissionMatrix}
                      >
                        <Key className="h-4 w-4" />
                        Permission Matrix
                      </button>
                    </>
                  )}
                  <div className="border-t border-gray-200" />
                  <button
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-black/5"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              <UserCircle className="h-4 w-4 mr-2" />
              Sign In
            </Button>
          )}
        </div>
        <Button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          size="icon"
          variant="outline"
        >
          <MenuToggleIcon className="size-5" duration={300} open={open} />
        </Button>
      </nav>

      <MobileMenu className="flex flex-col justify-between gap-2" open={open}>
        <div className="grid gap-y-2 overflow-y-auto max-h-[70vh] pr-1">
          {links.map((link) => (
            <button
              key={link.label}
              className={buttonVariants({
                variant: "ghost",
                className: "justify-start",
              })}
              onClick={() => {
                setOpen(false);
                navigate(link.href);
              }}
            >
              {link.label}
            </button>
          ))}
          {user && (
            <>
              <button
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                onClick={() => {
                  setOpen(false);
                  handleProfile();
                }}
              >
                Profile
              </button>
              <button
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                onClick={() => {
                  setOpen(false);
                  handleEvents();
                }}
              >
                Events
              </button>
              <button
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                onClick={() => {
                  setOpen(false);
                  handleFiles();
                }}
              >
                File Manager
              </button>
              <button
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                onClick={() => {
                  setOpen(false);
                  handleTransportDemo();
                }}
              >
                Transport Demo
              </button>
              <button
                className={buttonVariants({
                  variant: "ghost",
                  className: "justify-start",
                })}
                onClick={() => {
                  setOpen(false);
                  navigate("/pages");
                }}
              >
                Pages Index
              </button>
              {currentEventId && (
                <>
                  <button
                    className={buttonVariants({
                      variant: "ghost",
                      className: "justify-start",
                    })}
                    onClick={() => {
                      setOpen(false);
                      handleVappOps();
                    }}
                  >
                    VAPP Ops
                  </button>
                  <button
                    className={buttonVariants({
                      variant: "ghost",
                      className: "justify-start",
                    })}
                    onClick={() => {
                      setOpen(false);
                      handleVappRequester();
                    }}
                  >
                    VAPP Requester
                  </button>
                </>
              )}
              {isAdmin && (
                <>
                  <button
                    className={buttonVariants({
                      variant: "ghost",
                      className: "justify-start",
                    })}
                    onClick={() => {
                      setOpen(false);
                      handleAdminDashboard();
                    }}
                  >
                    Admin Dashboard
                  </button>
                </>
              )}
            </>
          )}
        </div>
        <div className="flex flex-col gap-2">
          {user ? (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setOpen(false);
                handleLogout();
              }}
            >
              Log out
            </Button>
          ) : (
            <Button
              className="w-full"
              variant="outline"
              onClick={() => {
                setOpen(false);
                navigate("/login");
              }}
            >
              Sign In
            </Button>
          )}
        </div>
      </MobileMenu>
    </header>
  );
}

function MobileMenu({ open, children, className, ...props }) {
  if (!open || typeof window === "undefined") {
    return null;
  }

  return createPortal(
    <div
      className={cn(
        "bg-background/95 backdrop-blur-lg supports-[backdrop-filter]:bg-background/50",
        "fixed top-14 right-0 bottom-0 left-0 z-40 flex flex-col overflow-hidden border-y md:hidden"
      )}
      id="mobile-menu"
    >
      <div
        className={cn(
          "data-[slot=open]:zoom-in-97 ease-out data-[slot=open]:animate-in",
          "size-full p-4",
          className
        )}
        data-slot={open ? "open" : "closed"}
        {...props}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
