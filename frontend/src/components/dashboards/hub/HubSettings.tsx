import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Textarea } from '../../ui/textarea';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Alert, AlertDescription } from '../../ui/alert';
import { UserProfile, HubStatus } from '../../../backend';
import { useGetCallerHub, useUpdateHub, useSubmitHubForApproval } from '../../../hooks/useQueries';
import { Settings as SettingsIcon, Loader2, AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { toast } from 'sonner';

interface HubSettingsProps {
    hubId: string;
    userProfile: UserProfile;
}

export default function HubSettings({ hubId, userProfile }: HubSettingsProps) {
    const { data: currentHub, isLoading: hubLoading, error: hubError } = useGetCallerHub();
    const updateHub = useUpdateHub();
    const submitForApproval = useSubmitHubForApproval();

    const [hubName, setHubName] = useState('');
    const [businessInfo, setBusinessInfo] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [services, setServices] = useState('');
    const [capacity, setCapacity] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    useEffect(() => {
        if (currentHub) {
            setHubName(currentHub.name);
            setBusinessInfo(currentHub.businessInfo);
            setContactInfo(currentHub.contactInfo);
            setServices(currentHub.services);
            setCapacity(currentHub.capacity.toString());
            setLatitude(currentHub.location[0].toString());
            setLongitude(currentHub.location[1].toString());
        }
    }, [currentHub]);

    const handleSaveChanges = async () => {
        if (!currentHub) {
            toast.error('Hub information not loaded. Please refresh the page.');
            return;
        }

        if (!hubName.trim() || !businessInfo.trim() || !contactInfo.trim() || !latitude || !longitude || !capacity) {
            toast.error('Please fill in all required fields');
            return;
        }

        const parsedCapacity = parseInt(capacity);
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);

        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            toast.error('Capacity must be a positive number');
            return;
        }

        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            toast.error('Please enter valid latitude and longitude coordinates');
            return;
        }

        try {
            await updateHub.mutateAsync({
                id: currentHub.id,
                name: hubName.trim(),
                businessInfo: businessInfo.trim(),
                contactInfo: contactInfo.trim(),
                services: services.trim(),
                capacity: BigInt(parsedCapacity),
                location: [parsedLatitude, parsedLongitude],
                status: currentHub.status as HubStatus,
                createdAt: BigInt(currentHub.createdAt),
                updatedAt: BigInt(Date.now() * 1000000),
            });
            toast.success('Hub information updated successfully');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to update hub information';
            toast.error(errorMessage);
            console.error('Update hub error:', error);
        }
    };

    const handleApplyForApproval = async () => {
        if (!currentHub) {
            toast.error('Hub information not loaded. Please refresh the page.');
            return;
        }

        if (!hubName.trim() || !businessInfo.trim() || !contactInfo.trim() || !latitude || !longitude || !capacity) {
            toast.error('Please fill in all required fields before applying');
            return;
        }

        const parsedCapacity = parseInt(capacity);
        const parsedLatitude = parseFloat(latitude);
        const parsedLongitude = parseFloat(longitude);

        if (isNaN(parsedCapacity) || parsedCapacity <= 0) {
            toast.error('Capacity must be a positive number');
            return;
        }

        if (isNaN(parsedLatitude) || isNaN(parsedLongitude)) {
            toast.error('Please enter valid latitude and longitude coordinates');
            return;
        }

        try {
            // First save any changes
            await updateHub.mutateAsync({
                id: currentHub.id,
                name: hubName.trim(),
                businessInfo: businessInfo.trim(),
                contactInfo: contactInfo.trim(),
                services: services.trim(),
                capacity: BigInt(parsedCapacity),
                location: [parsedLatitude, parsedLongitude],
                status: currentHub.status as HubStatus,
                createdAt: BigInt(currentHub.createdAt),
                updatedAt: BigInt(Date.now() * 1000000),
            });

            // Then submit for approval
            await submitForApproval.mutateAsync(currentHub.id);
            toast.success('Application submitted for admin approval! You will be notified once reviewed.');
        } catch (error: any) {
            const errorMessage = error?.message || 'Failed to submit application';
            toast.error(errorMessage);
            console.error('Submit for approval error:', error);
        }
    };

    const getStatusBadge = (status: HubStatus) => {
        switch (status) {
            case HubStatus.approved:
                return (
                    <Badge className="bg-green-500 hover:bg-green-600">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Approved
                    </Badge>
                );
            case HubStatus.pendingApproval:
                return (
                    <Badge className="bg-yellow-500 hover:bg-yellow-600">
                        <Clock className="mr-1 h-3 w-3" />
                        Pending Approval
                    </Badge>
                );
            case HubStatus.rejected:
                return (
                    <Badge variant="destructive">
                        <XCircle className="mr-1 h-3 w-3" />
                        Rejected
                    </Badge>
                );
            case HubStatus.suspended:
                return (
                    <Badge variant="destructive">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Suspended
                    </Badge>
                );
            case HubStatus.draft:
                return (
                    <Badge variant="outline">
                        <AlertCircle className="mr-1 h-3 w-3" />
                        Draft
                    </Badge>
                );
            default:
                return null;
        }
    };

    if (hubLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-3 text-muted-foreground">Loading hub information...</span>
            </div>
        );
    }

    if (hubError) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    Failed to load hub information. Please try refreshing the page. If the problem persists, contact support.
                </AlertDescription>
            </Alert>
        );
    }

    if (!currentHub) {
        return (
            <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                    No hub found for your account. Please contact support if you believe this is an error.
                </AlertDescription>
            </Alert>
        );
    }

    const isApproved = currentHub.status === HubStatus.approved;
    const isPending = currentHub.status === HubStatus.pendingApproval;
    const isRejected = currentHub.status === HubStatus.rejected;
    const isSuspended = currentHub.status === HubStatus.suspended;
    const isDraft = currentHub.status === HubStatus.draft;
    const canApplyForApproval = (isDraft || isRejected) && !isPending;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold">Hub Settings</h2>
                {getStatusBadge(currentHub.status as HubStatus)}
            </div>

            {isPending && (
                <Alert>
                    <Clock className="h-4 w-4" />
                    <AlertDescription>
                        Your hub application is pending admin approval. You can still update your information while waiting.
                    </AlertDescription>
                </Alert>
            )}

            {isRejected && (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertDescription>
                        Your hub application was rejected. Please update your information and reapply for approval.
                    </AlertDescription>
                </Alert>
            )}

            {isSuspended && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Your hub has been suspended. Please contact support for more information.
                    </AlertDescription>
                </Alert>
            )}

            {isDraft && (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Your hub is in draft status. Complete the information below and click "Apply for Approval" to submit your application.
                    </AlertDescription>
                </Alert>
            )}

            {isApproved && (
                <Alert className="border-green-500/20 bg-green-500/10">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-700 dark:text-green-400">
                        Your hub is approved and visible to artists for product assignment!
                    </AlertDescription>
                </Alert>
            )}

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <SettingsIcon className="h-5 w-5" />
                        Hub Information
                    </CardTitle>
                    <CardDescription>
                        Update your hub's basic information and contact details
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="hubId">Hub ID</Label>
                        <Input id="hubId" value={currentHub.id} disabled />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="hubName">Hub Name *</Label>
                        <Input
                            id="hubName"
                            placeholder="Enter hub name"
                            value={hubName}
                            onChange={(e) => setHubName(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="businessInfo">Business Information *</Label>
                        <Textarea
                            id="businessInfo"
                            placeholder="Describe your business, experience, and capabilities"
                            value={businessInfo}
                            onChange={(e) => setBusinessInfo(e.target.value)}
                            rows={4}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactInfo">Contact Information *</Label>
                        <Textarea
                            id="contactInfo"
                            placeholder="Phone, email, address, etc."
                            value={contactInfo}
                            onChange={(e) => setContactInfo(e.target.value)}
                            rows={3}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="services">Services Offered</Label>
                        <Textarea
                            id="services"
                            placeholder="List the services you can provide"
                            value={services}
                            onChange={(e) => setServices(e.target.value)}
                            rows={3}
                            disabled={isPending}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactEmail">Contact Email (from profile)</Label>
                        <Input id="contactEmail" type="email" value={userProfile.email} disabled />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="contactName">Contact Name (from profile)</Label>
                        <Input id="contactName" value={userProfile.name} disabled />
                    </div>

                    {!isPending && (
                        <Button
                            className="w-full"
                            onClick={handleSaveChanges}
                            disabled={updateHub.isPending}
                        >
                            {updateHub.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Changes'
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Operational Settings</CardTitle>
                    <CardDescription>
                        Configure your hub's capacity and location
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="capacity">Hub Capacity (orders per month) *</Label>
                        <Input
                            id="capacity"
                            type="number"
                            min="1"
                            placeholder="Maximum orders"
                            value={capacity}
                            onChange={(e) => setCapacity(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="latitude">Latitude *</Label>
                            <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={latitude}
                                onChange={(e) => setLatitude(e.target.value)}
                                placeholder="37.7749"
                                disabled={isPending}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="longitude">Longitude *</Label>
                            <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={longitude}
                                onChange={(e) => setLongitude(e.target.value)}
                                placeholder="-122.4194"
                                disabled={isPending}
                            />
                        </div>
                    </div>

                    {!isPending && (
                        <Button
                            className="w-full"
                            onClick={handleSaveChanges}
                            disabled={updateHub.isPending}
                        >
                            {updateHub.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Settings'
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {canApplyForApproval && (
                <Card>
                    <CardHeader>
                        <CardTitle>Hub Approval</CardTitle>
                        <CardDescription>
                            {isRejected
                                ? 'Your previous application was rejected. Update your information and reapply.'
                                : 'Apply for admin approval to make your hub visible to artists and buyers.'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            className="w-full"
                            onClick={handleApplyForApproval}
                            disabled={submitForApproval.isPending || updateHub.isPending}
                            variant={isRejected ? 'default' : 'outline'}
                        >
                            {submitForApproval.isPending || updateHub.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Application...
                                </>
                            ) : (
                                <>
                                    {isRejected ? 'Reapply for Approval' : 'Apply for Approval'}
                                </>
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
