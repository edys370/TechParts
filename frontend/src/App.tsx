import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/layout/Header';
import { Sidebar, TabType } from './components/layout/Sidebar';
import { ShopPage } from './pages/ShopPage';
import { CompatibilityPage } from './pages/CompatibilityPage';
import { DashboardPage } from './pages/DashboardPage';
import { InventoryPage } from './pages/InventoryPage';
import { OrdersPage } from './pages/OrdersPage';
import { MovementsPage } from './pages/MovementsPage';
import { PoliciesPage } from './pages/PoliciesPage';
import { SettingsPage } from './pages/SettingsPage';
import { ProductModal } from './pages/ProductModal';
import { StockMovementModal } from './pages/StockMovementModal';
import { CheckoutModal } from './pages/CheckoutModal';
import { CompatibilityNotice } from './components/ui/CompatibilityNotice';
import { WhatsAppButton } from './components/ui/WhatsAppButton';
import {
  productService,
  categoryService,
  inventoryService,
  orderService,
  healthService,
} from './api/apiClient';
import {
  Product,
  Category,
  InventoryTransaction,
  DashboardMetrics,
  MovementType,
  CartItem,
  ProductVariant,
  Order,
} from './types';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<TabType>('shop');
  const [apiStatus, setApiStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connecting');
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Datos principales
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStockAlerts, setLowStockAlerts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryTransaction[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Carrito de Compras (Fase 2)
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Asistente de Compatibilidad (Fase 2)
  const [compatibilityPreselect, setCompatibilityPreselect] = useState<Product | null>(null);

  // Estados de Modales Administrativos
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [selectedProductForMovement, setSelectedProductForMovement] = useState<Product | null>(null);

  // Cargar todos los datos
  const loadData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      try {
        await healthService.check();
        setApiStatus('connected');
      } catch {
        setApiStatus('disconnected');
      }

      const [prodRes, catRes, metricRes, alertRes, movRes, ordRes] = await Promise.allSettled([
        productService.getAll({ limit: 100 }),
        categoryService.getAll(),
        inventoryService.getMetrics(),
        inventoryService.getAlerts(),
        inventoryService.getMovements({ limit: 100 }),
        orderService.getAll({ limit: 50 }),
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
      if (ordRes.status === 'fulfilled' && ordRes.value.data) {
        setOrders(ordRes.value.data);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Manejo del Carrito de Compras (Fase 2)
  const handleAddToCart = (product: Product, variant?: ProductVariant, quantity: number = 1) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => {
        if (variant) {
          return item.product.id === product.id && item.selectedVariant?.id === variant.id;
        }
        return item.product.id === product.id && !item.selectedVariant;
      });

      if (existingIdx >= 0) {
        const next = [...prev];
        next[existingIdx].quantity += quantity;
        return next;
      }
      return [...prev, { product, selectedVariant: variant || null, quantity }];
    });
  };

  const handleUpdateCartQuantity = (index: number, quantity: number) => {
    setCart((prev) => {
      const next = [...prev];
      next[index].quantity = quantity;
      return next;
    });
  };

  const handleRemoveFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const handleClearCart = () => {
    setCart([]);
  };

  const handleOrderSuccess = (order: Order) => {
    loadData();
  };

  // Abrir asistente de compatibilidad con producto preseleccionado
  const handleOpenCompatibility = (preselected?: Product) => {
    setCompatibilityPreselect(preselected || null);
    setCurrentTab('compatibility');
  };

  // Guardar y Eliminar Productos (Admin)
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

  // Movimiento de inventario ACID
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

  const totalCartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      <Header
        apiStatus={apiStatus}
        onRefresh={loadData}
        isRefreshing={isRefreshing}
        cartCount={totalCartCount}
        onOpenCart={() => setIsCheckoutOpen(true)}
      />

      <div className="flex-1 flex">
        <Sidebar
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          lowStockCount={lowStockAlerts.length}
          ordersCount={orders.length}
        />

        <main className="flex-1 p-4 sm:p-6 max-w-7xl mx-auto w-full overflow-y-auto">
          {/* Aviso Global de Compatibilidad de la tienda (Requerimiento Proyecto.md) */}
          <CompatibilityNotice />

          {/* Vistas según la pestaña activa */}
          {currentTab === 'shop' && (
            <ShopPage
              products={products}
              categories={categories}
              onAddToCart={handleAddToCart}
              onOpenCompatibilityAssistant={handleOpenCompatibility}
            />
          )}

          {currentTab === 'compatibility' && (
            <CompatibilityPage
              products={products}
              initialSelectedProduct={compatibilityPreselect}
              onAddToCart={handleAddToCart}
            />
          )}

          {currentTab === 'policies' && <PoliciesPage />}

          {currentTab === 'orders' && <OrdersPage />}

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

      {/* Modal de Carrito y Checkout (Fase 2) */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveFromCart}
        onClearCart={handleClearCart}
        onOrderSuccess={handleOrderSuccess}
      />

      {/* Modal de Producto (Crear / Editar) */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSubmit={handleSaveProduct}
        product={editingProduct}
        categories={categories}
      />

      {/* Modal de Movimiento de Stock ACID */}
      <StockMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSubmit={handleRegisterMovement}
        product={selectedProductForMovement}
      />

      {/* Botón flotante permanente de WhatsApp con número internacional y wa.me */}
      <WhatsAppButton variant="floating" />
    </div>
  );
};

export default App;
