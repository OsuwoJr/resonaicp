import { useState, useMemo } from 'react';
import { UserProfile, OrderStatus, OrderFilter } from '../../../backend';
import {
    useGetArtistOrderSummary,
    useGetFilteredArtistOrders,
    useGetArtistProducts,
    useGetHubs,
} from '../../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '../../ui/sheet';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table';
import { Loader2, Package, Search, AlertCircle, Calendar, MapPin, AlertTriangle } from 'lucide-react';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { Alert, AlertDescription, AlertTitle } from '../../ui/alert';

interface OrdersTabProps {
    userProfile: UserProfile;
}

export default function OrdersTab({ userProfile }: OrdersTabProps) {
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();

    // State for filters
    const [statusFilter, setStatusFilter] = useState<OrderStatus | 'all'>('all');
    const [dateRangeFilter, setDateRangeFilter] = useState<string>('30');
    const [hubFilter, setHubFilter] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState<string>('');
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

    // Build filter object - convert to BigInt for backend, but sanitized for React Query
    const filter: OrderFilter = useMemo(() => {
        const now = Date.now() * 1000000; // Convert to nanoseconds
        const daysAgo = parseInt(dateRangeFilter);
        const startDate = daysAgo > 0 ? BigInt(now - daysAgo * 24 * 60 * 60 * 1000 * 1000000) : undefined;

        return {
            status: statusFilter !== 'all' ? statusFilter : undefined,
            startDate,
            endDate: undefined,
            hub: hubFilter !== 'all' ? hubFilter : undefined,
            searchTerm: searchTerm.trim() || undefined,
        };
    }, [statusFilter, dateRangeFilter, hubFilter, searchTerm]);

    // Fetch data - only when artistPrincipal is available
    // Data is now automatically converted from BigInt to number by useQueries hooks
    const { data: orderSummary, isLoading: summaryLoading, error: summaryError } = useGetArtistOrderSummary(artistPrincipal!);
    const { data: products, isLoading: productsLoading, error: productsError } = useGetArtistProducts(artistPrincipal!);
    const { data: hubs, isLoading: hubsLoading } = useGetHubs();
    const { data: orders, isLoading: ordersLoading, error: ordersError } = useGetFilteredArtistOrders(artistPrincipal!, filter);

    // Get selected order details
    const selectedOrder = useMemo(() => {
        if (!selectedOrderId || !orders) return null;
        return orders.find((o) => o.id === selectedOrderId) || null;
    }, [selectedOrderId, orders]);

    // Get product name for an order
    const getProductName = (productId: string) => {
        const product = products?.find((p) => p.id === productId);
        return product?.name || productId;
    };

    // Get hub name
    const getHubName = (hubId?: string) => {
        if (!hubId) return 'Not assigned';
        const hub = hubs?.find((h) => h.id === hubId);
        return hub?.name || hubId;
    };

    // Get product price - now returns number instead of BigInt
    const getProductPrice = (productId: string): number => {
        const product = products?.find((p) => p.id === productId);
        return product?.price || 0;
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
            [OrderStatus.processing]: 'IN PRODUCTION',
            [OrderStatus.shipped]: 'SHIPPED',
            [OrderStatus.delivered]: 'DELIVERED',
        };
        return labels[status] || '';
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount / 100);
    };

    const formatDate = (timestamp: number) => {
        return new Date(timestamp / 1000000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    // Check if artist principal is available
    if (!artistPrincipal) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold">Product Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        Track and manage orders for your products
                    </p>
                </div>
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Authentication Required</AlertTitle>
                    <AlertDescription>
                        Please log in to view your orders. Your identity is being verified.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Show loading state for initial data fetch
    if (summaryLoading || productsLoading) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold">Product Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        Track and manage orders for your products
                    </p>
                </div>
                <div className="flex flex-col items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                    <p className="text-sm text-muted-foreground">Loading order data...</p>
                </div>
            </div>
        );
    }

    // Show error state
    if (summaryError || productsError) {
        return (
            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-semibold">Product Orders</h2>
                    <p className="text-sm text-muted-foreground">
                        Track and manage orders for your products
                    </p>
                </div>
                <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error Loading Orders</AlertTitle>
                    <AlertDescription>
                        {summaryError?.message || productsError?.message || 'Failed to load order data. Please try refreshing the page.'}
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    // Safe defaults for order summary - now using numbers instead of BigInt
    const safeOrderSummary = orderSummary || {
        totalOrders: 0,
        inProduction: 0,
        shipped: 0,
        delivered: 0,
        urgent: 0,
        pending: 0,
    };

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-2xl font-semibold">Product Orders</h2>
                <p className="text-sm text-muted-foreground">
                    Track and manage orders for your products
                </p>
            </div>

            {/* Order Summary */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Orders
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{safeOrderSummary.totalOrders}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            In Production
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {safeOrderSummary.inProduction}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Shipped
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                            {safeOrderSummary.shipped}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Delivered
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-500">
                            {safeOrderSummary.delivered}
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/20 bg-orange-500/5">
                    <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-sm font-medium text-orange-500">
                            <AlertCircle className="h-4 w-4" />
                            Urgent
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-500">
                            {safeOrderSummary.urgent}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader>
                    <CardTitle>Filter Orders</CardTitle>
                    <CardDescription>Refine your order list with filters and search</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        {/* Status Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="status-filter">Status</Label>
                            <Select
                                value={statusFilter}
                                onValueChange={(value) => setStatusFilter(value as OrderStatus | 'all')}
                            >
                                <SelectTrigger id="status-filter">
                                    <SelectValue placeholder="All Statuses" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Statuses</SelectItem>
                                    <SelectItem value={OrderStatus.pending}>Pending</SelectItem>
                                    <SelectItem value={OrderStatus.assigned}>Assigned</SelectItem>
                                    <SelectItem value={OrderStatus.processing}>In Production</SelectItem>
                                    <SelectItem value={OrderStatus.shipped}>Shipped</SelectItem>
                                    <SelectItem value={OrderStatus.delivered}>Delivered</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Range Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="date-filter">Date Range</Label>
                            <Select value={dateRangeFilter} onValueChange={setDateRangeFilter}>
                                <SelectTrigger id="date-filter">
                                    <SelectValue placeholder="Last 30 days" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="7">Last 7 days</SelectItem>
                                    <SelectItem value="30">Last 30 days</SelectItem>
                                    <SelectItem value="90">Last 90 days</SelectItem>
                                    <SelectItem value="365">Last year</SelectItem>
                                    <SelectItem value="0">All time</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Hub Filter */}
                        <div className="space-y-2">
                            <Label htmlFor="hub-filter">Hub</Label>
                            <Select value={hubFilter} onValueChange={setHubFilter} disabled={hubsLoading}>
                                <SelectTrigger id="hub-filter">
                                    <SelectValue placeholder="All Hubs" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Hubs</SelectItem>
                                    {hubs?.map((hub) => (
                                        <SelectItem key={hub.id} value={hub.id}>
                                            {hub.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Search */}
                        <div className="space-y-2">
                            <Label htmlFor="search">Search</Label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                                <Input
                                    id="search"
                                    placeholder="Order ID, customer..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {(statusFilter !== 'all' ||
                        dateRangeFilter !== '30' ||
                        hubFilter !== 'all' ||
                        searchTerm) && (
                        <div className="mt-4">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setStatusFilter('all');
                                    setDateRangeFilter('30');
                                    setHubFilter('all');
                                    setSearchTerm('');
                                }}
                            >
                                Clear Filters
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Orders Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Orders</CardTitle>
                    <CardDescription>
                        {ordersLoading
                            ? 'Loading orders...'
                            : `Showing ${orders?.length || 0} order${orders?.length !== 1 ? 's' : ''}`}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {ordersLoading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                            <p className="text-sm text-muted-foreground">Loading orders...</p>
                        </div>
                    ) : ordersError ? (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>Error Loading Orders</AlertTitle>
                            <AlertDescription>
                                {ordersError.message || 'Failed to load orders. Please try again.'}
                            </AlertDescription>
                        </Alert>
                    ) : !orders || orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                            <p className="mb-2 text-lg font-medium">No orders found</p>
                            <p className="text-sm text-muted-foreground text-center max-w-md">
                                {statusFilter !== 'all' || dateRangeFilter !== '30' || hubFilter !== 'all' || searchTerm
                                    ? 'Try adjusting your filters to see more results'
                                    : 'Orders for your products will appear here once customers make purchases'}
                            </p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Product</TableHead>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Hub</TableHead>
                                        <TableHead>Quantity</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {orders.map((order) => {
                                        const totalPrice = getProductPrice(order.productId) * order.quantity;
                                        return (
                                            <TableRow key={order.id} className="cursor-pointer hover:bg-muted/50">
                                                <TableCell className="font-medium">
                                                    #{order.id.slice(-8)}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge className={getStatusColor(order.status)}>
                                                        {getStatusLabel(order.status)}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell>{getProductName(order.productId)}</TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {formatDate(order.createdAt)}
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">
                                                    {getHubName(order.assignedHub)}
                                                </TableCell>
                                                <TableCell>{order.quantity}</TableCell>
                                                <TableCell className="text-right font-medium">
                                                    {formatCurrency(totalPrice)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setSelectedOrderId(order.id)}
                                                    >
                                                        View
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Order Detail Sheet */}
            <Sheet open={!!selectedOrderId} onOpenChange={(open) => !open && setSelectedOrderId(null)}>
                <SheetContent className="w-full sm:max-w-lg">
                    <SheetHeader>
                        <SheetTitle>Order Details</SheetTitle>
                        <SheetDescription>
                            Order #{selectedOrder?.id.slice(-8)}
                        </SheetDescription>
                    </SheetHeader>

                    {selectedOrder && (
                        <div className="mt-6 space-y-6">
                            {/* Status */}
                            <div>
                                <Label className="text-muted-foreground">Status</Label>
                                <div className="mt-2">
                                    <Badge className={getStatusColor(selectedOrder.status)}>
                                        {getStatusLabel(selectedOrder.status)}
                                    </Badge>
                                </div>
                            </div>

                            {/* Product Info */}
                            <div>
                                <Label className="text-muted-foreground">Product</Label>
                                <p className="mt-2 font-medium">{getProductName(selectedOrder.productId)}</p>
                            </div>

                            {/* Quantity */}
                            <div>
                                <Label className="text-muted-foreground">Quantity</Label>
                                <p className="mt-2 font-medium">{selectedOrder.quantity}</p>
                            </div>

                            {/* Price */}
                            <div>
                                <Label className="text-muted-foreground">Total Price</Label>
                                <p className="mt-2 text-xl font-bold">
                                    {formatCurrency(
                                        getProductPrice(selectedOrder.productId) * selectedOrder.quantity
                                    )}
                                </p>
                            </div>

                            {/* Dates */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label className="text-muted-foreground">Order Date</Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{formatDate(selectedOrder.createdAt)}</span>
                                    </div>
                                </div>
                                <div>
                                    <Label className="text-muted-foreground">Last Updated</Label>
                                    <div className="mt-2 flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm">{formatDate(selectedOrder.updatedAt)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Hub */}
                            <div>
                                <Label className="text-muted-foreground">Fulfillment Hub</Label>
                                <div className="mt-2 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{getHubName(selectedOrder.assignedHub)}</span>
                                </div>
                            </div>

                            {/* Buyer Info */}
                            <div>
                                <Label className="text-muted-foreground">Buyer</Label>
                                <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                                    {String(selectedOrder.buyer)}
                                </p>
                            </div>

                            {/* Order ID */}
                            <div>
                                <Label className="text-muted-foreground">Order ID</Label>
                                <p className="mt-2 font-mono text-xs text-muted-foreground break-all">
                                    {selectedOrder.id}
                                </p>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </div>
    );
}
