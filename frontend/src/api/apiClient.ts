import axios from 'axios';
import { Product, Category, InventoryTransaction, DashboardMetrics, MovementType } from '../types';

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
  async getAll(params?: { search?: string; categoryId?: number; brand?: string; status?: string; page?: number }) {
    const response = await apiClient.get('/products', { params });
    return response.data;
  },

  async getById(id: number): Promise<{ success: boolean; data: Product }> {
    const response = await apiClient.get(`/products/${id}`);
    return response.data;
  },

  async create(data: Partial<Product>): Promise<{ success: boolean; data: Product }> {
    const response = await apiClient.post('/products', data);
    return response.data;
  },

  async update(id: number, data: Partial<Product>): Promise<{ success: boolean; data: Product }> {
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
    type: MovementType;
    quantity: number;
    reason?: string;
    reference?: string;
  }): Promise<{ success: boolean; message: string; data: { product: Product; transaction: InventoryTransaction } }> {
    const response = await apiClient.post('/inventory/movements', data);
    return response.data;
  },

  async getMovements(params?: { productId?: number; type?: MovementType; limit?: number }): Promise<{
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

// Healthcheck
export const healthService = {
  async check(): Promise<any> {
    const response = await apiClient.get('/health');
    return response.data;
  },
};

// Servicio de Reglas de Compatibilidad Técnica
export const compatibilityService = {
  async check(data: {
    productIds?: number[];
    cpuId?: number;
    motherboardId?: number;
    ramId?: number;
    gpuId?: number;
    psuId?: number;
    customSpecs?: any[];
  }) {
    const response = await apiClient.post('/compatibility/check', data);
    return response.data;
  },

  async getGuidelines() {
    const response = await apiClient.get('/compatibility/guidelines');
    return response.data;
  },
};

