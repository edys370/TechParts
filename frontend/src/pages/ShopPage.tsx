import React, { useState } from 'react';
import { Product, Category, ProductVariant } from '../types';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { BackInStockModal } from './BackInStockModal';
import {
  ShoppingCart,
  Check,
  MessageCircle,
  Cpu,
  Layers,
  Zap,
  Filter,
  Search,
  Sparkles,
  Bell,
} from 'lucide-react';

interface ShopPageProps {
  products: Product[];
  categories: Category[];
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
  onOpenCompatibilityAssistant: (preselectedProduct?: Product) => void;
}

export const ShopPage: React.FC<ShopPageProps> = ({
  products,
  categories,
  onAddToCart,
  onOpenCompatibilityAssistant,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedVariants, setSelectedVariants] = useState<{ [productId: number]: ProductVariant }>({});
  const [addedAnimation, setAddedAnimation] = useState<{ [key: string]: boolean }>({});
  const [isBackInStockOpen, setIsBackInStockOpen] = useState(false);
  const [selectedStockProduct, setSelectedStockProduct] = useState<Product | null>(null);
  const [selectedStockVariant, setSelectedStockVariant] = useState<ProductVariant | null>(null);

  const handleOpenBackInStock = (product: Product, variant?: ProductVariant | null) => {
    setSelectedStockProduct(product);
    setSelectedStockVariant(variant || null);
    setIsBackInStockOpen(true);
  };

  // Filtrado de productos
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory ? prod.categoryId === selectedCategory : true;
    const matchesSearch =
      prod.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prod.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (prod.socket && prod.socket.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (prod.ramType && prod.ramType.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  const handleSelectVariant = (productId: number, variant: ProductVariant) => {
    setSelectedVariants((prev) => ({
      ...prev,
      [productId]: variant,
    }));
  };

  const handleAddProduct = (product: Product) => {
    const variant = selectedVariants[product.id] || (product.variants && product.variants.length > 0 ? product.variants[0] : undefined);
    onAddToCart(product, variant, 1);

    const animKey = `${product.id}-${variant ? variant.id : 'simple'}`;
    setAddedAnimation((prev) => ({ ...prev, [animKey]: true }));
    setTimeout(() => {
      setAddedAnimation((prev) => ({ ...prev, [animKey]: false }));
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Banner Hero */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-xl border border-indigo-500/20">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3 border border-indigo-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            Catálogo Oficial TechParts 2026
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-2">
            Componentes de Alto Rendimiento con Control de Variantes
          </h1>
          <p className="text-sm sm:text-base text-slate-300 mb-5 leading-relaxed">
            Hardware 100% garantizado con stock independiente por variación, pasarelas de pago seguras, tarifas de envío por zonas y verificador de compatibilidad asistido.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Button
              variant="primary"
              onClick={() => onOpenCompatibilityAssistant()}
              className="bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 flex items-center gap-2"
            >
              <Cpu className="w-4 h-4" />
              Probar Asistente de Compatibilidad PC
            </Button>
            <a
              href="https://wa.me/593998765432?text=Hola%20TechParts,%20deseo%20asesor%C3%ADa%20técnica%20sobre%20compatibilidad%20de%20piezas"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition-colors shadow-md"
            >
              <MessageCircle className="w-4 h-4" />
              Asesoría Técnica WhatsApp
            </a>
          </div>
        </div>
        {/* Adorno visual de fondo */}
        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
        {/* Categorías */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
              selectedCategory === null
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Todas ({products.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat.id
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Buscador */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, SKU, socket..."
            className="w-full pl-9 pr-4 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Grilla de Productos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {filteredProducts.map((product) => {
          const hasVariants = product.hasVariants && product.variants && product.variants.length > 0;
          const currentVariant = hasVariants
            ? selectedVariants[product.id] || product.variants![0]
            : null;

          const displayPrice = currentVariant ? Number(currentVariant.price) : Number(product.price);
          const displayStock = currentVariant ? currentVariant.stock : product.stock;
          const displaySku = currentVariant ? currentVariant.sku : product.sku;
          const isOutOfStock = displayStock === 0;
          const isLowStock = !isOutOfStock && displayStock <= (currentVariant ? currentVariant.minStock : product.minStock);

          const animKey = `${product.id}-${currentVariant ? currentVariant.id : 'simple'}`;
          const isJustAdded = !!addedAnimation[animKey];

          // Enlace WhatsApp precargado dinámico (Requerimiento Proyecto.md)
          const waMessage = encodeURIComponent(
            `Hola TechParts, deseo consultar la compatibilidad técnica del producto: ${product.name} (SKU: ${displaySku})`
          );
          const waUrl = `https://wa.me/593998765432?text=${waMessage}`;

          return (
            <div
              key={product.id}
              className="flex flex-col rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow overflow-hidden group"
            >
              {/* Imagen y Badges */}
              <div className="relative h-44 bg-slate-100 dark:bg-slate-800 flex items-center justify-center p-4 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-xl bg-indigo-50 dark:bg-slate-700 flex items-center justify-center text-indigo-500">
                    <Cpu className="w-8 h-8" />
                  </div>
                )}

                {/* Badge de Categoría */}
                <div className="absolute top-2.5 left-2.5">
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-900/80 backdrop-blur-md text-white border border-slate-700/50">
                    {product.category?.name || 'Hardware'}
                  </span>
                </div>

                {/* Badge de Stock */}
                <div className="absolute top-2.5 right-2.5">
                  {isOutOfStock ? (
                    <Badge variant="danger" size="sm">Agotado</Badge>
                  ) : isLowStock ? (
                    <Badge variant="warning" size="sm">¡Últimas {displayStock} unid!</Badge>
                  ) : (
                    <Badge variant="success" size="sm">En Stock ({displayStock})</Badge>
                  )}
                </div>
              </div>

              {/* Contenido */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-1">
                    <span>{product.brand}</span>
                    <span className="font-mono text-[11px] text-slate-400">SKU: {displaySku}</span>
                  </div>

                  <h3 className="font-semibold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-2 mb-2">
                    {product.name}
                  </h3>

                  {/* Ficha técnica resumida para compatibilidad */}
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {product.socket && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-medium border border-blue-200 dark:border-blue-900">
                        <Cpu className="w-3 h-3" /> Socket {product.socket}
                      </span>
                    )}
                    {product.ramType && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 text-[11px] font-medium border border-purple-200 dark:border-purple-900">
                        <Layers className="w-3 h-3" /> {product.ramType}
                      </span>
                    )}
                    {product.wattage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 text-[11px] font-medium border border-amber-200 dark:border-amber-900">
                        <Zap className="w-3 h-3" /> {product.wattage}W
                      </span>
                    )}
                  </div>

                  {/* Selector de Variaciones (Fase 1 & Fase 2 - Reto de Variaciones Coherentes) */}
                  {hasVariants && (
                    <div className="mb-3 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                        Selecciona Variante (Stock independiente):
                      </label>
                      <div className="flex flex-wrap gap-1.5">
                        {product.variants!.map((variant) => {
                          const isSelected = currentVariant?.id === variant.id;
                          const varOutOfStock = variant.stock === 0;

                          return (
                            <button
                              key={variant.id}
                              type="button"
                              onClick={() => handleSelectVariant(product.id, variant)}
                              className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all text-left ${
                                isSelected
                                  ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-500'
                                  : varOutOfStock
                                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 line-through opacity-60'
                                  : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:border-indigo-400'
                              }`}
                            >
                              <span>{variant.name}</span>
                              <span className="block text-[10px] opacity-80">
                                ${Number(variant.price).toFixed(2)} ({variant.stock} disp.)
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Precios y Botones de Acción */}
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                  <div className="flex items-baseline justify-between">
                    <div>
                      <span className="text-xs text-slate-400">Precio unitario:</span>
                      <div className="text-xl font-black text-indigo-600 dark:text-indigo-400">
                        ${displayPrice.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400 ml-1">USD</span>
                      </div>
                    </div>
                    {/* Botón WhatsApp Ficha (Obligatorio en Proyecto.md) */}
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      title="Consultar compatibilidad técnica por WhatsApp"
                      className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 transition-colors flex items-center justify-center text-xs gap-1 font-medium"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span className="hidden sm:inline">Consultar</span>
                    </a>
                  </div>

                  <div className="flex items-center gap-2">
                    {isOutOfStock ? (
                      <Button
                        variant="secondary"
                        onClick={() => handleOpenBackInStock(product, currentVariant)}
                        className="flex-1 flex items-center justify-center gap-2 text-xs py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-300 dark:border-amber-800"
                      >
                        <Bell className="w-3.5 h-3.5" />
                        Avisarme al Reponer
                      </Button>
                    ) : (
                      <Button
                        variant={isJustAdded ? 'secondary' : 'primary'}
                        onClick={() => handleAddProduct(product)}
                        className={`flex-1 flex items-center justify-center gap-2 text-xs py-2.5 transition-all ${
                          isJustAdded ? 'bg-emerald-600 text-white' : ''
                        }`}
                      >
                        {isJustAdded ? (
                          <>
                            <Check className="w-4 h-4" />
                            ¡Añadido!
                          </>
                        ) : (
                          <>
                            <ShoppingCart className="w-4 h-4" />
                            Añadir al Carrito
                          </>
                        )}
                      </Button>
                    )}

                    {/* Botón rápido para verificar compatibilidad de esta pieza */}
                    <button
                      type="button"
                      title="Comprobar compatibilidad con otros componentes"
                      onClick={() => onOpenCompatibilityAssistant(product)}
                      className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-indigo-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                    >
                      <Cpu className="w-4 h-4 text-indigo-500" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredProducts.length === 0 && (
        <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8">
          <Filter className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
            No se encontraron productos con esos filtros
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Intenta cambiar los términos de búsqueda o selecciona otra categoría.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-4"
            onClick={() => {
              setSelectedCategory(null);
              setSearchQuery('');
            }}
          >
            Limpiar filtros
          </Button>
        </div>
      )}

      {/* Modal de Alerta de Reposición (Fase 3 - Dev 2 & Dev 3) */}
      <BackInStockModal
        isOpen={isBackInStockOpen}
        onClose={() => setIsBackInStockOpen(false)}
        product={selectedStockProduct}
        variant={selectedStockVariant}
      />
    </div>
  );
};
