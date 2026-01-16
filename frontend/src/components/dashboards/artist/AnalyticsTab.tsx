import { UserProfile, OrderStatus } from '../../../backend';
import { useGetArtistOrders, useGetArtistPayments } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Loader2, DollarSign, ShoppingBag, TrendingUp } from 'lucide-react';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';

interface AnalyticsTabProps {
    userProfile: UserProfile;
}

export default function AnalyticsTab({ userProfile }: AnalyticsTabProps) {
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();
    const { data: orders, isLoading: ordersLoading } = useGetArtistOrders(artistPrincipal!);
    const { data: payments, isLoading: paymentsLoading } = useGetArtistPayments(artistPrincipal!);

    if (ordersLoading || paymentsLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const totalOrders = orders?.length || 0;
    const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.artistAmount), 0) || 0;
    const deliveredOrders = orders?.filter((o) => o.status === OrderStatus.delivered).length || 0;

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Sales Analytics</h2>
                <p className="text-sm text-muted-foreground">Track your performance and earnings</p>
            </div>

            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${(totalRevenue / 100).toFixed(2)}</div>
                        <p className="text-xs text-muted-foreground">Your 70% share</p>
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
                        <CardTitle className="text-sm font-medium">Delivered</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{deliveredOrders}</div>
                        <p className="text-xs text-muted-foreground">
                            {totalOrders > 0 ? `${Math.round((deliveredOrders / totalOrders) * 100)}%` : '0%'} completion rate
                        </p>
                    </CardContent>
                </Card>
            </div>

            {payments && payments.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Recent Payments</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {payments.slice(0, 5).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between border-b border-border pb-4 last:border-0 last:pb-0">
                                    <div>
                                        <p className="font-medium">Order #{payment.orderId.slice(-8)}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {new Date(Number(payment.timestamp) / 1000000).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-primary">
                                            ${(Number(payment.artistAmount) / 100).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Total: ${(Number(payment.totalAmount) / 100).toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
