"use client";

import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import {
	LayoutDashboard,
	Settings,
	FileText,
	MapPin,
	Users,
	Shield,
	CheckCircle2,
	Building2,
	FolderTree,
	Truck,
	Key,
	Calendar,
	Star,
	Hash,
} from 'lucide-react'

const NAV_ITEMS = [
	{
		label: 'Admin Dashboard',
		href: (eventId) => `/events/${eventId}/vapp/admin/dashboard`,
		icon: LayoutDashboard,
	},
	{
		label: 'Event Setup',
		href: (eventId) => `/events/${eventId}/vapp/admin/event`,
		icon: Settings,
	},
	{
		label: 'Permit Types',
		href: (eventId) => `/events/${eventId}/vapp/admin/permit-types`,
		icon: FileText,
	},
	{
		label: 'Serial Numbers',
		href: (eventId) => `/events/${eventId}/vapp/admin/serial-numbers`,
		icon: Hash,
	},
	{
		label: 'RBAC / Permissions',
		href: (eventId) => `/events/${eventId}/vapp/admin/rbac`,
		icon: Shield,
	},
	{
		label: 'Readiness',
		href: (eventId) => `/events/${eventId}/vapp/admin/readiness`,
		icon: CheckCircle2,
	},
	// Request Configuration Entities
	{
		label: 'Sectors',
		href: (eventId) => `/events/${eventId}/vapp/admin/sectors`,
		icon: Building2,
	},
	{
		label: 'Functional Areas',
		href: (eventId) => `/events/${eventId}/vapp/admin/functional-areas`,
		icon: FolderTree,
	},
	{
		label: 'Vehicle Types',
		href: (eventId) => `/events/${eventId}/vapp/admin/vehicle-types`,
		icon: Truck,
	},
	{
		label: 'Access Zones',
		href: (eventId) => `/events/${eventId}/vapp/admin/access-zones`,
		icon: MapPin,
	},
	{
		label: 'Access Types',
		href: (eventId) => `/events/${eventId}/vapp/admin/access-types`,
		icon: Key,
	},
	{
		label: 'Validity',
		href: (eventId) => `/events/${eventId}/vapp/admin/validity`,
		icon: Calendar,
	},
	{
		label: 'Importance',
		href: (eventId) => `/events/${eventId}/vapp/admin/importance`,
		icon: Star,
	},
]

/**
 * Manager Sidebar Component
 * Navigation sidebar for Manager/Config workspace
 */
export function AdminSidebar({ eventId }) {
	const location = useLocation()
	const pathname = location?.pathname || ''

	return (
		<nav className="flex flex-col gap-1">
			{NAV_ITEMS.map((item) => {
				const href = item.href(eventId)
				const Icon = item.icon
				const isActive = pathname === href || pathname?.startsWith(href + '/')

				return (
					<Link
						key={href}
						to={href}
						className={cn(
							'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
							isActive
								? 'bg-primary text-primary-foreground'
								: 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
						)}
					>
						<Icon className="h-4 w-4" />
						{item.label}
					</Link>
				)
			})}
		</nav>
	)
}
