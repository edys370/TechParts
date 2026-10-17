import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { MovementsPage } from './pages/MovementsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductModal } from './pages/ProductModal';
import { StockMovementModal } from './pages/StockMovementModal';
import { CompatibilityNotice } from './components/ui/CompatibilityNotice';
import { WhatsAppButton } from './components/ui/WhatsAppButton';
import {
  productService,
  categoryService,
  inventoryService,
  healthService,
} from './api/apiClient';
import { Product, Category, InventoryTransaction, DashboardMetrics, MovementType } from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Datos principales
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Estados de Modales
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Cargar todos los datos
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // 1. Probar salud de la API
      try {
        await healthService.check();
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }

      // 2. Traer recursos
      const [prodRes, catRes, metricRes, alertRes, movRes] = await Promise.allSettled([
        productService.getAll(),
        categoryService.getAll(),
        inventoryService.getMetrics(),
        inventoryService.getAlerts(),
        inventoryService.getMovements({ limit: 100 }),
      ]);

      if (prodRes.status === 'fulfilled' && prodRes.value.data) {
        setProducts(prodRes.value.data);
      }
      if (catRes.status === 'fulfilled' && catRes.value.data) {
        setCategories(catRes.value.data);
      }
      if (metricRes.status === 'fulfilled' && metricRes.value.data) {
        setMetrics(metricRes.value.data);
      }
      if (alertRes.status === 'fulfilled' && alertRes.value.data) {
        setLowStockAlerts(alertRes.value.data);
      }
      if (movRes.status === 'fulfilled' && movRes.value.data) {
        setMovements(movRes.value.data);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejadores de Productos
  const handleSaveProduct = async (formData: any) => {
    if (editingProduct) {
      await productService.update(editingProduct.id, formData);
    } else {
      await productService.create(formData);
    }
    await loadData();
  };

  const handleDeleteProduct = async (product: Product) => {
    if (window.confirm(`¿Estás seguro de eliminar el producto "${product.name}" (${product.sku})?`)) {
      try {
        await productService.delete(product.id);
        await loadData();
      } catch (err: any) {
        alert(err?.response?.data?.message || 'Error al eliminar el producto');
      }
    }
  };

  // Manejador de Movimientos de Stock (ACID)
  const handleRegisterMovement = async (data: {
    productId: number;
    type: MovementType;
    quantity: number;
    reason?: string;
    reference?: string;
  }) => {
    await inventoryService.registerMovement(data);
    await loadData();
  };

  return (
    <div className="min-h-screen bg-stitch-surface flex flex-col">
      <Header
        apiStatus={apiStatus}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
      />

      <div className="flex-1 flex">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          lowStockCount={lowStockAlerts.length}
        />

        <main className="flex-1 p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          <CompatibilityNotice />

          {currentTab === 'dashboard' && (
            <DashboardPage
              metrics={metrics}
              lowStockAlerts={lowStockAlerts}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onGoToInventory={() => setCurrentTab('inventory')}
              onOpenMovement={(prod) => {
                setSelectedProductForMovement(prod);
                setIsMovementModalOpen(true);
              }}
            />
          )}

          {currentTab === 'inventory' && (
            <InventoryPage
              products={products}
              categories={categories}
              onOpenNewProduct={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              onEditProduct={(prod) => {
                setEditingProduct(prod);
                setIsProductModalOpen(true);
              }}
              onDeleteProduct={handleDeleteProduct}
              onOpenMovement={(prod) => {
                setSelectedProductForMovement(prod);
                setIsMovementModalOpen(true);
              }}
              isLoading={isLoading}
            />
          )}

          {currentTab === 'movements' && (
            <MovementsPage movements={movements} isLoading={isLoading} />
          )}

          {currentTab === 'settings' && <SettingsPage />}
        </main>
      </div>

      {/* Modal de Producto */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Modal de Movimiento de Stock */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleRegisterMovement}
        product={selectedProductForMovement}
      />
      {/* Botón flotante de WhatsApp */}
      <WhatsAppButton variant="floating" />
    </div>
  );
};

export default App;
