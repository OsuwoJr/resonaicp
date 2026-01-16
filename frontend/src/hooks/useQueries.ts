import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import {
    UserProfile,
    Product,
    Order,
    Hub,
    Payment,
    StripeConfiguration,
    OrderStatus,
    ArtistDashboardSummary,
    OrderSummary,
    OrderFilter,
    InventoryItem,
    InventorySummary,
    HubActivity,
    LowStockAlert,
    Tour,
    TourSummary,
    TourStatus,
    Certificate,
} from '../backend';
import { Principal } from '@icp-sdk/core/principal';
import { convertBigIntsToNumbers, sanitizeOrderFilter, ConvertBigIntToNumber } from '../lib/utils';

// Type aliases for converted types
export type ConvertedProduct = ConvertBigIntToNumber<Product>;
export type ConvertedOrder = ConvertBigIntToNumber<Order>;
export type ConvertedHub = ConvertBigIntToNumber<Hub>;
export type ConvertedPayment = ConvertBigIntToNumber<Payment>;
export type ConvertedOrderSummary = ConvertBigIntToNumber<OrderSummary>;
export type ConvertedArtistDashboardSummary = ConvertBigIntToNumber<ArtistDashboardSummary>;
export type ConvertedInventoryItem = ConvertBigIntToNumber<InventoryItem>;
export type ConvertedInventorySummary = ConvertBigIntToNumber<InventorySummary>;
export type ConvertedHubActivity = ConvertBigIntToNumber<HubActivity>;
export type ConvertedLowStockAlert = ConvertBigIntToNumber<LowStockAlert>;
export type ConvertedTour = ConvertBigIntToNumber<Tour>;
export type ConvertedTourSummary = ConvertBigIntToNumber<TourSummary>;
export type ConvertedCertificate = ConvertBigIntToNumber<Certificate>;

// User Profile Queries
export function useGetCallerUserProfile() {
    const { actor, isFetching: actorFetching } = useActor();

    const query = useQuery<UserProfile | null>({
        queryKey: ['currentUserProfile'],
        queryFn: async () => {
            if (!actor) throw new Error('Actor not available');
            const result = await actor.getCallerUserProfile();
            return convertBigIntsToNumbers(result);
        },
        enabled: !!actor && !actorFetching,
        retry: false,
    });

    return {
        ...query,
        isLoading: actorFetching || query.isLoading,
        isFetched: !!actor && query.isFetched,
    };
}

export function useSaveCallerUserProfile() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (profile: UserProfile) => {
            if (!actor) throw new Error('Actor not available');
            await actor.saveCallerUserProfile(profile);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
        },
    });
}

// Product Queries
export function useGetProducts() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedProduct[]>({
        queryKey: ['products'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getProducts();
            return convertBigIntsToNumbers(result) as unknown as ConvertedProduct[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetArtistProducts(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedProduct[]>({
        queryKey: ['artistProducts', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getArtistProducts(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedProduct[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useAddProduct() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Product) => {
            if (!actor) throw new Error('Actor not available');
            await actor.addProduct(product);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['artistProducts'] });
            queryClient.invalidateQueries({ queryKey: ['artistDashboardSummary'] });
        },
    });
}

export function useUpdateProduct() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (product: Product) => {
            if (!actor) throw new Error('Actor not available');
            await actor.updateProduct(product);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['artistProducts'] });
            queryClient.invalidateQueries({ queryKey: ['artistDashboardSummary'] });
        },
    });
}

export function useDeleteProduct() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (productId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.deleteProduct(productId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['products'] });
            queryClient.invalidateQueries({ queryKey: ['artistProducts'] });
            queryClient.invalidateQueries({ queryKey: ['artistDashboardSummary'] });
        },
    });
}

// Certificate Queries
export function useMintCertificate() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (certificate: Certificate) => {
            if (!actor) throw new Error('Actor not available');
            await actor.mintCertificate(certificate);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['certificates'] });
        },
    });
}

export function useVerifyProduct(productId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<{ product?: ConvertedProduct; certificate?: ConvertedCertificate }>({
        queryKey: ['verifyProduct', productId],
        queryFn: async () => {
            if (!actor || !productId) return {};
            const result = await actor.verifyProduct(productId);
            return convertBigIntsToNumbers(result) as unknown as { product?: ConvertedProduct; certificate?: ConvertedCertificate };
        },
        enabled: !!actor && !isFetching && !!productId,
    });
}

// Order Queries
export function useGetOrders() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrder[]>({
        queryKey: ['orders'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getOrders();
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetBuyerOrders() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrder[]>({
        queryKey: ['buyerOrders'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getBuyerOrders();
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetArtistOrders(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrder[]>({
        queryKey: ['artistOrders', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getArtistOrders(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useGetArtistOrderSummary(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrderSummary>({
        queryKey: ['artistOrderSummary', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) throw new Error('Actor or artist principal not available');
            const result = await actor.getArtistOrderSummary(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrderSummary;
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useGetFilteredArtistOrders(artistPrincipal: Principal, filter: OrderFilter) {
    const { actor, isFetching } = useActor();
    
    // Sanitize filter for query key to avoid BigInt serialization issues
    const sanitizedFilter = sanitizeOrderFilter(filter);

    return useQuery<ConvertedOrder[]>({
        queryKey: ['filteredArtistOrders', artistPrincipal?.toString(), sanitizedFilter],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getFilteredArtistOrders(artistPrincipal, filter);
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useGetOrderDetails(orderId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrder | null>({
        queryKey: ['orderDetails', orderId],
        queryFn: async () => {
            if (!actor) return null;
            const result = await actor.getOrderDetails(orderId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder | null;
        },
        enabled: !!actor && !isFetching && !!orderId,
    });
}

export function useGetHubOrders(hubId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedOrder[]>({
        queryKey: ['hubOrders', hubId],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getHubOrders(hubId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedOrder[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function usePlaceOrder() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (order: Order) => {
            if (!actor) throw new Error('Actor not available');
            await actor.placeOrder(order);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['buyerOrders'] });
            queryClient.invalidateQueries({ queryKey: ['artistOrders'] });
            queryClient.invalidateQueries({ queryKey: ['artistOrderSummary'] });
            queryClient.invalidateQueries({ queryKey: ['filteredArtistOrders'] });
            queryClient.invalidateQueries({ queryKey: ['artistDashboardSummary'] });
        },
    });
}

export function useUpdateOrderStatus() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.updateOrderStatus(orderId, status);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['buyerOrders'] });
            queryClient.invalidateQueries({ queryKey: ['artistOrders'] });
            queryClient.invalidateQueries({ queryKey: ['artistOrderSummary'] });
            queryClient.invalidateQueries({ queryKey: ['filteredArtistOrders'] });
            queryClient.invalidateQueries({ queryKey: ['hubOrders'] });
            queryClient.invalidateQueries({ queryKey: ['orderDetails'] });
            queryClient.invalidateQueries({ queryKey: ['artistDashboardSummary'] });
        },
    });
}

// Hub Queries
export function useGetHubs() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedHub[]>({
        queryKey: ['hubs'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getHubs();
            return convertBigIntsToNumbers(result) as unknown as ConvertedHub[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetAllHubs() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedHub[]>({
        queryKey: ['allHubs'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getAllHubs();
            return convertBigIntsToNumbers(result) as unknown as ConvertedHub[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetCallerHub() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedHub | null>({
        queryKey: ['callerHub'],
        queryFn: async () => {
            if (!actor) return null;
            const result = await actor.getCallerHub();
            return convertBigIntsToNumbers(result) as unknown as ConvertedHub | null;
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetCallerHubs() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedHub[]>({
        queryKey: ['callerHubs'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getCallerHubs();
            return convertBigIntsToNumbers(result) as unknown as ConvertedHub[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useApplyForHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubApplication: {
            id: string;
            name: string;
            location: [number, number];
            capacity: bigint;
            businessInfo: string;
            contactInfo: string;
            services: string;
        }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.applyForHub(hubApplication);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
            queryClient.invalidateQueries({ queryKey: ['callerHub'] });
            queryClient.invalidateQueries({ queryKey: ['callerHubs'] });
        },
    });
}

export function useSubmitHubForApproval() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.submitHubForApproval(hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
            queryClient.invalidateQueries({ queryKey: ['callerHub'] });
            queryClient.invalidateQueries({ queryKey: ['callerHubs'] });
        },
    });
}

export function useUpdateHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hub: Hub) => {
            if (!actor) throw new Error('Actor not available');
            await actor.updateHub(hub);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
            queryClient.invalidateQueries({ queryKey: ['callerHub'] });
            queryClient.invalidateQueries({ queryKey: ['callerHubs'] });
        },
    });
}

export function useApproveHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.approveHub(hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
        },
    });
}

export function useRejectHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.rejectHub(hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
        },
    });
}

export function useSuspendHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.suspendHub(hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
        },
    });
}

export function useDeleteHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (hubId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.deleteHub(hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['hubs'] });
            queryClient.invalidateQueries({ queryKey: ['allHubs'] });
        },
    });
}

// Payment Queries
export function useGetPayments() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedPayment[]>({
        queryKey: ['payments'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getPayments();
            return convertBigIntsToNumbers(result) as unknown as ConvertedPayment[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetArtistPayments(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedPayment[]>({
        queryKey: ['artistPayments', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getArtistPayments(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedPayment[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

// Artist Dashboard Summary Query
export function useGetArtistDashboardSummary(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedArtistDashboardSummary>({
        queryKey: ['artistDashboardSummary', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) throw new Error('Actor or artist principal not available');
            const result = await actor.getArtistDashboardSummary(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedArtistDashboardSummary;
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

// Inventory Queries
export function useGetInventoryByHub(hubId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedInventoryItem[]>({
        queryKey: ['inventoryByHub', hubId],
        queryFn: async () => {
            if (!actor || !hubId) return [];
            const result = await actor.getInventoryByHub(hubId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedInventoryItem[];
        },
        enabled: !!actor && !isFetching && !!hubId,
    });
}

export function useGetProductInventoryByHub(productId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedInventoryItem[]>({
        queryKey: ['productInventoryByHub', productId],
        queryFn: async () => {
            if (!actor || !productId) return [];
            const result = await actor.getProductInventoryByHub(productId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedInventoryItem[];
        },
        enabled: !!actor && !isFetching && !!productId,
    });
}

export function useGetArtistInventory() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedInventoryItem[]>({
        queryKey: ['artistInventory'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getArtistInventory();
            return convertBigIntsToNumbers(result) as unknown as ConvertedInventoryItem[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetHubInventorySummary(hubId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedInventorySummary>({
        queryKey: ['hubInventorySummary', hubId],
        queryFn: async () => {
            if (!actor || !hubId) throw new Error('Actor or hub ID not available');
            const result = await actor.getHubInventorySummary(hubId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedInventorySummary;
        },
        enabled: !!actor && !isFetching && !!hubId,
    });
}

export function useGetRecentHubActivity(hubId: string) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedHubActivity[]>({
        queryKey: ['recentHubActivity', hubId],
        queryFn: async () => {
            if (!actor || !hubId) return [];
            const result = await actor.getRecentHubActivity(hubId);
            return convertBigIntsToNumbers(result) as unknown as ConvertedHubActivity[];
        },
        enabled: !!actor && !isFetching && !!hubId,
    });
}

export function useGetLowStockAlerts() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedLowStockAlert[]>({
        queryKey: ['lowStockAlerts'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getLowStockAlerts();
            return convertBigIntsToNumbers(result) as unknown as ConvertedLowStockAlert[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useAssignProductToHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, hubId, initialStock }: { productId: string; hubId: string; initialStock: bigint }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.assignProductToHub(productId, hubId, initialStock);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['productInventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['artistInventory'] });
            queryClient.invalidateQueries({ queryKey: ['hubInventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
        },
    });
}

export function useRemoveProductFromHub() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, hubId }: { productId: string; hubId: string }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.removeProductFromHub(productId, hubId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['productInventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['artistInventory'] });
            queryClient.invalidateQueries({ queryKey: ['hubInventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
        },
    });
}

export function useUpdateProductHubStock() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ productId, hubId, newStock }: { productId: string; hubId: string; newStock: bigint }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.updateProductHubStock(productId, hubId, newStock);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['productInventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['artistInventory'] });
            queryClient.invalidateQueries({ queryKey: ['hubInventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
        },
    });
}

export function useRestockInventory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ inventoryId, quantity }: { inventoryId: string; quantity: bigint }) => {
            if (!actor) throw new Error('Actor not available');
            await actor.restockInventory(inventoryId, quantity);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['productInventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['artistInventory'] });
            queryClient.invalidateQueries({ queryKey: ['hubInventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
        },
    });
}

export function useBulkRestockInventory() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (items: Array<[string, bigint]>) => {
            if (!actor) throw new Error('Actor not available');
            await actor.bulkRestockInventory(items);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['inventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['productInventoryByHub'] });
            queryClient.invalidateQueries({ queryKey: ['artistInventory'] });
            queryClient.invalidateQueries({ queryKey: ['hubInventorySummary'] });
            queryClient.invalidateQueries({ queryKey: ['lowStockAlerts'] });
        },
    });
}

export function useExportInventoryReport() {
    const { actor } = useActor();

    return useMutation({
        mutationFn: async () => {
            if (!actor) throw new Error('Actor not available');
            const result = await actor.exportInventoryReport();
            return convertBigIntsToNumbers(result) as unknown as ConvertedInventoryItem[];
        },
    });
}

// Tour Queries
export function useGetTours() {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedTour[]>({
        queryKey: ['tours'],
        queryFn: async () => {
            if (!actor) return [];
            const result = await actor.getTours();
            return convertBigIntsToNumbers(result) as unknown as ConvertedTour[];
        },
        enabled: !!actor && !isFetching,
    });
}

export function useGetArtistTours(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedTour[]>({
        queryKey: ['artistTours', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getArtistTours(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedTour[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useGetTourSummary(artistPrincipal: Principal) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedTourSummary>({
        queryKey: ['tourSummary', artistPrincipal?.toString()],
        queryFn: async () => {
            if (!actor || !artistPrincipal) throw new Error('Actor or artist principal not available');
            const result = await actor.getTourSummary(artistPrincipal);
            return convertBigIntsToNumbers(result) as unknown as ConvertedTourSummary;
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useGetFilteredTours(artistPrincipal: Principal, status: TourStatus | null) {
    const { actor, isFetching } = useActor();

    return useQuery<ConvertedTour[]>({
        queryKey: ['filteredTours', artistPrincipal?.toString(), status],
        queryFn: async () => {
            if (!actor || !artistPrincipal) return [];
            const result = await actor.getFilteredTours(artistPrincipal, status);
            return convertBigIntsToNumbers(result) as unknown as ConvertedTour[];
        },
        enabled: !!actor && !isFetching && !!artistPrincipal,
    });
}

export function useAddTour() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tour: Tour) => {
            if (!actor) throw new Error('Actor not available');
            await actor.addTour(tour);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            queryClient.invalidateQueries({ queryKey: ['artistTours'] });
            queryClient.invalidateQueries({ queryKey: ['tourSummary'] });
            queryClient.invalidateQueries({ queryKey: ['filteredTours'] });
        },
    });
}

export function useUpdateTour() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tour: Tour) => {
            if (!actor) throw new Error('Actor not available');
            await actor.updateTour(tour);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            queryClient.invalidateQueries({ queryKey: ['artistTours'] });
            queryClient.invalidateQueries({ queryKey: ['tourSummary'] });
            queryClient.invalidateQueries({ queryKey: ['filteredTours'] });
        },
    });
}

export function useDeleteTour() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (tourId: string) => {
            if (!actor) throw new Error('Actor not available');
            await actor.deleteTour(tourId);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tours'] });
            queryClient.invalidateQueries({ queryKey: ['artistTours'] });
            queryClient.invalidateQueries({ queryKey: ['tourSummary'] });
            queryClient.invalidateQueries({ queryKey: ['filteredTours'] });
        },
    });
}

// Stripe Queries
export function useIsStripeConfigured() {
    const { actor, isFetching } = useActor();

    return useQuery<boolean>({
        queryKey: ['stripeConfigured'],
        queryFn: async () => {
            if (!actor) return false;
            return actor.isStripeConfigured();
        },
        enabled: !!actor && !isFetching,
    });
}

export function useSetStripeConfiguration() {
    const { actor } = useActor();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (config: StripeConfiguration) => {
            if (!actor) throw new Error('Actor not available');
            await actor.setStripeConfiguration(config);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['stripeConfigured'] });
        },
    });
}
