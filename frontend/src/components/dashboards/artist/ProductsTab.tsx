import { useState } from 'react';
import { UserProfile, Product, ExternalBlob, ProductType, Blockchain, Certificate } from '../../../backend';
import { useGetArtistProducts, useAddProduct, useUpdateProduct, useDeleteProduct, ConvertedProduct, useMintCertificate } from '../../../hooks/useQueries';
import { Button } from '../../ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../ui/card';
import { Plus, Loader2, Edit, Trash2, Package, Upload, X, ChevronRight, ChevronLeft, Shield, QrCode } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../ui/dialog';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Switch } from '../../ui/switch';
import { Badge } from '../../ui/badge';
import { toast } from 'sonner';
import { useInternetIdentity } from '../../../hooks/useInternetIdentity';
import { getImageUrl } from '../../../lib/utils';

interface ProductsTabProps {
    userProfile: UserProfile;
    onNavigateToInventory?: () => void;
}

export default function ProductsTab({ userProfile, onNavigateToInventory }: ProductsTabProps) {
    const { identity } = useInternetIdentity();
    const artistPrincipal = identity?.getPrincipal();
    const { data: products, isLoading, error } = useGetArtistProducts(artistPrincipal!);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ConvertedProduct | null>(null);

    const handleAddSuccess = () => {
        setIsDialogOpen(false);
        toast.success('Product added successfully!');
        // Navigate to inventory tab after successful product creation
        if (onNavigateToInventory) {
            setTimeout(() => {
                onNavigateToInventory();
            }, 500);
        }
    };

    const handleEditSuccess = () => {
        setIsDialogOpen(false);
        setEditingProduct(null);
        toast.success('Product updated successfully!');
    };

    if (error) {
        return (
            <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <Package className="mb-4 h-12 w-12 text-destructive" />
                    <p className="mb-2 text-lg font-medium text-destructive">Error loading products</p>
                    <p className="mb-4 text-sm text-muted-foreground">
                        {error instanceof Error ? error.message : 'An unexpected error occurred'}
                    </p>
                    <Button onClick={() => window.location.reload()}>Retry</Button>
                </CardContent>
            </Card>
        );
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-semibold">Your Products</h2>
                    <p className="text-sm text-muted-foreground">Manage your merchandise catalog</p>
                </div>
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Add New Product</DialogTitle>
                            <DialogDescription>Create a new product for your fans</DialogDescription>
                        </DialogHeader>
                        <ProductForm onSuccess={handleAddSuccess} artistPrincipal={artistPrincipal!} />
                    </DialogContent>
                </Dialog>
            </div>

            {products && products.length === 0 ? (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center py-12">
                        <Package className="mb-4 h-12 w-12 text-muted-foreground" />
                        <p className="mb-2 text-lg font-medium">No products yet</p>
                        <p className="mb-4 text-sm text-muted-foreground">Start by adding your first product</p>
                        <Button onClick={() => setIsDialogOpen(true)}>
                            <Plus className="mr-2 h-4 w-4" />
                            Add Product
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {products?.map((product) => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={() => {
                                setEditingProduct(product);
                                setIsDialogOpen(true);
                            }}
                        />
                    ))}
                </div>
            )}

            {editingProduct && (
                <Dialog open={isDialogOpen} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setEditingProduct(null);
                }}>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>Edit Product</DialogTitle>
                            <DialogDescription>Update your product details</DialogDescription>
                        </DialogHeader>
                        <ProductForm
                            onSuccess={handleEditSuccess}
                            artistPrincipal={artistPrincipal!}
                            existingProduct={editingProduct}
                        />
                    </DialogContent>
                </Dialog>
            )}
        </div>
    );
}

function ProductCard({ product, onEdit }: { product: ConvertedProduct; onEdit: () => void }) {
    const deleteProduct = useDeleteProduct();

    const handleDelete = async () => {
        if (confirm('Are you sure you want to delete this product?')) {
            try {
                await deleteProduct.mutateAsync(product.id);
                toast.success('Product deleted successfully');
            } catch (error) {
                toast.error('Failed to delete product');
            }
        }
    };

    const getProductTypeLabel = (type: ProductType) => {
        switch (type) {
            case ProductType.physical: return 'Physical';
            case ProductType.nft: return 'NFT';
            case ProductType.phygital: return 'Phygital';
            default: return 'Unknown';
        }
    };

    // Safely get image URL with error handling
    const imageUrl = product.images && product.images.length > 0 
        ? getImageUrl(product.images[0])
        : null;

    return (
        <Card className="overflow-hidden">
            <div className="aspect-square bg-muted relative">
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
                <div className="absolute top-2 right-2 flex gap-2">
                    <Badge variant="secondary" className="text-xs">
                        {getProductTypeLabel(product.productType)}
                    </Badge>
                    {product.mintCertificate && (
                        <Badge variant="outline" className="text-xs bg-background/80 backdrop-blur">
                            <Shield className="h-3 w-3 mr-1" />
                            Certified
                        </Badge>
                    )}
                </div>
            </div>
            <CardHeader>
                <CardTitle className="line-clamp-1">{product.name}</CardTitle>
                <CardDescription className="line-clamp-2">{product.description}</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    <div>
                        <p className="text-2xl font-bold text-primary">${product.price / 100}</p>
                        {product.productType !== ProductType.nft && (
                            <p className="text-sm text-muted-foreground">Stock: {product.inventory}</p>
                        )}
                        {product.productType === ProductType.nft && product.supply && (
                            <p className="text-sm text-muted-foreground">Supply: {product.supply}</p>
                        )}
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={onEdit}>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        onClick={handleDelete}
                        disabled={deleteProduct.isPending}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

function ProductForm({
    onSuccess,
    artistPrincipal,
    existingProduct,
}: {
    onSuccess: () => void;
    artistPrincipal: any;
    existingProduct?: ConvertedProduct;
}) {
    const [step, setStep] = useState(1);
    
    // Step 1: Basic Info
    const [name, setName] = useState(existingProduct?.name || '');
    const [description, setDescription] = useState(existingProduct?.description || '');
    const [productType, setProductType] = useState<ProductType>(existingProduct?.productType || ProductType.physical);
    const [priceUSD, setPriceUSD] = useState(existingProduct ? String(existingProduct.price / 100) : '');
    const [inventory, setInventory] = useState(existingProduct ? String(existingProduct.inventory) : '');

    // Step 2: Type-specific fields
    // Physical Merch
    const [imageFiles, setImageFiles] = useState<File[]>([]);
    const [imagePreviews, setImagePreviews] = useState<string[]>(
        existingProduct?.images && existingProduct.images.length > 0 
            ? existingProduct.images.map(img => getImageUrl(img)).filter((url): url is string => url !== null)
            : []
    );
    const [sku, setSku] = useState(existingProduct?.sku || '');
    const [shippingDetails, setShippingDetails] = useState(existingProduct?.shippingDetails || '');
    const [mintCertificate, setMintCertificate] = useState(existingProduct?.mintCertificate || false);
    
    // NFT
    const [nftFile, setNftFile] = useState<File | null>(null);
    const [nftPreview, setNftPreview] = useState<string | null>(null);
    const [blockchain, setBlockchain] = useState<Blockchain>(existingProduct?.blockchain || Blockchain.icp);
    const [royaltyPercentage, setRoyaltyPercentage] = useState(existingProduct?.royaltyPercentage ? String(existingProduct.royaltyPercentage) : '10');
    const [unlockableContent, setUnlockableContent] = useState(existingProduct?.unlockableContent || '');
    const [supply, setSupply] = useState(existingProduct?.supply ? String(existingProduct.supply) : '1');
    
    // Phygital
    const [attachNfcQrTag, setAttachNfcQrTag] = useState(existingProduct?.attachNfcQrTag || false);
    
    const [uploadProgress, setUploadProgress] = useState<number>(0);

    const addProduct = useAddProduct();
    const updateProduct = useUpdateProduct();
    const mintCertificateMutation = useMintCertificate();

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length === 0) return;

        // Validate file types
        const invalidFiles = files.filter(file => !file.type.startsWith('image/'));
        if (invalidFiles.length > 0) {
            toast.error('Please select only image files');
            return;
        }

        // Validate file sizes (max 5MB each)
        const oversizedFiles = files.filter(file => file.size > 5 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
            toast.error('Each image must be less than 5MB');
            return;
        }

        setImageFiles(prev => [...prev, ...files]);

        // Create previews
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreviews(prev => [...prev, reader.result as string]);
            };
            reader.readAsDataURL(file);
        });
    };

    const handleNftFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file size (max 50MB for NFT files)
        if (file.size > 50 * 1024 * 1024) {
            toast.error('NFT file must be less than 50MB');
            return;
        }

        setNftFile(file);

        // Create preview for images/videos
        if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setNftPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setNftPreview(null);
        }
    };

    const removeImage = (index: number) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const removeNftFile = () => {
        setNftFile(null);
        setNftPreview(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            let images: ExternalBlob[] = [];

            // Handle image uploads based on product type
            if (productType === ProductType.physical || productType === ProductType.phygital) {
                if (imageFiles.length > 0) {
                    // Upload new images
                    for (const file of imageFiles) {
                        const arrayBuffer = await file.arrayBuffer();
                        const uint8Array = new Uint8Array(arrayBuffer);
                        const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
                            setUploadProgress(percentage);
                        });
                        images.push(blob);
                    }
                } else if (existingProduct?.images) {
                    // Keep existing images
                    images = existingProduct.images as ExternalBlob[];
                }
            }

            // Handle NFT file upload
            if (productType === ProductType.nft || productType === ProductType.phygital) {
                if (nftFile) {
                    const arrayBuffer = await nftFile.arrayBuffer();
                    const uint8Array = new Uint8Array(arrayBuffer);
                    const blob = ExternalBlob.fromBytes(uint8Array).withUploadProgress((percentage) => {
                        setUploadProgress(percentage);
                    });
                    images.push(blob);
                } else if (existingProduct?.images && productType === ProductType.nft) {
                    images = existingProduct.images as ExternalBlob[];
                }
            }

            // Generate product ID first to avoid circular reference
            const productId = existingProduct?.id || `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

            const productData: Product = {
                id: productId,
                artist: artistPrincipal,
                name,
                description,
                price: BigInt(Math.round(parseFloat(priceUSD) * 100)),
                inventory: productType === ProductType.nft ? BigInt(0) : BigInt(parseInt(inventory) || 0),
                images,
                productType,
                blockchain: (productType === ProductType.nft || productType === ProductType.phygital) ? blockchain : undefined,
                royaltyPercentage: (productType === ProductType.nft || productType === ProductType.phygital) ? BigInt(parseInt(royaltyPercentage) || 0) : undefined,
                unlockableContent: (productType === ProductType.nft || productType === ProductType.phygital) && unlockableContent ? unlockableContent : undefined,
                supply: productType === ProductType.nft ? BigInt(parseInt(supply) || 1) : undefined,
                sku: (productType === ProductType.physical || productType === ProductType.phygital) && sku ? sku : undefined,
                shippingDetails: (productType === ProductType.physical || productType === ProductType.phygital) && shippingDetails ? shippingDetails : undefined,
                mintCertificate,
                attachNfcQrTag: productType === ProductType.phygital ? attachNfcQrTag : false,
                authenticityLink: mintCertificate ? `${window.location.origin}/verify/${productId}` : undefined,
            };

            if (existingProduct) {
                await updateProduct.mutateAsync(productData);
            } else {
                await addProduct.mutateAsync(productData);
            }

            // Mint certificate if enabled
            if (mintCertificate && !existingProduct) {
                try {
                    const certificate: Certificate = {
                        id: `cert-${productId}-${Date.now()}`,
                        productId: productId,
                        artistId: artistPrincipal,
                        metadataHash: `hash-${Date.now()}`, // In production, this would be a real hash
                        timestamp: BigInt(Date.now() * 1000000), // Convert to nanoseconds
                        version: BigInt(1),
                        blockchain: blockchain || Blockchain.icp,
                        authenticityLink: `${window.location.origin}/verify/${productId}`,
                    };
                    await mintCertificateMutation.mutateAsync(certificate);
                    toast.success('Certificate minted successfully!');
                } catch (certError) {
                    console.error('Certificate minting error:', certError);
                    toast.warning('Product created but certificate minting failed');
                }
            }

            onSuccess();
        } catch (error) {
            console.error('Product submission error:', error);
            toast.error(`Failed to ${existingProduct ? 'update' : 'add'} product`);
        }
    };

    const isPending = addProduct.isPending || updateProduct.isPending || mintCertificateMutation.isPending;

    const canProceedToStep2 = name && description && priceUSD && (productType === ProductType.nft || inventory);

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 pb-4 border-b">
                <div className={`flex items-center gap-2 ${step === 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 1 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        1
                    </div>
                    <span className="text-sm font-medium">Basic Info</span>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 ${step === 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${step === 2 ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                        2
                    </div>
                    <span className="text-sm font-medium">Details</span>
                </div>
            </div>

            {/* Step 1: Basic Information */}
            {step === 1 && (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Product Name *</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Limited Edition T-Shirt"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Describe your product..."
                            rows={4}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="productType">Product Type *</Label>
                        <Select value={productType} onValueChange={(value) => setProductType(value as ProductType)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select product type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value={ProductType.physical}>Physical Merch</SelectItem>
                                <SelectItem value={ProductType.nft}>NFT</SelectItem>
                                <SelectItem value={ProductType.phygital}>Phygital (Both)</SelectItem>
                            </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground">
                            {productType === ProductType.physical && 'Physical merchandise shipped to customers'}
                            {productType === ProductType.nft && 'Digital collectible on the blockchain'}
                            {productType === ProductType.phygital && 'Physical item with digital NFT certificate'}
                        </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="price">Price (USD) *</Label>
                            <Input
                                id="price"
                                type="number"
                                step="0.01"
                                min="0"
                                value={priceUSD}
                                onChange={(e) => setPriceUSD(e.target.value)}
                                placeholder="29.99"
                                required
                            />
                        </div>

                        {productType !== ProductType.nft && (
                            <div className="space-y-2">
                                <Label htmlFor="inventory">Inventory *</Label>
                                <Input
                                    id="inventory"
                                    type="number"
                                    min="0"
                                    value={inventory}
                                    onChange={(e) => setInventory(e.target.value)}
                                    placeholder="100"
                                    required
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="button" onClick={() => setStep(2)} disabled={!canProceedToStep2}>
                            Next
                            <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}

            {/* Step 2: Type-specific Details */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* Physical Merch Fields */}
                    {(productType === ProductType.physical || productType === ProductType.phygital) && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="images">Product Images</Label>
                                {imagePreviews.length > 0 ? (
                                    <div className="grid grid-cols-2 gap-4">
                                        {imagePreviews.map((preview, index) => (
                                            <div key={index} className="relative">
                                                <div className="aspect-square w-full overflow-hidden rounded-lg border bg-muted">
                                                    <img
                                                        src={preview}
                                                        alt={`Product preview ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                </div>
                                                <Button
                                                    type="button"
                                                    variant="destructive"
                                                    size="icon"
                                                    className="absolute right-2 top-2 h-8 w-8"
                                                    onClick={() => removeImage(index)}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        ))}
                                        <label
                                            htmlFor="images"
                                            className="aspect-square flex flex-col items-center justify-center border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                        >
                                            <Plus className="h-8 w-8 text-muted-foreground" />
                                            <span className="text-xs text-muted-foreground mt-2">Add More</span>
                                            <Input
                                                id="images"
                                                type="file"
                                                accept="image/*"
                                                multiple
                                                className="hidden"
                                                onChange={handleImageChange}
                                            />
                                        </label>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="images"
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click to upload</span> or drag and drop
                                        </p>
                                        <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB each</p>
                                        <Input
                                            id="images"
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            className="hidden"
                                            onChange={handleImageChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="sku">SKU / Edition ID</Label>
                                    <Input
                                        id="sku"
                                        value={sku}
                                        onChange={(e) => setSku(e.target.value)}
                                        placeholder="e.g., TSH-001-XL"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="shippingDetails">Shipping Details</Label>
                                    <Input
                                        id="shippingDetails"
                                        value={shippingDetails}
                                        onChange={(e) => setShippingDetails(e.target.value)}
                                        placeholder="e.g., Weight: 200g, Ships from: LA"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-4 border rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="mintCertificate" className="text-base flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Mint NFT Certificate of Authenticity
                                    </Label>
                                    <p className="text-sm text-muted-foreground">
                                        Create a blockchain certificate for this product
                                    </p>
                                </div>
                                <Switch
                                    id="mintCertificate"
                                    checked={mintCertificate}
                                    onCheckedChange={setMintCertificate}
                                />
                            </div>
                        </>
                    )}

                    {/* NFT Fields */}
                    {(productType === ProductType.nft || productType === ProductType.phygital) && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="nftFile">NFT File (Image, Video, Audio, 3D)</Label>
                                {nftPreview ? (
                                    <div className="relative">
                                        <div className="aspect-video w-full overflow-hidden rounded-lg border bg-muted">
                                            {nftFile?.type.startsWith('video/') ? (
                                                <video src={nftPreview} controls className="h-full w-full object-cover" />
                                            ) : (
                                                <img
                                                    src={nftPreview}
                                                    alt="NFT preview"
                                                    className="h-full w-full object-cover"
                                                />
                                            )}
                                        </div>
                                        <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute right-2 top-2"
                                            onClick={removeNftFile}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                ) : (
                                    <label
                                        htmlFor="nftFile"
                                        className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer bg-muted/50 hover:bg-muted transition-colors"
                                    >
                                        <Upload className="w-10 h-10 mb-3 text-muted-foreground" />
                                        <p className="mb-2 text-sm text-muted-foreground">
                                            <span className="font-semibold">Click to upload</span> NFT file
                                        </p>
                                        <p className="text-xs text-muted-foreground">Image, Video, Audio, or 3D file up to 50MB</p>
                                        <Input
                                            id="nftFile"
                                            type="file"
                                            accept="image/*,video/*,audio/*,.glb,.gltf"
                                            className="hidden"
                                            onChange={handleNftFileChange}
                                        />
                                    </label>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="blockchain">Blockchain</Label>
                                <Select value={blockchain} onValueChange={(value) => setBlockchain(value as Blockchain)}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select blockchain" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={Blockchain.icp}>Internet Computer (ICP)</SelectItem>
                                        <SelectItem value={Blockchain.ethereum}>Ethereum</SelectItem>
                                        <SelectItem value={Blockchain.solana}>Solana</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="royalty">Royalty Percentage</Label>
                                    <Input
                                        id="royalty"
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={royaltyPercentage}
                                        onChange={(e) => setRoyaltyPercentage(e.target.value)}
                                        placeholder="10"
                                    />
                                    <p className="text-xs text-muted-foreground">Percentage you earn on secondary sales</p>
                                </div>

                                {productType === ProductType.nft && (
                                    <div className="space-y-2">
                                        <Label htmlFor="supply">Supply</Label>
                                        <Input
                                            id="supply"
                                            type="number"
                                            min="1"
                                            value={supply}
                                            onChange={(e) => setSupply(e.target.value)}
                                            placeholder="1"
                                        />
                                        <p className="text-xs text-muted-foreground">1 for 1-of-1, or limited edition count</p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unlockable">Unlockable Content (Optional)</Label>
                                <Textarea
                                    id="unlockable"
                                    value={unlockableContent}
                                    onChange={(e) => setUnlockableContent(e.target.value)}
                                    placeholder="e.g., Access code, download link, exclusive message..."
                                    rows={3}
                                />
                                <p className="text-xs text-muted-foreground">Content only visible to the NFT owner</p>
                            </div>
                        </>
                    )}

                    {/* Phygital-specific Fields */}
                    {productType === ProductType.phygital && (
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div className="space-y-0.5">
                                <Label htmlFor="attachNfcQrTag" className="text-base flex items-center gap-2">
                                    <QrCode className="h-4 w-4" />
                                    Attach NFC/QR Tag
                                </Label>
                                <p className="text-sm text-muted-foreground">
                                    Generate unique QR/NFC tag linking to blockchain certificate
                                </p>
                            </div>
                            <Switch
                                id="attachNfcQrTag"
                                checked={attachNfcQrTag}
                                onCheckedChange={setAttachNfcQrTag}
                            />
                        </div>
                    )}

                    {/* Authenticity Features */}
                    {productType !== ProductType.nft && (
                        <div className="p-4 border rounded-lg bg-muted/50 space-y-3">
                            <div className="flex items-center gap-2">
                                <Shield className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">Authenticity Features</h3>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {mintCertificate 
                                    ? 'A blockchain certificate will be minted for this product, providing verifiable proof of authenticity.'
                                    : 'Enable certificate minting to provide blockchain-verified authenticity for your product.'}
                            </p>
                            {mintCertificate && (
                                <div className="text-xs text-muted-foreground space-y-1">
                                    <p>✓ Unique certificate NFT on {blockchain === Blockchain.icp ? 'Internet Computer' : blockchain === Blockchain.ethereum ? 'Ethereum' : 'Solana'}</p>
                                    <p>✓ Public verification link for buyers</p>
                                    <p>✓ Immutable proof of authenticity</p>
                                </div>
                            )}
                        </div>
                    )}

                    {uploadProgress > 0 && uploadProgress < 100 && (
                        <div className="space-y-2">
                            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-primary transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground text-center">
                                Uploading: {uploadProgress}%
                            </p>
                        </div>
                    )}

                    <div className="flex justify-between pt-4">
                        <Button type="button" variant="outline" onClick={() => setStep(1)}>
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Back
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    {existingProduct ? 'Updating...' : 'Creating...'}
                                </>
                            ) : existingProduct ? (
                                'Update Product'
                            ) : (
                                'Create Product'
                            )}
                        </Button>
                    </div>
                </div>
            )}
        </form>
    );
}
