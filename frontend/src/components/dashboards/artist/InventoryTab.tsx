import { useState } from 'react';
import { UserProfile, InventoryStatus, ProductType } from '../../../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Badge } from '../../ui/badge';
import { Skeleton } from '../../ui/skeleton';
import { Input } from '../../ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../../ui/table';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../../ui/select';
import { Alert, AlertDescription } from '../../ui/alert';
import {
    useGetHubs,
    useGetArtistProducts,
    useGetArtistInventory,
    useAssignProductToHub,
    useRemoveProductFromHub,
    useUpdateProductHubStock,
} from '../../../hooks/useQueries';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import {
    Package,
    AlertTriangle,
    CheckCircle,
    Clock,
    Search,
    Plus,
    Trash2,
} from 'lucide-react';
import { toast } from 'sonner';

interface InventoryTabProps {
    userProfile: UserProfile;
}

export default function InventoryTab({ userProfile }: InventoryTabProps) {
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();

    const [searchTerm, setSearchTerm] = useState('');

    const { data: hubs = [], isLoading: hubsLoading } = useGetHubs();
    const { data: products = [], isLoading: productsLoading } = useGetArtistProducts(artistPrincipal!);
    const { data: inventoryItems = [], isLoading: inventoryLoading } = useGetArtistInventory();

    const assignProductMutation = useAssignProductToHub();
    const removeProductMutation = useRemoveProductFromHub();
    const updateStockMutation = useUpdateProductHubStock();

    const handleAssignHub = async (productId: string, hubId: string) => {
        try {
            await assignProductMutation.mutateAsync({ productId, hubId, initialStock: BigInt(0) });
            toast.success('Product assigned to hub successfully');
        } catch (error: any) {
            toast.error(`Failed to assign product: ${error.message}`);
        }
    };

    const handleRemoveHub = async (productId: string, hubId: string) => {
        try {
            await removeProductMutation.mutateAsync({ productId, hubId });
            toast.success('Product removed from hub successfully');
        } catch (error: any) {
            toast.error(`Failed to remove product: ${error.message}`);
        }
    };

    const handleUpdateStock = async (productId: string, hubId: string, newStock: number) => {
        try {
            await updateStockMutation.mutateAsync({ productId, hubId, newStock: BigInt(newStock) });
            toast.success('Stock updated successfully');
        } catch (error: any) {
            toast.error(`Failed to update stock: ${error.message}`);
        }
    };

    const getStatusIcon = (status: InventoryStatus) => {
        switch (status) {
            case InventoryStatus.inStock:
                return <CheckCircle className="h-4 w-4 text-green-500" />;
            case InventoryStatus.lowStock:
                return <AlertTriangle className="h-4 w-4 text-orange-500" />;
            case InventoryStatus.outOfStock:
                return <AlertTriangle className="h-4 w-4 text-red-500" />;
            case InventoryStatus.pending:
                return <Clock className="h-4 w-4 text-blue-500" />;
            default:
                return <Package className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatDate = (timestamp: number) => {
        return new Date(Number(timestamp) / 1000000).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Filter products to only show physical and phygital types
    const filteredProducts = products.filter(
        (p) =>
            (p.productType === ProductType.physical || p.productType === ProductType.phygital) &&
            (searchTerm === '' || p.name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Create a map of product-hub inventory
    const inventoryMap = new Map<string, typeof inventoryItems[0]>();
    inventoryItems.forEach((item) => {
        const key = `${item.productId}-${item.hubId}`;
        inventoryMap.set(key, item);
    });

    // Build rows: one row per product-hub combination
    const rows: Array<{
        productId: string;
        productName: string;
        hubId: string;
        hubName: string;
        stock: number;
        pending: number;
        status: InventoryStatus;
        lastUpdated: number;
        isAssigned: boolean;
    }> = [];

    filteredProducts.forEach((product) => {
        hubs.forEach((hub) => {
            const key = `${product.id}-${hub.id}`;
            const inventoryItem = inventoryMap.get(key);

            if (inventoryItem) {
                // Product is assigned to this hub
                rows.push({
                    productId: product.id,
                    productName: product.name,
                    hubId: hub.id,
                    hubName: hub.name,
                    stock: inventoryItem.stock,
                    pending: inventoryItem.pending,
                    status: inventoryItem.status,
                    lastUpdated: inventoryItem.lastUpdated,
                    isAssigned: true,
                });
            } else {
                // Product is not assigned to this hub - show as unassigned
                rows.push({
                    productId: product.id,
                    productName: product.name,
                    hubId: hub.id,
                    hubName: hub.name,
                    stock: 0,
                    pending: 0,
                    status: InventoryStatus.outOfStock,
                    lastUpdated: Date.now() * 1000000,
                    isAssigned: false,
                });
            }
        });
    });

    const isLoading = hubsLoading || productsLoading || inventoryLoading;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Inventory Management</h2>
                    <p className="text-sm text-muted-foreground">
                        Manage product availability across fulfillment hubs
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            placeholder="Search products..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9"
                        />
                    </div>
                </div>
            </div>

            {/* Product Inventory Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Product Inventory by Hub</CardTitle>
                    <CardDescription>
                        Assign products to hubs and manage stock levels
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[...Array(5)].map((_, i) => (
                                <Skeleton key={i} className="h-12 w-full" />
                            ))}
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <Alert>
                            <Package className="h-4 w-4" />
                            <AlertDescription>
                                No physical or phygital products found. Create products in the Products tab to manage inventory.
                            </AlertDescription>
                        </Alert>
                    ) : hubs.length === 0 ? (
                        <Alert>
                            <Package className="h-4 w-4" />
                            <AlertDescription>
                                No fulfillment hubs available. Contact admin to set up hubs.
                            </AlertDescription>
                        </Alert>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead>Hub Location</TableHead>
                                        <TableHead className="text-right">Stock</TableHead>
                                        <TableHead className="text-right">Pending</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rows.map((row) => (
                                        <TableRow key={`${row.productId}-${row.hubId}`}>
                                            <TableCell className="font-medium">{row.productName}</TableCell>
                                            <TableCell>{row.hubName}</TableCell>
                                            <TableCell className="text-right">
                                                {row.isAssigned ? row.stock : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {row.isAssigned ? row.pending : '-'}
                                            </TableCell>
                                            <TableCell>
                                                {row.isAssigned ? (
                                                    <div className="flex items-center gap-2">
                                                        {getStatusIcon(row.status)}
                                                        <span className="text-sm capitalize">{row.status}</span>
                                                    </div>
                                                ) : (
                                                    <Badge variant="outline">Not Assigned</Badge>
                                                )}
                                            </TableCell>
                                            <TableCell className="text-sm text-muted-foreground">
                                                {row.isAssigned ? formatDate(row.lastUpdated) : '-'}
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {row.isAssigned ? (
                                                        <>
                                                            <StockUpdateButton
                                                                productId={row.productId}
                                                                hubId={row.hubId}
                                                                currentStock={row.stock}
                                                                onUpdate={handleUpdateStock}
                                                                isUpdating={updateStockMutation.isPending}
                                                            />
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => handleRemoveHub(row.productId, row.hubId)}
                                                                disabled={removeProductMutation.isPending}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleAssignHub(row.productId, row.hubId)}
                                                            disabled={assignProductMutation.isPending}
                                                        >
                                                            <Plus className="mr-1 h-4 w-4" />
                                                            Assign
                                                        </Button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Stock Update Button Component
function StockUpdateButton({
    productId,
    hubId,
    currentStock,
    onUpdate,
    isUpdating,
}: {
    productId: string;
    hubId: string;
    currentStock: number;
    onUpdate: (productId: string, hubId: string, newStock: number) => void;
    isUpdating: boolean;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [newStock, setNewStock] = useState(currentStock.toString());

    const handleSave = () => {
        const stockValue = parseInt(newStock, 10);
        if (isNaN(stockValue) || stockValue < 0) {
            toast.error('Please enter a valid stock number');
            return;
        }
        onUpdate(productId, hubId, stockValue);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setNewStock(currentStock.toString());
        setIsEditing(false);
    };

    if (isEditing) {
        return (
            <div className="flex items-center gap-1">
                <Input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="h-8 w-20"
                    min="0"
                />
                <Button size="sm" variant="default" onClick={handleSave} disabled={isUpdating}>
                    Save
                </Button>
                <Button size="sm" variant="ghost" onClick={handleCancel} disabled={isUpdating}>
                    Cancel
                </Button>
            </div>
        );
    }

    return (
        <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            Update Stock
        </Button>
    );
}
