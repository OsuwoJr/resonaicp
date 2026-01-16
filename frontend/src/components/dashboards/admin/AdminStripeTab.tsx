import { useState } from 'react';
import { useIsStripeConfigured, useSetStripeConfiguration } from '../../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { StripeConfiguration } from '../../../backend';

export default function AdminStripeTab() {
    const { data: isConfigured, isLoading } = useIsStripeConfigured();
    const setConfig = useSetStripeConfiguration();
    const [secretKey, setSecretKey] = useState('');
    const [countries, setCountries] = useState('US,CA,GB');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const config: StripeConfiguration = {
            secretKey,
            allowedCountries: countries.split(',').map((c) => c.trim()),
        };

        try {
            await setConfig.mutateAsync(config);
            toast.success('Stripe configuration saved successfully');
            setSecretKey('');
        } catch (error) {
            toast.error('Failed to save Stripe configuration');
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
            <div>
                <h2 className="text-2xl font-semibold">Stripe Configuration</h2>
                <p className="text-sm text-muted-foreground">Configure payment processing with Stripe</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        {isConfigured ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                Stripe Configured
                            </>
                        ) : (
                            <>
                                <AlertCircle className="h-5 w-5 text-yellow-500" />
                                Stripe Not Configured
                            </>
                        )}
                    </CardTitle>
                    <CardDescription>
                        {isConfigured
                            ? 'Payment processing is active. Update configuration below if needed.'
                            : 'Configure Stripe to enable payment processing on the platform.'}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="secretKey">Stripe Secret Key</Label>
                            <Input
                                id="secretKey"
                                type="password"
                                value={secretKey}
                                onChange={(e) => setSecretKey(e.target.value)}
                                placeholder="sk_test_..."
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Your Stripe secret key (starts with sk_test_ or sk_live_)
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="countries">Allowed Countries</Label>
                            <Input
                                id="countries"
                                value={countries}
                                onChange={(e) => setCountries(e.target.value)}
                                placeholder="US,CA,GB"
                                required
                            />
                            <p className="text-xs text-muted-foreground">
                                Comma-separated list of country codes (e.g., US, CA, GB)
                            </p>
                        </div>

                        <Button type="submit" disabled={setConfig.isPending}>
                            {setConfig.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Saving...
                                </>
                            ) : (
                                'Save Configuration'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            <Card className="border-yellow-500/20 bg-yellow-500/5">
                <CardHeader>
                    <CardTitle className="text-sm">Payment Split Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <p>All payments are automatically split as follows:</p>
                    <ul className="list-inside list-disc space-y-1 text-muted-foreground">
                        <li>Artist: 70% of total amount</li>
                        <li>Fulfillment Hub: 20% of total amount</li>
                        <li>Platform: 10% of total amount</li>
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
