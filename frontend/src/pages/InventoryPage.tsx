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
  SlidersHorizontal,
  Package,
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
          <h2 className="text-xl font-bold text-slate-900">Catálogo de Inventario</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Administración de componentes, existencias y precios
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
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
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
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-stitch overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">SKU / Modelo</th>
                <th className="py-3 px-4">Producto & Marca</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4 text-right">Precio Venta</th>
                <th className="py-3 px-4 text-center">Stock</th>
                <th className="py-3 px-4 text-center">Estado</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Cargando componentes desde PostgreSQL...
                  </td>
                </tr>
              ) : filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No se encontraron productos que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-medium text-blue-600 block">{p.sku}</span>
                      <span className="text-[11px] text-slate-400">{p.model}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block max-w-xs truncate" title={p.name}>
                        {p.name}
                      </span>
                      <span className="text-[11px] text-slate-500">{p.brand}</span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600">
                      {p.category?.name || 'General'}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-900">
                      ${Number(p.price).toFixed(2)}
                      <span className="block text-[10px] text-slate-400">
                        Costo: ${Number(p.costPrice).toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold text-slate-800 text-sm block">{p.stock}</span>
                      <span className="text-[10px] text-slate-400">Mín: {p.minStock}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {getStatusBadge(p.status, p.stock)}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => onOpenMovement(p)}
                          title="Registrar Movimiento de Stock"
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <ArrowLeftRight className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onEditProduct(p)}
                          title="Editar detalles"
                          className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onDeleteProduct(p)}
                          title="Eliminar producto"
                          className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
