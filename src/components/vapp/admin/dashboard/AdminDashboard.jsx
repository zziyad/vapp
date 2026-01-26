"use client";

import { useState, useEffect, useMemo } from 'react'
import { useTransport } from '@/contexts/TransportContext'
import { getConfigAggregate } from '@/aggregates/config/get-config-aggregate'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
	Table, 
	TableBody, 
	TableCell, 
	TableHead, 
	TableHeader, 
	TableRow 
} from '@/components/ui/table'
import { FileText, CheckCircle2, ArrowRight, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useEventReadiness } from '@/hooks/use-event-readiness'
import { ConfigDashboardTab } from '@/components/vapp/config/ConfigDashboardTab'
import { PermissionGuard, PERMISSIONS } from '@/components/permissions'

/**
 * Admin Dashboard Component
 * Overview of configuration status and quick links
 */
export function AdminDashboard({ eventId }) {
	const { client } = useTransport()
	const { readiness, loading: readinessLoading } = useEventReadiness(eventId)
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('overview')
	
	// Data states
	const [permitTypes, setPermitTypes] = useState([])

	// Load permit types using aggregate pattern
	const aggregate = useMemo(() => {
		if (!client || !eventId) return null
		return getConfigAggregate(eventId, client)
	}, [client, eventId])

	useEffect(() => {
		if (!aggregate?.permitType || !eventId) return
		
		const loadPermitTypes = async () => {
			try {
				setLoading(true)
				const types = await aggregate.permitType.list(eventId)
				setPermitTypes(Array.isArray(types) ? types : [])
			} catch (error) {
				console.error('Failed to load permit types:', error)
			} finally {
				setLoading(false)
			}
		}

		loadPermitTypes()

		// Subscribe to permit type changes
		const unsubscribe = aggregate.permitType.subscribe((state) => {
			setPermitTypes(state.list || [])
		})

		return unsubscribe
	}, [aggregate, eventId])

	return (
		<div className="space-y-6">
			{/* Header */}
			<div>
				<h1 className="text-2xl font-bold text-gray-900">Manager / Config</h1>
				<p className="text-sm text-gray-600 mt-1">
					Configure and manage VAPP settings for this event
				</p>
			</div>

			{/* Tabs for Overview and Config Dashboard */}
			<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
				<TabsList className="grid w-full max-w-md grid-cols-2">
					<TabsTrigger value="overview">Overview</TabsTrigger>
					<TabsTrigger value="config">Config Dashboard</TabsTrigger>
				</TabsList>

				<TabsContent value="overview" className="mt-6 space-y-6">
					{/* Readiness Status */}
					<Card className={readiness === 'READY' ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle2 className={`h-5 w-5 ${readiness === 'READY' ? 'text-green-600' : 'text-yellow-600'}`} />
								Event Readiness: {readinessLoading ? 'Checking...' : readiness || 'NOT READY'}
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="flex items-center justify-between">
								<p className="text-sm text-muted-foreground">
									{readiness === 'READY' 
										? 'All required configuration is complete. Event is ready for operations.'
										: 'Some configuration is missing. Complete setup to enable operations.'}
								</p>
								<Button asChild variant="outline" size="sm">
									<Link to={`/events/${eventId}/vapp/admin/readiness`}>
										View Details
										<ArrowRight className="h-4 w-4 ml-2" />
									</Link>
								</Button>
							</div>
						</CardContent>
					</Card>

					{/* Permit Types Section */}
					<Card>
						<CardHeader>
							<div className="flex items-center justify-between">
								<CardTitle className="flex items-center gap-2">
									<FileText className="h-5 w-5" />
									Permit Types ({loading ? '...' : permitTypes.length})
								</CardTitle>
								<PermissionGuard permission={PERMISSIONS.VAPP.CONFIG.PERMIT_TYPE.WRITE}>
									<Button asChild variant="outline" size="sm">
										<Link to={`/events/${eventId}/vapp/admin/event?tab=setup&step=permit-types`}>
											<Plus className="h-4 w-4 mr-2" />
											Add Permit Type
										</Link>
									</Button>
								</PermissionGuard>
							</div>
						</CardHeader>
						<CardContent>
							{loading ? (
								<div className="text-center py-8 text-muted-foreground">Loading...</div>
							) : permitTypes.length === 0 ? (
								<div className="text-center py-8 text-muted-foreground">
									No permit types configured yet
								</div>
							) : (
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>Name</TableHead>
											<TableHead>Description</TableHead>
											<TableHead>Status</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{permitTypes.map((type) => (
											<TableRow key={type.id}>
												<TableCell className="font-medium">{type.display_name || type.name}</TableCell>
												<TableCell className="text-gray-600">{type.description || '—'}</TableCell>
												<TableCell>
													<Badge variant={type.is_active ? 'default' : 'secondary'}>
														{type.is_active ? 'Active' : 'Inactive'}
													</Badge>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							)}
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="config" className="mt-6">
					<ConfigDashboardTab eventId={eventId} />
				</TabsContent>
			</Tabs>
		</div>
	)
}
