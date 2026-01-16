import { useGetInventoryByHub, useUpdateProductHubStock } from '../../../hooks/useQueries';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Loader2, Package, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { InventoryStatus } from '../../../backend';

interface HubInventoryProps {
    hubId: string;
}

export default function HubInventory({ hubId }: HubInventoryProps) {
    const { data: inventory, isLoading } = useGetInventoryByHub(hubId);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-semibold">Inventory Management</h2>

            {inventory && inventory.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No inventory items</p>
                        <p className="text-sm text-muted-foreground">Products will appear here when assigned to your hub</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    {inventory?.map((item) => (
                        <InventoryItemCard key={`${item.productId}-${item.hubId}`} item={item} />
                    ))}
                </div>
            )}
        </div>
    );
}

function InventoryItemCard({ item }: { item: any }) {
    const [newStock, setNewStock] = useState(item.stock.toString());
    const updateStock = useUpdateProductHubStock();

    const handleUpdateStock = async () => {
        const stockValue = parseInt(newStock);
        if (isNaN(stockValue) || stockValue < 0) {
            toast.error('Please enter a valid stock quantity');
            return;
        }

        try {
            await updateStock.mutateAsync({
                productId: item.productId,
                hubId: item.hubId,
                newStock: BigInt(stockValue),
            });
            toast.success('Stock updated successfully');
        } catch (error) {
            toast.error('Failed to update stock');
        }
    };

    const getStatusColor = (status: InventoryStatus) => {
        const colors: Record<InventoryStatus, string> = {
            [InventoryStatus.inStock]: 'text-green-500',
            [InventoryStatus.lowStock]: 'text-yellow-500',
            [InventoryStatus.outOfStock]: 'text-red-500',
            [InventoryStatus.pending]: 'text-blue-500',
        };
        return colors[status] || '';
    };

    const getStatusIcon = (status: InventoryStatus) => {
        if (status === InventoryStatus.lowStock || status === InventoryStatus.outOfStock) {
            return <AlertTriangle className="h-4 w-4" />;
        }
        return <Package className="h-4 w-4" />;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center justify-between">
                    <span>Product: {item.productId.slice(-8)}</span>
                    <div className={`flex items-center gap-2 text-sm ${getStatusColor(item.status)}`}>
                        {getStatusIcon(item.status)}
                        <span className="capitalize">{item.status}</span>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <p className="text-sm text-muted-foreground">Current Stock</p>
                            <p className="text-2xl font-bold">{item.stock}</p>
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Pending Orders</p>
                            <p className="text-2xl font-bold">{item.pending}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <Input
                            type="number"
                            min="0"
                            value={newStock}
                            onChange={(e) => setNewStock(e.target.value)}
                            placeholder="New stock quantity"
                        />
                        <Button onClick={handleUpdateStock} disabled={updateStock.isPending}>
                            {updateStock.isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Updating...
                                </>
                            ) : (
                                'Update Stock'
                            )}
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground">
                        Last updated: {new Date(Number(item.lastUpdated) / 1000000).toLocaleString()}
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
