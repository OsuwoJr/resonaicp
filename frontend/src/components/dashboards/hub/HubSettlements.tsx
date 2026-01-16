import { useGetHubOrders } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react';
import { OrderStatus } from '../../../backend';

interface HubSettlementsProps {
    hubId: string;
}

export default function HubSettlements({ hubId }: HubSettlementsProps) {
    const { data: orders, isLoading } = useGetHubOrders(hubId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const completedOrders = orders?.filter(o => o.status === OrderStatus.delivered) || [];
    const totalEarnings = completedOrders.length * 10; // 20% of $50 placeholder
    const pendingPayouts = completedOrders.length * 2; // Placeholder
    const thisMonthEarnings = completedOrders.length * 8; // Placeholder

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Settlements & Earnings</h2>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
                        <DollarSign className="h-4 w-4 text-primary" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${totalEarnings}</div>
                        <p className="text-xs text-muted-foreground">All-time revenue</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">This Month</CardTitle>
                        <Calendar className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${thisMonthEarnings}</div>
                        <p className="text-xs text-muted-foreground">Current month earnings</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending Payouts</CardTitle>
                        <TrendingUp className="h-4 w-4 text-yellow-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">${pendingPayouts}</div>
                        <p className="text-xs text-muted-foreground">Awaiting settlement</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {completedOrders.slice(0, 10).map((order) => (
                            <div key={order.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                                <div>
                                    <p className="font-medium">Order #{order.id.slice(-8)}</p>
                                    <p className="text-sm text-muted-foreground">
                                        {new Date(Number(order.updatedAt) / 1000000).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="font-medium">$10.00</p>
                                    <p className="text-xs text-green-500">Paid</p>
                                </div>
                            </div>
                        ))}
                        {completedOrders.length === 0 && (
                            <p className="text-center text-sm text-muted-foreground">No payout history yet</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
