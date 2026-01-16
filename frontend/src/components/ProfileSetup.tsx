import { useState } from 'react';
import { useSaveCallerUserProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { AppRole, UserRole } from '../backend';
import HubApplicationForm from './HubApplicationForm';

export default function ProfileSetup() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [appRole, setAppRole] = useState<AppRole>(AppRole.buyer);
    const [showHubApplication, setShowHubApplication] = useState(false);
    const [profileSaved, setProfileSaved] = useState(false);
    const saveProfile = useSaveCallerUserProfile();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!name.trim() || !email.trim()) {
            toast.error('Please fill in all fields');
            return;
        }

        try {
            // Always save the profile first
            await saveProfile.mutateAsync({
                name: name.trim(),
                email: email.trim(),
                role: UserRole.user,
                appRole: appRole,
            });

            // If user selected hub role, show hub application form after profile is saved
            if (appRole === AppRole.hub) {
                setProfileSaved(true);
                setShowHubApplication(true);
                toast.success('Profile created! Please complete your hub application.');
            } else {
                toast.success('Profile created successfully!');
            }
        } catch (error) {
            toast.error('Failed to create profile');
            console.error(error);
        }
    };

    // Show hub application form after profile is saved
    if (showHubApplication && profileSaved) {
        return <HubApplicationForm />;
    }

    return (
        <div className="container mx-auto flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-16">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">Welcome to Resona!</CardTitle>
                    <CardDescription>Let's set up your profile to get started</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Full Name</Label>
                            <Input
                                id="name"
                                placeholder="Enter your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="your@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>I am a...</Label>
                            <RadioGroup value={appRole} onValueChange={(value) => setAppRole(value as AppRole)}>
                                <div className="flex items-center space-x-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
                                    <RadioGroupItem value={AppRole.buyer} id="buyer" />
                                    <Label htmlFor="buyer" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🛍️</span>
                                            <div>
                                                <div className="font-medium">Buyer</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Browse and purchase merchandise
                                                </div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
                                    <RadioGroupItem value={AppRole.artist} id="artist" />
                                    <Label htmlFor="artist" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">🎨</span>
                                            <div>
                                                <div className="font-medium">Artist</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Create and sell merchandise
                                                </div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
                                    <RadioGroupItem value={AppRole.hub} id="hub" />
                                    <Label htmlFor="hub" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">📦</span>
                                            <div>
                                                <div className="font-medium">Fulfillment Hub</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Apply to manage order fulfillment
                                                </div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>

                                <div className="flex items-center space-x-2 rounded-lg border border-border p-3 transition-colors hover:bg-accent">
                                    <RadioGroupItem value={AppRole.admin} id="admin" />
                                    <Label htmlFor="admin" className="flex-1 cursor-pointer">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">👑</span>
                                            <div>
                                                <div className="font-medium">Platform Admin</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Manage the entire platform
                                                </div>
                                            </div>
                                        </div>
                                    </Label>
                                </div>
                            </RadioGroup>
                        </div>

                        <Button type="submit" className="w-full" disabled={saveProfile.isPending}>
                            {saveProfile.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Creating Profile...
                                </>
                            ) : (
                                appRole === AppRole.hub ? 'Continue to Hub Application' : 'Create Profile'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
