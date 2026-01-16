import { useState } from 'react';
import { UserProfile } from '../../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Skeleton } from '../ui/skeleton';
import ProductsTab from './artist/ProductsTab';
import OrdersTab from './artist/OrdersTab';
import AnalyticsTab from './artist/AnalyticsTab';
import InventoryTab from './artist/InventoryTab';
import ToursTab from './artist/ToursTab';
import { useGetArtistDashboardSummary } from '../../hooks/useQueries';
import { useInternetIdentity } from '../../hooks/useInternetIdentity';
import {
    TrendingUp,
    TrendingDown,
    Users,
    Package,
    DollarSign,
    Plus,
    BarChart3,
    Settings,
    AlertCircle,
    Clock,
    Star,
    ShoppingBag,
    Megaphone,
    Warehouse,
    Music,
} from 'lucide-react';

interface ArtistDashboardProps {
    userProfile: UserProfile;
}

export default function ArtistDashboard({ userProfile }: ArtistDashboardProps) {
    const [activeTab, setActiveTab] = useState('products');
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();

    const { data: summary, isLoading: summaryLoading, error: summaryError } = useGetArtistDashboardSummary(
        artistPrincipal!
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount / 100);
    };

    const formatPercentage = (value: number) => {
        const sign = value >= 0 ? '+' : '';
        return `${sign}${value.toFixed(1)}%`;
    };

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Artist Dashboard</h1>
                <p className="text-muted-foreground">Manage your products and track your sales</p>
            </div>

            {/* Dashboard Summary Section */}
            <div className="mb-8 space-y-6">
                {/* Key Metrics Grid */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    {summaryLoading ? (
                        <>
                            {[...Array(4)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                        <Skeleton className="h-4 w-24" />
                                        <Skeleton className="h-4 w-4 rounded-full" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="mb-1 h-8 w-20" />
                                        <Skeleton className="h-3 w-16" />
                                    </CardContent>
                                </Card>
                            ))}
                        </>
                    ) : summaryError ? (
                        <Card className="md:col-span-2 lg:col-span-4">
                            <CardContent className="flex items-center justify-center py-8">
                                <div className="text-center">
                                    <AlertCircle className="mx-auto mb-2 h-8 w-8 text-destructive" />
                                    <p className="text-sm text-muted-foreground">Failed to load dashboard summary</p>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        <>
                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{Number(summary?.totalSales || 0)}</div>
                                    <p className="flex items-center text-xs text-muted-foreground">
                                        {summary && summary.totalSalesChange >= 0 ? (
                                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                        ) : (
                                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                                        )}
                                        <span
                                            className={
                                                summary && summary.totalSalesChange >= 0
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }
                                        >
                                            {formatPercentage(summary?.totalSalesChange || 0)}
                                        </span>
                                        <span className="ml-1">from last month</span>
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Active Fans</CardTitle>
                                    <Users className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{Number(summary?.activeFans || 0)}</div>
                                    <p className="flex items-center text-xs text-muted-foreground">
                                        {summary && summary.activeFansGrowth >= 0 ? (
                                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                        ) : (
                                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                                        )}
                                        <span
                                            className={
                                                summary && summary.activeFansGrowth >= 0
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }
                                        >
                                            {formatPercentage(summary?.activeFansGrowth || 0)}
                                        </span>
                                        <span className="ml-1">growth</span>
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                                    <Package className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">{Number(summary?.pendingOrders || 0)}</div>
                                    <p className="flex items-center text-xs text-muted-foreground">
                                        {summary && Number(summary.urgentOrders) > 0 && (
                                            <>
                                                <AlertCircle className="mr-1 h-3 w-3 text-orange-500" />
                                                <span className="text-orange-500">
                                                    {Number(summary.urgentOrders)} urgent
                                                </span>
                                            </>
                                        )}
                                        {(!summary || Number(summary.urgentOrders) === 0) && (
                                            <span>All orders on track</span>
                                        )}
                                    </p>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                    <CardTitle className="text-sm font-medium">Revenue This Month</CardTitle>
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold">
                                        {formatCurrency(Number(summary?.monthlyRevenue || 0))}
                                    </div>
                                    <p className="flex items-center text-xs text-muted-foreground">
                                        {summary && summary.monthlyRevenueGrowth >= 0 ? (
                                            <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                        ) : (
                                            <TrendingDown className="mr-1 h-3 w-3 text-red-500" />
                                        )}
                                        <span
                                            className={
                                                summary && summary.monthlyRevenueGrowth >= 0
                                                    ? 'text-green-500'
                                                    : 'text-red-500'
                                            }
                                        >
                                            {formatPercentage(summary?.monthlyRevenueGrowth || 0)}
                                        </span>
                                        <span className="ml-1">from last month</span>
                                    </p>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>

                {/* Quick Actions & Stats */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {/* Quick Actions */}
                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                            <CardDescription>Common tasks and shortcuts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => setActiveTab('products')}
                                >
                                    <Plus className="mr-2 h-4 w-4" />
                                    Create New Product
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => setActiveTab('orders')}
                                >
                                    <ShoppingBag className="mr-2 h-4 w-4" />
                                    View Orders
                                </Button>
                                <Button
                                    variant="outline"
                                    className="justify-start"
                                    onClick={() => setActiveTab('analytics')}
                                >
                                    <BarChart3 className="mr-2 h-4 w-4" />
                                    Analytics Dashboard
                                </Button>
                                <Button variant="outline" className="justify-start">
                                    <Settings className="mr-2 h-4 w-4" />
                                    Settings
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Quick Stats */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Quick Stats</CardTitle>
                            <CardDescription>Performance overview</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {summaryLoading ? (
                                <>
                                    {[...Array(4)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between">
                                            <Skeleton className="h-4 w-32" />
                                            <Skeleton className="h-4 w-12" />
                                        </div>
                                    ))}
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Products Published</span>
                                        <span className="font-semibold">
                                            {Number(summary?.productsPublished || 0)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Avg. Order Value</span>
                                        <span className="font-semibold">
                                            {formatCurrency(Number(summary?.averageOrderValue || 0) * 100)}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Customer Satisfaction</span>
                                        <div className="flex items-center">
                                            <Star className="mr-1 h-3 w-3 fill-yellow-400 text-yellow-400" />
                                            <span className="font-semibold">
                                                {summary?.customerSatisfaction.toFixed(1) || '0.0'}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-muted-foreground">Fulfillment Time</span>
                                        <div className="flex items-center">
                                            <Clock className="mr-1 h-3 w-3 text-muted-foreground" />
                                            <span className="font-semibold">
                                                {summary?.fulfillmentTime.toFixed(1) || '0.0'} days
                                            </span>
                                        </div>
                                    </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Recent Activity & Top Tracks */}
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Top Tracks */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top Tracks</CardTitle>
                            <CardDescription>Your best performing products</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {summary?.topTracks && summary.topTracks.length > 0 ? (
                                        summary.topTracks.map((track, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between rounded-lg border p-3"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="secondary" className="h-6 w-6 justify-center p-0">
                                                        {index + 1}
                                                    </Badge>
                                                    <span className="text-sm font-medium">{track}</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No top tracks yet</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Action Items */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Action Items</CardTitle>
                            <CardDescription>Tasks requiring your attention</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {summaryLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-10 w-full" />
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {summary?.actionItems && summary.actionItems.length > 0 ? (
                                        summary.actionItems.map((item, index) => (
                                            <div
                                                key={index}
                                                className="flex items-start gap-3 rounded-lg border p-3"
                                            >
                                                <AlertCircle className="mt-0.5 h-4 w-4 text-orange-500" />
                                                <span className="text-sm">{item}</span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-muted-foreground">No action items</p>
                                    )}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Announcements */}
                {summary?.announcements && summary.announcements.length > 0 && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Megaphone className="h-5 w-5" />
                                Platform Announcements
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {summary.announcements.map((announcement, index) => (
                                    <div
                                        key={index}
                                        className="rounded-lg border border-primary/20 bg-primary/5 p-3"
                                    >
                                        <p className="text-sm">{announcement}</p>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* Tabs Section */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 lg:w-auto">
                    <TabsTrigger value="products">Products</TabsTrigger>
                    <TabsTrigger value="orders">Orders</TabsTrigger>
                    <TabsTrigger value="inventory">
                        <Warehouse className="mr-2 h-4 w-4" />
                        Inventory
                    </TabsTrigger>
                    <TabsTrigger value="tours">
                        <Music className="mr-2 h-4 w-4" />
                        Tours
                    </TabsTrigger>
                    <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="products" className="space-y-4">
                    <ProductsTab userProfile={userProfile} onNavigateToInventory={() => setActiveTab('inventory')} />
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <OrdersTab userProfile={userProfile} />
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    <InventoryTab userProfile={userProfile} />
                </TabsContent>

                <TabsContent value="tours" className="space-y-4">
                    <ToursTab userProfile={userProfile} />
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    <AnalyticsTab userProfile={userProfile} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
