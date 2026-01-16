import { useState } from 'react';
import { UserProfile } from '../../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import AdminOverviewTab from './admin/AdminOverviewTab';
import AdminHubsTab from './admin/AdminHubsTab';
import AdminStripeTab from './admin/AdminStripeTab';

interface AdminDashboardProps {
    userProfile: UserProfile;
}

export default function AdminDashboard({ userProfile }: AdminDashboardProps) {
    const [activeTab, setActiveTab] = useState('overview');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Admin Dashboard</h1>
                <p className="text-muted-foreground">Platform oversight and management</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="hubs">Fulfillment Hubs</TabsTrigger>
                    <TabsTrigger value="stripe">Stripe Config</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <AdminOverviewTab />
                </TabsContent>

                <TabsContent value="hubs" className="space-y-4">
                    <AdminHubsTab />
                </TabsContent>

                <TabsContent value="stripe" className="space-y-4">
                    <AdminStripeTab />
                </TabsContent>
            </Tabs>
        </div>
    );
}
