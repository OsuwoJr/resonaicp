import { useInternetIdentity } from './hooks/useInternetIdentity';
import { useGetCallerUserProfile } from './hooks/useQueries';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import Header from './components/Header';
import Footer from './components/Footer';
import ProfileSetup from './components/ProfileSetup';
import Dashboard from './components/Dashboard';
import { Loader2 } from 'lucide-react';

export default function App() {
    const { identity, isInitializing } = useInternetIdentity();
    const { data: userProfile, isLoading: profileLoading, isFetched } = useGetCallerUserProfile();

    const isAuthenticated = !!identity;
    const showProfileSetup = isAuthenticated && !profileLoading && isFetched && userProfile === null;
    const showDashboard = isAuthenticated && !profileLoading && userProfile !== null;

    if (isInitializing || (isAuthenticated && profileLoading)) {
        return (
            <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                <div className="flex min-h-screen items-center justify-center bg-background">
                    <div className="text-center">
                        <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary" />
                        <p className="mt-4 text-muted-foreground">Loading...</p>
                    </div>
                </div>
                <Toaster />
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
            <div className="flex min-h-screen flex-col bg-background">
                <Header />
                <main className="flex-1">
                    {!isAuthenticated && <LandingPage />}
                    {showProfileSetup && <ProfileSetup />}
                    {showDashboard && userProfile && <Dashboard userProfile={userProfile} />}
                </main>
                <Footer />
            </div>
            <Toaster />
        </ThemeProvider>
    );
}

function LandingPage() {
    const { login, isLoggingIn } = useInternetIdentity();

    return (
        <div className="container mx-auto px-4 py-16">
            <div className="mx-auto max-w-4xl text-center">
                <div className="mb-8">
                    <h1 className="mb-4 text-5xl font-bold tracking-tight text-foreground md:text-6xl">
                        Welcome to <span className="text-primary">Resona</span>
                    </h1>
                    <p className="text-xl text-muted-foreground md:text-2xl">
                        The Superfan Commerce OS
                    </p>
                </div>

                <div className="mb-12 rounded-2xl bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 p-8 backdrop-blur-sm">
                    <p className="mb-6 text-lg text-foreground">
                        Connect artists, buyers, and fulfillment hubs in a seamless commerce platform.
                        Manage products, process orders, and track fulfillment with ease.
                    </p>
                    <button
                        onClick={login}
                        disabled={isLoggingIn}
                        className="inline-flex items-center gap-2 rounded-full bg-primary px-8 py-4 text-lg font-semibold text-primary-foreground shadow-lg transition-all hover:bg-primary/90 hover:shadow-xl disabled:opacity-50"
                    >
                        {isLoggingIn ? (
                            <>
                                <Loader2 className="h-5 w-5 animate-spin" />
                                Connecting...
                            </>
                        ) : (
                            'Get Started'
                        )}
                    </button>
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                    <FeatureCard
                        title="For Artists"
                        description="Create and manage your merchandise, track sales, and connect with superfans."
                        icon="🎨"
                    />
                    <FeatureCard
                        title="For Buyers"
                        description="Discover exclusive merchandise, place orders, and track your shipments."
                        icon="🛍️"
                    />
                    <FeatureCard
                        title="For Hubs"
                        description="Manage fulfillment operations, process orders, and update delivery status."
                        icon="📦"
                    />
                </div>
            </div>
        </div>
    );
}

function FeatureCard({ title, description, icon }: { title: string; description: string; icon: string }) {
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-all hover:shadow-md">
            <div className="mb-4 text-4xl">{icon}</div>
            <h3 className="mb-2 text-xl font-semibold text-card-foreground">{title}</h3>
            <p className="text-sm text-muted-foreground">{description}</p>
        </div>
    );
}
