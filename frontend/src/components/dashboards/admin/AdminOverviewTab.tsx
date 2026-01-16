import { useGetOrders, useGetProducts, useGetPayments } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Loader2, Package, ShoppingBag, DollarSign, TrendingUp } from 'lucide-react';
import { OrderStatus } from '../../../backend';

export default function AdminOverviewTab() {
    const { data: orders, isLoading: ordersLoading } = useGetOrders();
    const { data: products, isLoading: productsLoading } = useGetProducts();
    const { data: payments, isLoading: paymentsLoading } = useGetPayments();

    if (ordersLoading || productsLoading || paymentsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalOrders = orders?.length || 0;
    const totalProducts = products?.length || 0;
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.totalAmount), 0) || 0;
    const platformRevenue = payments?.reduce((sum, p) => sum + Number(p.platformAmount), 0) || 0;

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
                <h2 className="text-2xl font-semibold">Platform Overview</h2>
                <p className="text-sm text-muted-foreground">Monitor platform-wide metrics and performance</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">All transactions</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Platform Revenue</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(platformRevenue / 100).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">10% platform fee</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                        <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalOrders}</div>
                        <p className="text-xs text-muted-foreground">All time</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalProducts}</div>
                        <p className="text-xs text-muted-foreground">Active listings</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {orders?.slice(0, 5).map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                <div>
                                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                    <p className="text-sm text-muted-foreground">Product: {order.productId}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {new Date(Number(order.createdAt) / 1000000).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-medium">{getStatusLabel(order.status)}</p>
                                    <p className="text-xs text-muted-foreground">Qty: {Number(order.quantity)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
