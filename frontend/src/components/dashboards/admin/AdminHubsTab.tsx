import { useState } from 'react';
import { useGetAllHubs, useApproveHub, useRejectHub, useSuspendHub, useDeleteHub } from '../../../hooks/useQueries';
import { Card, CardContent } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Loader2, MapPin, CheckCircle, XCircle, Ban, Trash2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { HubStatus } from '../../../backend';

export default function AdminHubsTab() {
    const { data: hubs, isLoading, error } = useGetAllHubs();
    const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected' | 'suspended' | 'draft'>('all');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Loading hubs...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="mb-4 h-12 w-12 text-destructive" />
                <p className="mb-2 text-lg font-medium">Failed to load hubs</p>
                <p className="text-sm text-muted-foreground">
                    {error instanceof Error ? error.message : 'Please try refreshing the page'}
                </p>
            </div>
        );
    }

    const filteredHubs = hubs?.filter(hub => {
        if (filter === 'all') return true;
        if (filter === 'pending') return hub.status === HubStatus.pendingApproval;
        if (filter === 'approved') return hub.status === HubStatus.approved;
        if (filter === 'rejected') return hub.status === HubStatus.rejected;
        if (filter === 'suspended') return hub.status === HubStatus.suspended;
        if (filter === 'draft') return hub.status === HubStatus.draft;
        return true;
    });

    const pendingCount = hubs?.filter(h => h.status === HubStatus.pendingApproval).length || 0;
    const approvedCount = hubs?.filter(h => h.status === HubStatus.approved).length || 0;
    const rejectedCount = hubs?.filter(h => h.status === HubStatus.rejected).length || 0;
    const suspendedCount = hubs?.filter(h => h.status === HubStatus.suspended).length || 0;
    const draftCount = hubs?.filter(h => h.status === HubStatus.draft).length || 0;

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Fulfillment Hubs</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage hub applications and approvals
                        {pendingCount > 0 && (
                            <Badge className="ml-2 bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                                {pendingCount} Pending Review
                            </Badge>
                        )}
                    </p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All ({hubs?.length || 0})
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({pendingCount})
                    </Button>
                    <Button
                        variant={filter === 'approved' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('approved')}
                    >
                        Approved ({approvedCount})
                    </Button>
                    <Button
                        variant={filter === 'rejected' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('rejected')}
                    >
                        Rejected ({rejectedCount})
                    </Button>
                    <Button
                        variant={filter === 'suspended' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('suspended')}
                    >
                        Suspended ({suspendedCount})
                    </Button>
                    <Button
                        variant={filter === 'draft' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('draft')}
                    >
                        Draft ({draftCount})
                    </Button>
                </div>
            </div>

            {!hubs || hubs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No hub applications yet</p>
                        <p className="text-sm text-muted-foreground">
                            Hub applications will appear here once users submit them
                        </p>
                    </CardContent>
                </Card>
            ) : filteredHubs && filteredHubs.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <MapPin className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No hubs found</p>
                        <p className="text-sm text-muted-foreground">
                            {filter === 'pending' && 'No pending applications'}
                            {filter === 'approved' && 'No approved hubs'}
                            {filter === 'rejected' && 'No rejected applications'}
                            {filter === 'suspended' && 'No suspended hubs'}
                            {filter === 'draft' && 'No draft hubs'}
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredHubs?.map((hub) => (
                        <HubCard key={hub.id} hub={hub} />
                    ))}
                </div>
            )}
        </div>
    );
}

function HubCard({ hub }: { hub: any }) {
    const approveHub = useApproveHub();
    const rejectHub = useRejectHub();
    const suspendHub = useSuspendHub();
    const deleteHub = useDeleteHub();

    const handleApprove = async () => {
        try {
            await approveHub.mutateAsync(hub.id);
            toast.success('Hub approved successfully! It is now visible to artists for product assignment.');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to approve hub';
            toast.error(errorMessage);
            console.error('Approve hub error:', error);
        }
    };

    const handleReject = async () => {
        if (confirm('Are you sure you want to reject this hub application? The hub owner can reapply after making changes.')) {
            try {
                await rejectHub.mutateAsync(hub.id);
                toast.success('Hub application rejected. The owner has been notified.');
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to reject hub';
                toast.error(errorMessage);
                console.error('Reject hub error:', error);
            }
        }
    };

    const handleSuspend = async () => {
        if (confirm('Are you sure you want to suspend this hub? This will prevent it from receiving new orders.')) {
            try {
                await suspendHub.mutateAsync(hub.id);
                toast.success('Hub suspended successfully');
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to suspend hub';
                toast.error(errorMessage);
                console.error('Suspend hub error:', error);
            }
        }
    };

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this hub? This action cannot be undone and will remove all associated data.')) {
            try {
                await deleteHub.mutateAsync(hub.id);
                toast.success('Hub deleted successfully');
            } catch (error: any) {
                const errorMessage = error?.message || 'Failed to delete hub';
                toast.error(errorMessage);
                console.error('Delete hub error:', error);
            }
        }
    };

    const getStatusBadge = (status: HubStatus) => {
        const badges: Record<HubStatus, { color: string; label: string }> = {
            [HubStatus.pendingApproval]: { color: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20', label: 'Pending Approval' },
            [HubStatus.approved]: { color: 'bg-green-500/10 text-green-500 border-green-500/20', label: 'Approved' },
            [HubStatus.rejected]: { color: 'bg-red-500/10 text-red-500 border-red-500/20', label: 'Rejected' },
            [HubStatus.suspended]: { color: 'bg-gray-500/10 text-gray-500 border-gray-500/20', label: 'Suspended' },
            [HubStatus.draft]: { color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', label: 'Draft' },
        };
        const badge = badges[status];
        return <Badge className={badge.color}>{badge.label}</Badge>;
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp / 1000000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                                <h3 className="font-semibold">{hub.name}</h3>
                                {getStatusBadge(hub.status)}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                Applied: {formatDate(hub.createdAt)}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-2 text-sm">
                        <div className="flex items-start gap-2">
                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                            <span className="text-muted-foreground">
                                {hub.location[0].toFixed(4)}, {hub.location[1].toFixed(4)}
                            </span>
                        </div>
                        <div className="text-muted-foreground">
                            <span className="font-medium">Capacity:</span> {hub.capacity} orders/month
                        </div>
                    </div>

                    {hub.businessInfo && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Business Info:</p>
                            <p className="text-sm line-clamp-3">{hub.businessInfo}</p>
                        </div>
                    )}

                    {hub.contactInfo && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Contact:</p>
                            <p className="text-sm line-clamp-2">{hub.contactInfo}</p>
                        </div>
                    )}

                    {hub.services && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">Services:</p>
                            <p className="text-sm line-clamp-2">{hub.services}</p>
                        </div>
                    )}

                    <div className="flex flex-wrap gap-2 pt-2">
                        {hub.status === HubStatus.pendingApproval && (
                            <>
                                <Button
                                    size="sm"
                                    onClick={handleApprove}
                                    disabled={approveHub.isPending}
                                    className="flex-1"
                                >
                                    {approveHub.isPending ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <CheckCircle className="mr-1 h-3 w-3" />
                                    )}
                                    Approve
                                </Button>
                                <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={handleReject}
                                    disabled={rejectHub.isPending}
                                    className="flex-1"
                                >
                                    {rejectHub.isPending ? (
                                        <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                    ) : (
                                        <XCircle className="mr-1 h-3 w-3" />
                                    )}
                                    Reject
                                </Button>
                            </>
                        )}

                        {hub.status === HubStatus.approved && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={handleSuspend}
                                disabled={suspendHub.isPending}
                                className="flex-1"
                            >
                                {suspendHub.isPending ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                    <Ban className="mr-1 h-3 w-3" />
                                )}
                                Suspend
                            </Button>
                        )}

                        {hub.status === HubStatus.suspended && (
                            <Button
                                size="sm"
                                onClick={handleApprove}
                                disabled={approveHub.isPending}
                                className="flex-1"
                            >
                                {approveHub.isPending ? (
                                    <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                                ) : (
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                )}
                                Reactivate
                            </Button>
                        )}

                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                            onClick={handleDelete}
                            disabled={deleteHub.isPending}
                        >
                            {deleteHub.isPending ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                                <Trash2 className="h-3 w-3" />
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
