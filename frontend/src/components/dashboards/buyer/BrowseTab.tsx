import { useState } from 'react';
import { UserProfile, OrderStatus } from '../../../backend';
import { useGetProducts, usePlaceOrder, ConvertedProduct } from '../../../hooks/useQueries';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Loader2, Package, ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { getImageUrl } from '../../../lib/utils';

interface BrowseTabProps {
    userProfile: UserProfile;
}

export default function BrowseTab({ userProfile }: BrowseTabProps) {
    const { data: products, isLoading } = useGetProducts();
    const [searchTerm, setSearchTerm] = useState('');

    const filteredProducts = products?.filter((p) =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

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
                <h2 className="text-2xl font-semibold">Browse Products</h2>
                <p className="text-sm text-muted-foreground">Discover exclusive merchandise from your favorite artists</p>
            </div>

            <div className="flex gap-4">
                <Input
                    placeholder="Search products..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {filteredProducts && filteredProducts.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No products found</p>
                        <p className="text-sm text-muted-foreground">Check back later for new merchandise</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredProducts?.map((product) => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}

function ProductCard({ product }: { product: ConvertedProduct }) {
    const { identity } = useInternetIdentity();
    const placeOrder = usePlaceOrder();
    const [quantity, setQuantity] = useState(1);

    const handlePurchase = async () => {
        if (!identity) {
            toast.error('Please log in to purchase');
            return;
        }

        if (quantity > product.inventory) {
            toast.error('Not enough inventory');
            return;
        }

        try {
            await placeOrder.mutateAsync({
                id: `order-${Date.now()}`,
                buyer: identity.getPrincipal(),
                productId: product.id,
                quantity: BigInt(quantity),
                status: OrderStatus.pending,
                assignedHub: undefined,
                createdAt: BigInt(Date.now() * 1000000),
                updatedAt: BigInt(Date.now() * 1000000),
            });
            toast.success('Order placed successfully!');
            setQuantity(1);
        } catch (error) {
            toast.error('Failed to place order');
        }
    };

    // Safely get image URL with error handling
    const imageUrl = product.images && product.images.length > 0 
        ? getImageUrl(product.images[0])
        : null;

    return (
        <Card className="overflow-hidden">
            <div className="aspect-square bg-muted">
                {imageUrl ? (
                    <img
                        src={imageUrl}
                        alt={product.name}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                            console.error('Image failed to load:', imageUrl);
                            e.currentTarget.style.display = 'none';
                        }}
                    />
                ) : (
                    <div className="flex h-full items-center justify-center">
                        <Package className="h-12 w-12 text-muted-foreground" />
                    </div>
                )}
            </div>
            <CardHeader>
                <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4">
                    <p className="text-2xl font-bold text-primary">${product.price / 100}</p>
                    <p className="text-sm text-muted-foreground">
                        {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Input
                        type="number"
                        min="1"
                        max={product.inventory}
                        value={quantity}
                        onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                        className="w-20"
                        disabled={product.inventory === 0}
                    />
                    <Button
                        className="flex-1"
                        onClick={handlePurchase}
                        disabled={placeOrder.isPending || product.inventory === 0}
                    >
                        {placeOrder.isPending ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Ordering...
                            </>
                        ) : (
                            <>
                                <ShoppingCart className="mr-2 h-4 w-4" />
                                Buy Now
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
