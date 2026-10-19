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
  capacity?: string;
  color?: string;
  modelVariant?: string;
  price: number;
  costPrice: number;
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
  description?: string;
  brand: string;
  model: string;
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  status: ProductStatus;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  categoryId: number;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface InventoryTransaction {
  id: number;
  productId: number;
  variantId?: number;
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
    capacity?: string;
    color?: string;
    stock: number;
  };
  type: MovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason?: string;
  reference?: string;
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
