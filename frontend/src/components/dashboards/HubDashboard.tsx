import { useState, useEffect } from 'react';
import { UserProfile } from '../../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Alert, AlertDescription } from '../ui/alert';
import HubDashboardOverview from './hub/HubDashboardOverview';
import HubJobQueue from './hub/HubJobQueue';
import HubSettlements from './hub/HubSettlements';
import HubAnalytics from './hub/HubAnalytics';
import HubInventory from './hub/HubInventory';
import HubShipping from './hub/HubShipping';
import HubReports from './hub/HubReports';
import HubSettings from './hub/HubSettings';
import { useGetCallerHub } from '../../hooks/useQueries';
import { 
    LayoutDashboard, 
    ListOrdered, 
    DollarSign, 
    BarChart3, 
    Package, 
    Truck, 
    FileText, 
    Settings,
    Loader2,
    AlertCircle
} from 'lucide-react';

interface HubDashboardProps {
    userProfile: UserProfile;
}

export default function HubDashboard({ userProfile }: HubDashboardProps) {
    const [activeTab, setActiveTab] = useState('dashboard');
    const { data: callerHub, isLoading: hubLoading, error: hubError } = useGetCallerHub();

    // Automatically navigate to settings if no hub exists or if there's an error
    useEffect(() => {
        if (!hubLoading && (!callerHub || hubError)) {
            setActiveTab('settings');
        }
    }, [hubLoading, callerHub, hubError]);

    const hubId = callerHub?.id || '';

    if (hubLoading) {
        return (
            <div className="container mx-auto px-4 py-8">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    <span className="ml-3 text-muted-foreground">Loading hub information...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Fulfillment Hub Dashboard</h1>
                <p className="text-muted-foreground">Manage your fulfillment operations and track performance</p>
            </div>

            {!callerHub && !hubLoading && (
                <Alert variant="destructive" className="mb-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        No hub found for your account. Please complete the hub settings to get started.
                    </AlertDescription>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
                    <TabsTrigger value="dashboard" className="flex items-center gap-2" disabled={!hubId}>
                        <LayoutDashboard className="h-4 w-4" />
                        <span className="hidden sm:inline">Dashboard</span>
                    </TabsTrigger>
                    <TabsTrigger value="job-queue" className="flex items-center gap-2" disabled={!hubId}>
                        <ListOrdered className="h-4 w-4" />
                        <span className="hidden sm:inline">Job Queue</span>
                    </TabsTrigger>
                    <TabsTrigger value="settlements" className="flex items-center gap-2" disabled={!hubId}>
                        <DollarSign className="h-4 w-4" />
                        <span className="hidden sm:inline">Settlements</span>
                    </TabsTrigger>
                    <TabsTrigger value="analytics" className="flex items-center gap-2" disabled={!hubId}>
                        <BarChart3 className="h-4 w-4" />
                        <span className="hidden sm:inline">Analytics</span>
                    </TabsTrigger>
                    <TabsTrigger value="inventory" className="flex items-center gap-2" disabled={!hubId}>
                        <Package className="h-4 w-4" />
                        <span className="hidden sm:inline">Inventory</span>
                    </TabsTrigger>
                    <TabsTrigger value="shipping" className="flex items-center gap-2" disabled={!hubId}>
                        <Truck className="h-4 w-4" />
                        <span className="hidden sm:inline">Shipping</span>
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2" disabled={!hubId}>
                        <FileText className="h-4 w-4" />
                        <span className="hidden sm:inline">Reports</span>
                    </TabsTrigger>
                    <TabsTrigger value="settings" className="flex items-center gap-2">
                        <Settings className="h-4 w-4" />
                        <span className="hidden sm:inline">Settings</span>
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="dashboard" className="space-y-4">
                    {hubId ? (
                        <HubDashboardOverview hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="job-queue" className="space-y-4">
                    {hubId ? (
                        <HubJobQueue hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="settlements" className="space-y-4">
                    {hubId ? (
                        <HubSettlements hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                    {hubId ? (
                        <HubAnalytics hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="inventory" className="space-y-4">
                    {hubId ? (
                        <HubInventory hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="shipping" className="space-y-4">
                    {hubId ? (
                        <HubShipping hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                    {hubId ? (
                        <HubReports hubId={hubId} />
                    ) : (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                Please complete your hub settings first.
                            </AlertDescription>
                        </Alert>
                    )}
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                    <HubSettings hubId={hubId} userProfile={userProfile} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
