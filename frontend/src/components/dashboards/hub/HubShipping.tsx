import { useGetHubOrders } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Loader2, Truck, Package } from 'lucide-react';
import { OrderStatus } from '../../../backend';

interface HubShippingProps {
    hubId: string;
}

export default function HubShipping({ hubId }: HubShippingProps) {
    const { data: orders, isLoading } = useGetHubOrders(hubId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const shippedOrders = orders?.filter(o => o.status === OrderStatus.shipped || o.status === OrderStatus.delivered) || [];

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Shipping & Logistics</h2>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Transit</CardTitle>
                        <Truck className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders?.filter(o => o.status === OrderStatus.shipped).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Currently shipping</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <Package className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {orders?.filter(o => o.status === OrderStatus.delivered).length || 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Shipment Tracking</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {shippedOrders.map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                                <div className="space-y-1">
                                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                    <p className="text-sm text-muted-foreground">Product: {order.productId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        Shipped: {new Date(Number(order.updatedAt) / 1000000).toLocaleDateString()}
                                    </p>
                                </div>
                                <Badge
                                    className={
                                        order.status === OrderStatus.delivered
                                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                                            : 'bg-orange-500/10 text-orange-500 border-orange-500/20'
                                    }
                                >
                                    {order.status === OrderStatus.delivered ? 'DELIVERED' : 'IN TRANSIT'}
                                </Badge>
                            </div>
                        ))}
                        {shippedOrders.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground">No shipments to track</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
