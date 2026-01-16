import { useGetHubOrders, useExportInventoryReport } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Loader2, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';

interface HubReportsProps {
    hubId: string;
}

export default function HubReports({ hubId }: HubReportsProps) {
    const { data: orders, isLoading } = useGetHubOrders(hubId);
    const exportInventory = useExportInventoryReport();

    const handleExportOrders = () => {
        if (!orders || orders.length === 0) {
            toast.error('No orders to export');
            return;
        }

        const csvContent = [
            ['Order ID', 'Product ID', 'Quantity', 'Status', 'Created At', 'Updated At'].join(','),
            ...orders.map(order =>
                [
                    order.id,
                    order.productId,
                    order.quantity,
                    order.status,
                    new Date(Number(order.createdAt) / 1000000).toISOString(),
                    new Date(Number(order.updatedAt) / 1000000).toISOString(),
                ].join(',')
            ),
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `orders-report-${Date.now()}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
        toast.success('Orders report exported');
    };

    const handleExportInventory = async () => {
        try {
            const inventory = await exportInventory.mutateAsync();
            if (!inventory || inventory.length === 0) {
                toast.error('No inventory to export');
                return;
            }

            const csvContent = [
                ['Product ID', 'Hub ID', 'Stock', 'Pending', 'Status', 'Last Updated'].join(','),
                ...inventory.map(item =>
                    [
                        item.productId,
                        item.hubId,
                        item.stock,
                        item.pending,
                        item.status,
                        new Date(Number(item.lastUpdated) / 1000000).toISOString(),
                    ].join(',')
                ),
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `inventory-report-${Date.now()}.csv`;
            a.click();
            window.URL.revokeObjectURL(url);
            toast.success('Inventory report exported');
        } catch (error) {
            toast.error('Failed to export inventory');
        }
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Reports & Downloads</h2>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Orders Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Export all orders assigned to your hub with detailed information including status, dates, and product details.
                        </p>
                        <Button onClick={handleExportOrders} className="w-full">
                            <Download className="mr-2 h-4 w-4" />
                            Export Orders (CSV)
                        </Button>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <FileText className="h-5 w-5" />
                            Inventory Report
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            Export current inventory levels, stock status, and pending orders for all products in your hub.
                        </p>
                        <Button
                            onClick={handleExportInventory}
                            disabled={exportInventory.isPending}
                            className="w-full"
                        >
                            {exportInventory.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Exporting...
                                </>
                            ) : (
                                <>
                                    <Download className="mr-2 h-4 w-4" />
                                    Export Inventory (CSV)
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Report Summary</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Total Orders</span>
                            <span className="font-medium">{orders?.length || 0}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">Last Export</span>
                            <span className="font-medium">Never</span>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
