import { useState } from 'react';
import { UserProfile, Tour, TourStatus, TourType } from '../../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import {
    useGetArtistTours,
    useGetTourSummary,
    useGetFilteredTours,
    ConvertedTour,
    ConvertedTourSummary,
} from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import {
    Calendar,
    MapPin,
    TrendingUp,
    DollarSign,
    Ticket,
    Plus,
    Eye,
    Music,
} from 'lucide-react';

interface ToursTabProps {
    userProfile: UserProfile;
}

export default function ToursTab({ userProfile }: ToursTabProps) {
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();
    const [filterStatus, setFilterStatus] = useState<TourStatus | null>(null);

    const { data: tourSummary, isLoading: summaryLoading } = useGetTourSummary(artistPrincipal!);
    const { data: filteredTours, isLoading: toursLoading } = useGetFilteredTours(
        artistPrincipal!,
        filterStatus
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
        }).format(amount / 100);
    };

    const formatDate = (timestamp: number) => {
        return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const getTourTypeLabel = (type: TourType) => {
        switch (type) {
            case TourType.exclusiveDrop:
                return 'Exclusive Drop';
            case TourType.regularShow:
                return 'Regular Show';
            case TourType.festival:
                return 'Festival';
            default:
                return 'Unknown';
        }
    };

    const getTourStatusBadge = (status: TourStatus) => {
        switch (status) {
            case TourStatus.upcoming:
                return <Badge variant="default">Upcoming</Badge>;
            case TourStatus.completed:
                return <Badge variant="secondary">Completed</Badge>;
            case TourStatus.cancelled:
                return <Badge variant="destructive">Cancelled</Badge>;
            default:
                return <Badge variant="outline">Unknown</Badge>;
        }
    };

    const handleFilterChange = (value: string) => {
        if (value === 'all') {
            setFilterStatus(null);
        } else if (value === 'upcoming') {
            setFilterStatus(TourStatus.upcoming);
        } else if (value === 'completed') {
            setFilterStatus(TourStatus.completed);
        }
    };

    return (
        <div className="space-y-6">
            {/* Summary Section */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {summaryLoading ? (
                    <>
                        {[...Array(6)].map((_, i) => (
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
                ) : (
                    <>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Tours</CardTitle>
                                <Music className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {tourSummary?.totalTours || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">All time</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Upcoming Shows</CardTitle>
                                <Calendar className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {tourSummary?.upcomingShows || 0}
                                </div>
                                <p className="text-xs text-muted-foreground">Scheduled</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
                                <Ticket className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {tourSummary?.ticketSales || 0}
                                </div>
                                <p className="flex items-center text-xs text-muted-foreground">
                                    <TrendingUp className="mr-1 h-3 w-3 text-green-500" />
                                    <span className="text-green-500">
                                        {tourSummary?.ticketSalesPercentage.toFixed(1) || '0.0'}%
                                    </span>
                                    <span className="ml-1">sold</span>
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Merch Revenue</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(tourSummary?.totalMerchRevenue || 0)}
                                </div>
                                <p className="text-xs text-muted-foreground">All tours</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Avg. Merch per Show</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {formatCurrency(Math.round(tourSummary?.averageMerchPerShow || 0))}
                                </div>
                                <p className="text-xs text-muted-foreground">Per completed show</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Quick Action</CardTitle>
                                <Plus className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <Button className="w-full" size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Tour Date
                                </Button>
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>

            {/* Tours List */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Tour Dates</CardTitle>
                            <CardDescription>Manage your tours and exclusive drops</CardDescription>
                        </div>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Tour Date
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="all" onValueChange={handleFilterChange}>
                        <TabsList className="mb-4">
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="completed">Completed</TabsTrigger>
                        </TabsList>

                        <TabsContent value="all" className="space-y-4">
                            {toursLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-32 w-full" />
                                    ))}
                                </div>
                            ) : filteredTours && filteredTours.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTours.map((tour) => (
                                        <Card key={tour.id} className="overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">
                                                                    {tour.venueName}
                                                                </h3>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    {getTourStatusBadge(tour.status)}
                                                                    <Badge variant="outline">
                                                                        {getTourTypeLabel(tour.tourType)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                <span>{tour.location}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(tour.date)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Ticket Sales:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {tour.ticketSales} (
                                                                    {tour.ticketSalesPercentage.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Merch Revenue:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(tour.merchRevenue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 md:flex-col">
                                                        {tour.tourType === TourType.exclusiveDrop && (
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Exclusive Drop
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Music className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">No tours yet</h3>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        Start by adding your first tour date
                                    </p>
                                    <Button>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Tour Date
                                    </Button>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="upcoming" className="space-y-4">
                            {toursLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-32 w-full" />
                                    ))}
                                </div>
                            ) : filteredTours && filteredTours.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTours.map((tour) => (
                                        <Card key={tour.id} className="overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">
                                                                    {tour.venueName}
                                                                </h3>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    {getTourStatusBadge(tour.status)}
                                                                    <Badge variant="outline">
                                                                        {getTourTypeLabel(tour.tourType)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                <span>{tour.location}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(tour.date)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Ticket Sales:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {tour.ticketSales} (
                                                                    {tour.ticketSalesPercentage.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Merch Revenue:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(tour.merchRevenue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 md:flex-col">
                                                        {tour.tourType === TourType.exclusiveDrop && (
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Exclusive Drop
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Calendar className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">No upcoming tours</h3>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        Add tour dates to see them here
                                    </p>
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="completed" className="space-y-4">
                            {toursLoading ? (
                                <div className="space-y-3">
                                    {[...Array(3)].map((_, i) => (
                                        <Skeleton key={i} className="h-32 w-full" />
                                    ))}
                                </div>
                            ) : filteredTours && filteredTours.length > 0 ? (
                                <div className="space-y-3">
                                    {filteredTours.map((tour) => (
                                        <Card key={tour.id} className="overflow-hidden">
                                            <CardContent className="p-6">
                                                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex items-start justify-between gap-4">
                                                            <div>
                                                                <h3 className="text-lg font-semibold">
                                                                    {tour.venueName}
                                                                </h3>
                                                                <div className="mt-1 flex flex-wrap items-center gap-2">
                                                                    {getTourStatusBadge(tour.status)}
                                                                    <Badge variant="outline">
                                                                        {getTourTypeLabel(tour.tourType)}
                                                                    </Badge>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                                                            <div className="flex items-center gap-1">
                                                                <MapPin className="h-4 w-4" />
                                                                <span>{tour.location}</span>
                                                            </div>
                                                            <div className="flex items-center gap-1">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>{formatDate(tour.date)}</span>
                                                            </div>
                                                        </div>

                                                        <div className="flex flex-wrap gap-4 text-sm">
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Ticket Sales:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {tour.ticketSales} (
                                                                    {tour.ticketSalesPercentage.toFixed(1)}%)
                                                                </span>
                                                            </div>
                                                            <div>
                                                                <span className="text-muted-foreground">
                                                                    Merch Revenue:{' '}
                                                                </span>
                                                                <span className="font-medium">
                                                                    {formatCurrency(tour.merchRevenue)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex gap-2 md:flex-col">
                                                        {tour.tourType === TourType.exclusiveDrop && (
                                                            <Button variant="outline" size="sm">
                                                                <Eye className="mr-2 h-4 w-4" />
                                                                View Exclusive Drop
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Music className="mb-4 h-12 w-12 text-muted-foreground" />
                                    <h3 className="mb-2 text-lg font-semibold">No completed tours</h3>
                                    <p className="mb-4 text-sm text-muted-foreground">
                                        Completed tours will appear here
                                    </p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}
