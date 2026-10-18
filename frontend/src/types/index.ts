export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count?: {
    products: number;
  };
}

export type ProductStatus = 'ACTIVE' | 'LOW_STOCK' | 'OUT_OF_STOCK' | 'INACTIVE';

export interface ProductVariant {
  id: number;
  productId: number;
  sku: string;
  name: string;
  capacity?: string | null;
  color?: string | null;
  modelVariant?: string | null;
  price: number | string;
  costPrice: number | string;
  stock: number;
  minStock: number;
  status: ProductStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  id: number;
  sku: string;
  name: string;
  description?: string | null;
  brand: string;
  model: string;
  price: number | string;
  costPrice: number | string;
  stock: number;
  minStock: number;
  status: ProductStatus;
  hasVariants: boolean;
  socket?: string | null;
  ramType?: string | null;
  wattage?: number | null;
  formFactor?: string | null;
  imageUrl?: string | null;
  categoryId: number;
  category?: Category;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryTransaction {
  id: number;
  productId: number;
  variantId?: number | null;
  product?: {
    id: number;
    sku: string;
    name: string;
    brand: string;
    model: string;
    category?: {
      name: string;
    };
  };
  variant?: {
    id: number;
    sku: string;
    name: string;
    capacity?: string | null;
    color?: string | null;
  } | null;
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string | null;
  reference?: string | null;
  createdAt: string;
}

export interface DashboardMetrics {
  totalProducts: number;
  totalStockItems: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  totalCostValuation: number;
  totalRetailValuation: number;
  potentialProfit: number;
  totalOrders?: number;
}

export interface ShippingZone {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  cost: number | string;
  freeThreshold?: number | string | null;
  estimatedDays: string;
  isActive: boolean;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  variantId?: number | null;
  productName: string;
  variantName?: string | null;
  sku: string;
  unitPrice: number | string;
  quantity: number;
  total: number | string;
  product?: {
    id: number;
    name: string;
    sku: string;
    imageUrl?: string | null;
  };
  variant?: {
    id: number;
    name: string;
    sku: string;
  } | null;
}

export interface Order {
  id: number;
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerCedula?: string | null;
  shippingZoneId: number;
  shippingZone?: ShippingZone;
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'SANDBOX_CARD';
  paymentStatus: 'PENDING' | 'PAID' | 'VERIFIED' | 'FAILED';
  orderStatus: 'PROCESSING' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';
  subtotal: number | string;
  shippingCost: number | string;
  taxRate: number | string;
  taxAmount: number | string;
  total: number | string;
  currency: string;
  notes?: string | null;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  selectedVariant?: ProductVariant | null;
  quantity: number;
}

export interface CompatibilityResult {
  compatible: boolean;
  score: number;
  issues: string[];
  warnings: string[];
  recommendations: string[];
  totalEstimatedWattage: number;
  recommendedPsuWattage: number;
  componentsAnalyzed: Array<{
    id: number;
    name: string;
    category: string;
    socket?: string | null;
    ramType?: string | null;
    wattage?: number | null;
  }>;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  total?: number;
  page?: number;
  limit?: number;
  totalPages?: number;
}

export interface ProductSubscription {
  id: number;
  email: string;
  customerName?: string | null;
  productId: number;
  variantId?: number | null;
  status: 'PENDING' | 'NOTIFIED' | 'CANCELLED';
  notifiedAt?: string | null;
  createdAt: string;
  product?: {
    id: number;
    name: string;
    sku: string;
  };
  variant?: {
    id: number;
    name: string;
    sku: string;
  } | null;
}

export interface EmailLog {
  id: number;
  recipient: string;
  subject: string;
  templateType: 'INVOICE' | 'NEW_ORDER_ADMIN' | 'LOW_STOCK_ALERT' | 'RESTOCK_NOTIFICATION' | 'TEST';
  status: 'SENT' | 'SIMULATED' | 'FAILED';
  messageId?: string | null;
  metadata?: string | null;
  error?: string | null;
  createdAt: string;
}

