import { Heart } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="border-t border-border bg-card">
            <div className="container mx-auto px-4 py-6">
                <div className="text-center text-sm text-muted-foreground">
                    <p className="flex items-center justify-center gap-1">
                        © 2025. Built with <Heart className="h-4 w-4 fill-destructive text-destructive" /> using{' '}
                        <a
                            href="https://github.com/OsuwoJr"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-primary hover:underline"
                        >
                            OsuwoJr
                        </a>
                    </p>
                </div>
            </div>
        </footer>
    );
}
