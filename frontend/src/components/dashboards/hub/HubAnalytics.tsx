import { useGetHubOrders } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Loader2, TrendingUp, Package, Clock, Star } from 'lucide-react';
import { OrderStatus } from '../../../backend';

interface HubAnalyticsProps {
    hubId: string;
}

export default function HubAnalytics({ hubId }: HubAnalyticsProps) {
    const { data: orders, isLoading } = useGetHubOrders(hubId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalOrders = orders?.length || 0;
    const completedOrders = orders?.filter(o => o.status === OrderStatus.delivered).length || 0;
    const completionRate = totalOrders > 0 ? ((completedOrders / totalOrders) * 100).toFixed(1) : '0';
    const avgFulfillmentTime = '2.5'; // Placeholder
    const customerRating = '4.8'; // Placeholder

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Performance Analytics</h2>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <Package className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">All-time orders</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                        <TrendingUp className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{completionRate}%</div>
                        <p className="text-xs text-muted-foreground">Successfully delivered</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Fulfillment</CardTitle>
                        <Clock className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{avgFulfillmentTime} days</div>
                        <p className="text-xs text-muted-foreground">Processing time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Customer Rating</CardTitle>
                        <Star className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerRating}</div>
                        <p className="text-xs text-muted-foreground">Out of 5.0</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Order Status Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Pending</span>
                            <span className="font-medium">
                                {orders?.filter(o => o.status === OrderStatus.pending || o.status === OrderStatus.assigned).length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Processing</span>
                            <span className="font-medium">
                                {orders?.filter(o => o.status === OrderStatus.processing).length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Shipped</span>
                            <span className="font-medium">
                                {orders?.filter(o => o.status === OrderStatus.shipped).length || 0}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm">Delivered</span>
                            <span className="font-medium">{completedOrders}</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
