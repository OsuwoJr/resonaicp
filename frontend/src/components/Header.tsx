import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useGetCallerUserProfile } from '../hooks/useQueries';
import { Button } from './ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { Loader2, LogOut, User } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Avatar, AvatarFallback } from './ui/avatar';
import { AppRole } from '../backend';

export default function Header() {
    const { identity, clear, isLoggingIn } = useInternetIdentity();
    const { data: userProfile } = useGetCallerUserProfile();
    const queryClient = useQueryClient();

    const isAuthenticated = !!identity;

    const handleLogout = async () => {
        await clear();
        queryClient.clear();
    };

    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2);
    };

    const getRoleBadge = (role: AppRole) => {
        const badges: Record<string, string> = {
            artist: '🎨',
            buyer: '🛍️',
            hub: '📦',
            admin: '👑',
        };
        return badges[role._tag] || '';
    };

    const getRoleLabel = (role: AppRole) => {
        const labels: Record<string, string> = {
            artist: 'ARTIST',
            buyer: 'BUYER',
            hub: 'HUB',
            admin: 'ADMIN',
        };
        return labels[role._tag] || '';
    };

    return (
        <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto flex h-16 items-center justify-between px-4">
                <div className="flex items-center gap-2">
                    <div className="text-2xl font-bold">
                        <span className="text-primary">Resona</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {isAuthenticated && userProfile ? (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="relative h-10 gap-2 rounded-full px-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarFallback className="bg-primary text-primary-foreground">
                                            {getInitials(userProfile.name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="hidden font-medium md:inline-block">{userProfile.name}</span>
                                    <span className="text-lg">{getRoleBadge(userProfile.appRole)}</span>
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-56">
                                <DropdownMenuLabel>
                                    <div className="flex flex-col space-y-1">
                                        <p className="text-sm font-medium">{userProfile.name}</p>
                                        <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                                        <p className="text-xs font-medium text-primary">
                                            {getRoleLabel(userProfile.appRole)}
                                        </p>
                                    </div>
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive">
                                    <LogOut className="mr-2 h-4 w-4" />
                                    Logout
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    ) : (
                        <Button disabled={isLoggingIn} variant="ghost" size="sm">
                            {isLoggingIn ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <User className="mr-2 h-4 w-4" />
                                    Account
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        </header>
    );
}
