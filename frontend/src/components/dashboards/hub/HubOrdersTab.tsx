import { useState } from 'react';
import { UserProfile, OrderStatus } from '../../../backend';
import { useGetHubOrders, useUpdateOrderStatus } from '../../../hooks/useQueries';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

interface HubOrdersTabProps {
    userProfile: UserProfile;
}

export default function HubOrdersTab({ userProfile }: HubOrdersTabProps) {
    const hubId = 'hub-1'; // In a real app, this would come from the user profile
    const { data: orders, isLoading } = useGetHubOrders(hubId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            [OrderStatus.pending]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            [OrderStatus.assigned]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            [OrderStatus.processing]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            [OrderStatus.shipped]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            [OrderStatus.delivered]: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
        return colors[status] || '';
    };

    return (
        <div className="space-y-6">
            {orders && orders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No assigned orders</p>
                        <p className="text-sm text-muted-foreground">Orders will appear here when assigned to your hub</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders?.map((order) => (
                        <OrderCard key={order.id} order={order} />
                    ))}
                </div>
            )}
        </div>
    );
}

function OrderCard({ order }: { order: any }) {
    const updateStatus = useUpdateOrderStatus();
    const [selectedStatus, setSelectedStatus] = useState<OrderStatus>(order.status);

    const handleStatusUpdate = async () => {
        if (selectedStatus === order.status) {
            toast.info('Status unchanged');
            return;
        }

        try {
            await updateStatus.mutateAsync({
                orderId: order.id,
                status: selectedStatus,
            });
            toast.success('Order status updated');
        } catch (error) {
            toast.error('Failed to update status');
        }
    };

    const getStatusColor = (status: OrderStatus) => {
        const colors: Record<OrderStatus, string> = {
            [OrderStatus.pending]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
            [OrderStatus.assigned]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            [OrderStatus.processing]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            [OrderStatus.shipped]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
            [OrderStatus.delivered]: 'bg-green-500/10 text-green-500 border-green-500/20',
        };
        return colors[status] || '';
    };

    const getStatusLabel = (status: OrderStatus) => {
        const labels: Record<OrderStatus, string> = {
            [OrderStatus.pending]: 'PENDING',
            [OrderStatus.assigned]: 'ASSIGNED',
            [OrderStatus.processing]: 'PROCESSING',
            [OrderStatus.shipped]: 'SHIPPED',
            [OrderStatus.delivered]: 'DELIVERED',
        };
        return labels[status] || '';
    };

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                                <Badge className={getStatusColor(order.status)}>
                                    {getStatusLabel(order.status)}
                                </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                                <p className="text-muted-foreground">Product: {order.productId}</p>
                                <p className="text-muted-foreground">Quantity: {Number(order.quantity)}</p>
                                <p className="text-xs text-muted-foreground">
                                    Assigned: {new Date(Number(order.updatedAt) / 1000000).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as OrderStatus)}>
                            <SelectTrigger className="flex-1">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={OrderStatus.processing}>Processing</SelectItem>
                                <SelectItem value={OrderStatus.shipped}>Shipped</SelectItem>
                                <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button onClick={handleStatusUpdate} disabled={updateStatus.isPending}>
                            {updateStatus.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Status'
                            )}
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
