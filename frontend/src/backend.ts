// Backend types matching the Motoko backend
import { Principal } from '@dfinity/principal';

// ExternalBlob class for image handling
export class ExternalBlob {
  private _url: string;

  constructor(url: string) {
    this._url = url;
  }

  getDirectURL(): string {
    return this._url;
  }

  static from(url: string): ExternalBlob {
    return new ExternalBlob(url);
  }
}

// User Roles
export type UserRole = {
  _tag: 'user' | 'admin' | 'guest';
};

export const UserRole = {
  user: { _tag: 'user' as const },
  admin: { _tag: 'admin' as const },
  guest: { _tag: 'guest' as const },
};

// App Roles
export type AppRole = {
  _tag: 'artist' | 'buyer' | 'hub' | 'admin';
};

export const AppRole = {
  artist: { _tag: 'artist' as const },
  buyer: { _tag: 'buyer' as const },
  hub: { _tag: 'hub' as const },
  admin: { _tag: 'admin' as const },
};

// User Profile
export type UserProfile = {
  name: string;
  email: string;
  role: UserRole;
  appRole: AppRole;
  hubId?: string;
};

// Product Types
export type ProductType = {
  _tag: 'physical' | 'nft' | 'phygital';
};

export const ProductType = {
  physical: { _tag: 'physical' as const },
  nft: { _tag: 'nft' as const },
  phygital: { _tag: 'phygital' as const },
};

export type Blockchain = {
  _tag: 'icp' | 'ethereum' | 'solana';
};

export const Blockchain = {
  icp: { _tag: 'icp' as const },
  ethereum: { _tag: 'ethereum' as const },
  solana: { _tag: 'solana' as const },
};

// Product
export type Product = {
  id: string;
  artist: Principal;
  name: string;
  description: string;
  price: bigint;
  inventory: bigint;
  images: ExternalBlob[];
  productType: ProductType;
  blockchain?: Blockchain;
  royaltyPercentage?: bigint;
  unlockableContent?: string;
  supply?: bigint;
  sku?: string;
  shippingDetails?: string;
  mintCertificate: boolean;
  attachNfcQrTag: boolean;
  authenticityLink?: string;
};

// Certificate
export type Certificate = {
  id: string;
  productId: string;
  artistId: Principal;
  metadataHash: string;
  timestamp: bigint;
  version: bigint;
  blockchain: Blockchain;
  authenticityLink: string;
};

// Order Status
export type OrderStatus = {
  _tag: 'pending' | 'assigned' | 'processing' | 'shipped' | 'delivered';
};

export const OrderStatus = {
  pending: { _tag: 'pending' as const },
  assigned: { _tag: 'assigned' as const },
  processing: { _tag: 'processing' as const },
  shipped: { _tag: 'shipped' as const },
  delivered: { _tag: 'delivered' as const },
};

// Order
export type Order = {
  id: string;
  buyer: Principal;
  productId: string;
  quantity: bigint;
  status: OrderStatus;
  assignedHub?: string;
  createdAt: bigint;
  updatedAt: bigint;
};

// Order Filter
export type OrderFilter = {
  status?: OrderStatus;
  startDate?: bigint;
  endDate?: bigint;
  hub?: string;
  searchTerm?: string;
};

// Order Summary
export type OrderSummary = {
  totalOrders: bigint;
  inProduction: bigint;
  shipped: bigint;
  delivered: bigint;
  urgent: bigint;
  pending: bigint;
};

// Hub Status
export type HubStatus = {
  _tag: 'draft' | 'pendingApproval' | 'approved' | 'rejected' | 'suspended';
};

export const HubStatus = {
  draft: { _tag: 'draft' as const },
  pendingApproval: { _tag: 'pendingApproval' as const },
  approved: { _tag: 'approved' as const },
  rejected: { _tag: 'rejected' as const },
  suspended: { _tag: 'suspended' as const },
};

// Hub
export type Hub = {
  id: string;
  name: string;
  location: [number, number];
  capacity: bigint;
  status: HubStatus;
  businessInfo: string;
  contactInfo: string;
  services: string;
  createdAt: bigint;
  updatedAt: bigint;
};

// Payment
export type Payment = {
  id: string;
  orderId: string;
  artistAmount: bigint;
  hubAmount: bigint;
  platformAmount: bigint;
  totalAmount: bigint;
  timestamp: bigint;
};

// Stripe Configuration
export type StripeConfiguration = {
  apiKey: string;
  webhookSecret: string;
};

// Artist Dashboard Summary
export type ArtistDashboardSummary = {
  totalSales: bigint;
  totalSalesChange: number;
  activeFans: bigint;
  activeFansGrowth: number;
  pendingOrders: bigint;
  urgentOrders: bigint;
  monthlyRevenue: bigint;
  monthlyRevenueGrowth: number;
  productsPublished: bigint;
  averageOrderValue: number;
  customerSatisfaction: number;
  fulfillmentTime: number;
  topTracks: string[];
  actionItems: string[];
  announcements: string[];
};

// Inventory Status
export type InventoryStatus = {
  _tag: 'inStock' | 'pending' | 'lowStock' | 'outOfStock';
};

export const InventoryStatus = {
  inStock: { _tag: 'inStock' as const },
  pending: { _tag: 'pending' as const },
  lowStock: { _tag: 'lowStock' as const },
  outOfStock: { _tag: 'outOfStock' as const },
};

// Inventory Item
export type InventoryItem = {
  productId: string;
  hubId: string;
  stock: bigint;
  pending: bigint;
  status: InventoryStatus;
  lastUpdated: bigint;
};

// Inventory Summary
export type InventorySummary = {
  hubName: string;
  location: [number, number];
  status: string;
  inStock: bigint;
  pending: bigint;
  lowStock: bigint;
  totalUnits: bigint;
};

// Hub Activity
export type HubActivity = {
  hubId: string;
  activityType: {
    _tag: 'unitsShipped' | 'lowStockAlert' | 'newOrder';
    value?: bigint;
  };
  timestamp: bigint;
};

// Low Stock Alert
export type LowStockAlert = {
  productName: string;
  hubLocation: [number, number];
  stock: bigint;
  threshold: bigint;
  lastUpdated: bigint;
};

// Tour Type
export type TourType = {
  _tag: 'exclusiveDrop' | 'regularShow' | 'festival';
};

export const TourType = {
  exclusiveDrop: { _tag: 'exclusiveDrop' as const },
  regularShow: { _tag: 'regularShow' as const },
  festival: { _tag: 'festival' as const },
};

// Tour Status
export type TourStatus = {
  _tag: 'upcoming' | 'completed' | 'cancelled';
};

export const TourStatus = {
  upcoming: { _tag: 'upcoming' as const },
  completed: { _tag: 'completed' as const },
  cancelled: { _tag: 'cancelled' as const },
};

// Tour
export type Tour = {
  id: string;
  artist: Principal;
  venueName: string;
  tourType: TourType;
  status: TourStatus;
  location: string;
  date: bigint;
  ticketSales: bigint;
  ticketSalesPercentage: number;
  merchRevenue: bigint;
};

// Tour Summary
export type TourSummary = {
  totalTours: bigint;
  upcomingShows: bigint;
  ticketSales: bigint;
  ticketSalesPercentage: number;
  totalMerchRevenue: bigint;
  averageMerchPerShow: number;
};
