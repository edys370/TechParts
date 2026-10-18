import React, { useState, useMemo } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Product, Category } from '../types';
import {
  Search,
  PlusCircle,
  ArrowLeftRight,
  Edit,
  Trash2,
  Package,
  Layers,
  ChevronDown,
  ChevronRight,
  MessageCircle,
} from 'lucide-react';

interface InventoryPageProps {
  products: Product[];
  categories: Category[];
  onOpenNewProduct: () => void;
  onEditProduct: (product: Product) => void;
  onDeleteProduct: (product: Product) => void;
  onOpenMovement: (product: Product) => void;
  isLoading: boolean;
}

export const InventoryPage: React.FC<InventoryPageProps> = ({
  products,
  categories,
  onOpenNewProduct,
  onEditProduct,
  onDeleteProduct,
  onOpenMovement,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [expandedProducts, setExpandedProducts] = useState<{ [id: number]: boolean }>({});

  const toggleExpand = (id: number) => {
    setExpandedProducts((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesSearch =
        searchTerm === '' ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.model.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || p.categoryId === Number(selectedCategory);

      const matchesStatus = selectedStatus === 'all' || p.status === selectedStatus;

      return matchesSearch && matchesCategory && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedStatus]);

  const getStatusBadge = (status: string, stock: number) => {
    if (stock === 0 || status === 'OUT_OF_STOCK') {
      return <Badge variant="danger" size="sm">Agotado</Badge>;
    }
    if (status === 'LOW_STOCK') {
      return <Badge variant="warning" size="sm">Bajo Stock</Badge>;
    }
    return <Badge variant="success" size="sm">Activo</Badge>;
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Barra de cabecera con filtros y acción */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Catálogo de Inventario y Variantes</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Control de existencias independiente por variación de producto (Fase 1 & 2)
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={onOpenNewProduct}>
          <PlusCircle className="w-4 h-4 mr-1.5" />
          Agregar Componente
        </Button>
      </div>

      {/* Filtros */}
      <Card className="!p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por SKU, nombre, marca..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Todas las Categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="all">Todos los Estados de Stock</option>
              <option value="ACTIVE">Activo / Normal</option>
              <option value="LOW_STOCK">Bajo Stock</option>
              <option value="OUT_OF_STOCK">Agotado</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tabla de Productos */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-10"></th>
                <th className="py-3 px-4">SKU / Modelo</th>
                <th className="py-3 px-4">Producto & Marca</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">Stock Consolidado</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    Cargando componentes desde PostgreSQL...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const hasVariants = p.hasVariants && p.variants && p.variants.length > 0;
                  const isExpanded = !!expandedProducts[p.id];

                  return (
                    <React.Fragment key={p.id}>
                      <tr className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-3.5 px-3 text-center">
                          {hasVariants ? (
                            <button
                              onClick={() => toggleExpand(p.id)}
                              className="p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                              title="Ver desglose de variantes"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-indigo-600" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          ) : (
                            <span className="w-4 h-4 inline-block"></span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono font-medium text-indigo-600 dark:text-indigo-400 block">
                            {p.sku}
                          </span>
                          <span className="text-[11px] text-slate-400">{p.model}</span>
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-900 dark:text-slate-100 block max-w-xs truncate" title={p.name}>
                              {p.name}
                            </span>
                            {hasVariants && (
                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-200 dark:border-indigo-800">
                                <Layers className="w-3 h-3" /> {p.variants!.length} var.
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] text-slate-500">{p.brand}</span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400">
                          {p.category?.name || 'General'}
                        </td>
                        <td className="py-3.5 px-4 text-right font-medium text-slate-900 dark:text-slate-100">
                          ${Number(p.price).toFixed(2)}
                          <span className="block text-[10px] text-slate-400">
                            Costo: ${Number(p.costPrice).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-slate-800 dark:text-slate-200 text-sm block">{p.stock}</span>
                          <span className="text-[10px] text-slate-400">Mín: {p.minStock}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {getStatusBadge(p.status, p.stock)}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <a
                              href={`https://wa.me/593998765432?text=${encodeURIComponent(`Hola TechParts, deseo consultar la compatibilidad técnica del producto: ${p.name} (SKU: ${p.sku})`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Consultar compatibilidad técnica por WhatsApp"
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950 rounded-lg transition-colors"
                            >
                              <MessageCircle className="w-4 h-4" />
                            </a>
                            <button
                              onClick={() => onOpenMovement(p)}
                              title="Registrar Movimiento de Stock"
                              className="p-1.5 text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950 rounded-lg transition-colors"
                            >
                              <ArrowLeftRight className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onEditProduct(p)}
                              title="Editar detalles"
                              className="p-1.5 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onDeleteProduct(p)}
                              title="Eliminar producto"
                              className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Desglose Expandible de Variantes */}
                      {hasVariants && isExpanded && (
                        <tr className="bg-slate-50/80 dark:bg-slate-800/30">
                          <td colSpan={8} className="py-3 px-8">
                            <div className="rounded-xl border border-indigo-100 dark:border-indigo-950/60 bg-white dark:bg-slate-900 p-3 shadow-inner">
                              <h4 className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                                <Layers className="w-3.5 h-3.5 text-indigo-600" />
                                Variaciones con Control de Stock Independiente:
                              </h4>
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                                {p.variants!.map((v) => (
                                  <div
                                    key={v.id}
                                    className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between"
                                  >
                                    <div>
                                      <div className="font-semibold text-xs text-slate-800 dark:text-slate-100 truncate">
                                        {v.name}
                                      </div>
                                      <div className="font-mono text-[10px] text-slate-400">
                                        SKU: {v.sku}
                                      </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-200/60 dark:border-slate-700 text-xs">
                                      <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                        ${Number(v.price).toFixed(2)}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-[11px] text-slate-500">
                                          Stock: <strong className="text-slate-800 dark:text-slate-200">{v.stock}</strong>
                                        </span>
                                        {getStatusBadge(v.status, v.stock)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
