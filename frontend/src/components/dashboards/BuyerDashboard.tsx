import { useState } from 'react';
import { UserProfile } from '../../backend';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import BrowseTab from './buyer/BrowseTab';
import MyOrdersTab from './buyer/MyOrdersTab';

interface BuyerDashboardProps {
    userProfile: UserProfile;
}

export default function BuyerDashboard({ userProfile }: BuyerDashboardProps) {
    const [activeTab, setActiveTab] = useState('browse');

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold text-foreground">Buyer Dashboard</h1>
                <p className="text-muted-foreground">Discover exclusive merchandise and track your orders</p>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 lg:w-auto">
                    <TabsTrigger value="browse">Browse Products</TabsTrigger>
                    <TabsTrigger value="orders">My Orders</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-4">
                    <BrowseTab userProfile={userProfile} />
                </TabsContent>

                <TabsContent value="orders" className="space-y-4">
                    <MyOrdersTab userProfile={userProfile} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
