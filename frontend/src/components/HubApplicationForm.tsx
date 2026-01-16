import { useState } from 'react';
import { useApplyForHub } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Hub, HubStatus } from '../backend';

export default function HubApplicationForm() {
    const [name, setName] = useState('');
    const [businessInfo, setBusinessInfo] = useState('');
    const [contactInfo, setContactInfo] = useState('');
    const [services, setServices] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');
    const [capacity, setCapacity] = useState('');
    const applyForHub = useApplyForHub();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !businessInfo.trim() || !contactInfo.trim() || !latitude || !longitude || !capacity) {
            toast.error('Please fill in all required fields');
            return;
        }

        const hubData: Hub = {
            id: `hub-${Date.now()}`,
            name: name.trim(),
            location: [parseFloat(latitude), parseFloat(longitude)],
            capacity: BigInt(parseInt(capacity)),
            status: HubStatus.pendingApproval,
            businessInfo: businessInfo.trim(),
            contactInfo: contactInfo.trim(),
            services: services.trim(),
            createdAt: BigInt(Date.now() * 1000000),
            updatedAt: BigInt(Date.now() * 1000000),
        };

        try {
            await applyForHub.mutateAsync(hubData);
            toast.success('Hub application submitted! Awaiting admin approval.');
            // Reset form
            setName('');
            setBusinessInfo('');
            setContactInfo('');
            setServices('');
            setLatitude('');
            setLongitude('');
            setCapacity('');
        } catch (error) {
            toast.error('Failed to submit hub application');
            console.error(error);
        }
    };

    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle className="text-2xl">Apply to Become a Fulfillment Hub</CardTitle>
                    <CardDescription>
                        Submit your application to join our fulfillment network. Your application will be reviewed by our admin team.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Hub Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., West Coast Fulfillment Center"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
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
                                required
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
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="services">Services Offered</Label>
                            <Textarea
                                id="services"
                                placeholder="List the services you can provide (e.g., warehousing, packaging, shipping)"
                                value={services}
                                onChange={(e) => setServices(e.target.value)}
                                rows={3}
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
                                    required
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
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="capacity">Capacity (orders per month) *</Label>
                            <Input
                                id="capacity"
                                type="number"
                                min="1"
                                value={capacity}
                                onChange={(e) => setCapacity(e.target.value)}
                                placeholder="100"
                                required
                            />
                        </div>

                        <Button type="submit" className="w-full" disabled={applyForHub.isPending}>
                            {applyForHub.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Submitting Application...
                                </>
                            ) : (
                                'Submit Application'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
