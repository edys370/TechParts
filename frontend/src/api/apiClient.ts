import axios from 'axios';
import {
  Product,
  Category,
  InventoryTransaction,
  DashboardMetrics,
  MovementType,
  ShippingZone,
  Order,
  CompatibilityResult,
  ProductSubscription,
  EmailLog,
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Servicio de Productos
export const productService = {
  async getAll(params?: { search?: string; categoryId?: number; brand?: string; status?: string; page?: number; limit?: number }) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Product }> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async create(data: any): Promise<{ success: boolean; data: Product }> {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  async update(id: number, data: any): Promise<{ success: boolean; data: Product }> {
    const response = await apiClient.put(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: number): Promise<{ success: boolean }> {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};

// Servicio de Categorías
export const categoryService = {
  async getAll(): Promise<{ success: boolean; data: Category[] }> {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  async create(data: { name: string; description?: string }): Promise<{ success: boolean; data: Category }> {
    const response = await apiClient.post('/categories', data);
    return response.data;
  },
};

// Servicio de Inventario y Movimientos ACID
export const inventoryService = {
  async registerMovement(data: {
    productId: number;
    variantId?: number;
    type: MovementType;
    quantity: number;
    reason?: string;
    reference?: string;
  }): Promise<{ success: boolean; message: string; data: { product: Product; transaction: InventoryTransaction } }> {
    const response = await apiClient.post('/inventory/movements', data);
    return response.data;
  },

  async getMovements(params?: { productId?: number; variantId?: number; type?: MovementType; limit?: number }): Promise<{
    success: boolean;
    data: InventoryTransaction[];
  }> {
    const response = await apiClient.get('/inventory/movements', { params });
    return response.data;
  },

  async getAlerts(): Promise<{ success: boolean; data: Product[] }> {
    const response = await apiClient.get('/inventory/alerts');
    return response.data;
  },

  async getMetrics(): Promise<{ success: boolean; data: DashboardMetrics }> {
    const response = await apiClient.get('/inventory/metrics');
    return response.data;
  },
};

// Servicio de Pedidos y Checkout (Fase 2 - Dev 2 Líder)
export const orderService = {
  async create(data: {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    customerAddress: string;
    customerCity: string;
    customerCedula?: string;
    shippingZoneId: number;
    paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'SANDBOX_CARD';
    notes?: string;
    items: Array<{ productId: number; variantId?: number; quantity: number }>;
  }): Promise<{ success: boolean; message: string; data: Order; paymentInstructions?: any }> {
    const response = await apiClient.post('/orders', data);
    return response.data;
  },

  async getAll(params?: { search?: string; status?: string; page?: number; limit?: number }): Promise<{
    success: boolean;
    total: number;
    data: Order[];
  }> {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  async getById(id: string | number): Promise<{ success: boolean; data: Order; bankTransferDetails?: any }> {
    const response = await apiClient.get(`/orders/${id}`);
    return response.data;
  },

  async getShippingZones(): Promise<{ success: boolean; data: ShippingZone[] }> {
    const response = await apiClient.get('/orders/shipping-zones');
    return response.data;
  },

  async getPaymentMethods(): Promise<{ success: boolean; data: any[] }> {
    const response = await apiClient.get('/orders/payment-methods');
    return response.data;
  },

  async updateStatus(id: number, status: string, paymentStatus?: string): Promise<{ success: boolean; data: Order }> {
    const response = await apiClient.patch(`/orders/${id}/status`, { status, paymentStatus });
    return response.data;
  },
};

// Servicio de Compatibilidad de Hardware (Fase 2 - Dev 1)
export const compatibilityService = {
  async check(productIds: number[]): Promise<{ success: boolean; data: CompatibilityResult }> {
    const response = await apiClient.post('/compatibility/check', { productIds });
    return response.data;
  },
};

// Healthcheck
export const healthService = {
  async check(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// Servicio de Suscripciones para Reposición de Stock ("Vuelve a estar disponible" - Fase 3)
export const subscriptionService = {
  async subscribe(data: {
    email: string;
    customerName?: string;
    productId: number;
    variantId?: number;
  }): Promise<{ success: boolean; message: string; data: ProductSubscription; alreadySubscribed: boolean }> {
    const response = await apiClient.post('/subscriptions', data);
    return response.data;
  },

  async getAll(params?: { status?: string; limit?: number }): Promise<{ success: boolean; total: number; data: ProductSubscription[] }> {
    const response = await apiClient.get('/subscriptions', { params });
    return response.data;
  },
};

// Servicio de Auditoría y Verificación SMTP (Fase 3)
export const emailService = {
  async getLogs(params?: { limit?: number; templateType?: string }): Promise<{
    success: boolean;
    total: number;
    smtpConfig: any;
    data: EmailLog[];
  }> {
    const response = await apiClient.get('/email-logs', { params });
    return response.data;
  },

  async sendTest(to?: string): Promise<{ success: boolean; message: string; result: any }> {
    const response = await apiClient.post('/email-logs/test', { to });
    return response.data;
  },
};

