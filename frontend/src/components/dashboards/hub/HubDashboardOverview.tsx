import { useGetHubOrders, useGetHubInventorySummary } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Loader2, Package, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import { OrderStatus } from '../../../backend';

interface HubDashboardOverviewProps {
    hubId: string;
}

export default function HubDashboardOverview({ hubId }: HubDashboardOverviewProps) {
    const { data: orders, isLoading: ordersLoading } = useGetHubOrders(hubId);
    const { data: inventorySummary, isLoading: inventoryLoading } = useGetHubInventorySummary(hubId);

    if (ordersLoading || inventoryLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const pendingOrders = orders?.filter(o => o.status === OrderStatus.pending || o.status === OrderStatus.assigned).length || 0;
    const processingOrders = orders?.filter(o => o.status === OrderStatus.processing).length || 0;
    const shippedOrders = orders?.filter(o => o.status === OrderStatus.shipped).length || 0;
    const completedOrders = orders?.filter(o => o.status === OrderStatus.delivered).length || 0;

    const totalRevenue = completedOrders * 50; // Placeholder calculation

    return (
        <div className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                        <AlertCircle className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{pendingOrders}</div>
                        <p className="text-xs text-muted-foreground">Awaiting processing</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                        <Package className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{processingOrders + shippedOrders}</div>
                        <p className="text-xs text-muted-foreground">Currently fulfilling</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completedOrders}</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalRevenue}</div>
                        <p className="text-xs text-muted-foreground">Total earnings</p>
                    </CardContent>
                </Card>
            </div>

            {inventorySummary && (
                <Card>
                    <CardHeader>
                        <CardTitle>Inventory Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 md:grid-cols-3">
                            <div>
                                <p className="text-sm text-muted-foreground">In Stock</p>
                                <p className="text-2xl font-bold">{inventorySummary.inStock}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Pending</p>
                                <p className="text-2xl font-bold">{inventorySummary.pending}</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                                <p className="text-2xl font-bold text-yellow-500">{inventorySummary.lowStock}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {orders?.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(Number(order.updatedAt) / 1000000).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-sm font-medium capitalize">{order.status}</div>
                            </div>
                        ))}
                        {(!orders || orders.length === 0) && (
                            <p className="text-center text-sm text-muted-foreground">No recent activity</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
