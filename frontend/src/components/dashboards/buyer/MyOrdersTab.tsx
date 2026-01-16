import { UserProfile, OrderStatus } from '../../../backend';
import { useGetBuyerOrders } from '../../../hooks/useQueries';
import { Card, CardContent } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Loader2, Package } from 'lucide-react';

interface MyOrdersTabProps {
    userProfile: UserProfile;
}

export default function MyOrdersTab({ userProfile }: MyOrdersTabProps) {
    const { data: orders, isLoading } = useGetBuyerOrders();

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

    const getStatusDescription = (status: OrderStatus) => {
        const descriptions: Record<OrderStatus, string> = {
            [OrderStatus.pending]: 'Your order is being processed',
            [OrderStatus.assigned]: 'Order assigned to fulfillment hub',
            [OrderStatus.processing]: 'Hub is preparing your order',
            [OrderStatus.shipped]: 'Your order is on the way',
            [OrderStatus.delivered]: 'Order delivered successfully',
        };
        return descriptions[status] || '';
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
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">My Orders</h2>
                <p className="text-sm text-muted-foreground">Track your purchases and deliveries</p>
            </div>

            {orders && orders.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No orders yet</p>
                        <p className="text-sm text-muted-foreground">Start shopping to see your orders here</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {orders?.map((order) => (
                        <Card key={order.id}>
                            <CardContent className="pt-6">
                                <div className="flex items-start justify-between">
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-semibold">Order #{order.id.slice(-8)}</p>
                                            <Badge className={getStatusColor(order.status)}>
                                                {getStatusLabel(order.status)}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{getStatusDescription(order.status)}</p>
                                        <div className="space-y-1 text-sm">
                                            <p className="text-muted-foreground">Product: {order.productId}</p>
                                            <p className="text-muted-foreground">Quantity: {Number(order.quantity)}</p>
                                            {order.assignedHub && (
                                                <p className="text-muted-foreground">Hub: {order.assignedHub}</p>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground">
                                            Ordered: {new Date(Number(order.createdAt) / 1000000).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}
