import React, { useState, useEffect } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Product, Category } from '../types';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (productData: any) => Promise<void>;
  product?: Product | null;
  categories: Category[];
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  categories,
}) => {
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    brand: '',
    model: '',
    categoryId: categories[0]?.id || 1,
    price: '',
    costPrice: '',
    stock: '',
    minStock: '5',
    description: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (product) {
      setFormData({
        sku: product.sku,
        name: product.name,
        brand: product.brand,
        model: product.model,
        categoryId: product.categoryId,
        price: product.price.toString(),
        costPrice: product.costPrice.toString(),
        stock: product.stock.toString(),
        minStock: product.minStock.toString(),
        description: product.description || '',
      });
    } else {
      setFormData({
        sku: '',
        name: '',
        brand: '',
        model: '',
        categoryId: categories[0]?.id || 1,
        price: '',
        costPrice: '',
        stock: '0',
        minStock: '5',
        description: '',
      });
    }
    setError(null);
  }, [product, categories, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        ...formData,
        categoryId: Number(formData.categoryId),
        price: parseFloat(formData.price),
        costPrice: parseFloat(formData.costPrice),
        stock: parseInt(formData.stock, 10),
        minStock: parseInt(formData.minStock, 10),
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al guardar producto');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={product ? 'Editar Componente' : 'Nuevo Componente Tecnológico'}
      description={product ? `Modificando especificaciones de ${product.sku}` : 'Ingresa los datos para dar de alta en inventario'}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="SKU / Código Único"
            value={formData.sku}
            disabled={!!product} // El SKU no se edita si ya existe
            onChange={(e) => setFormData({ ...formData, sku: e.target.value.toUpperCase() })}
            placeholder="Ej. CPU-AMD-7800X3D"
            required
          />

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1.5">Categoría</label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: Number(e.target.value) })}
              className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              required
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <Input
          label="Nombre del Producto"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Ej. AMD Ryzen 7 7800X3D 8-Core"
          required
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Marca"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            placeholder="Ej. AMD, Intel, NVIDIA, ASUS"
            required
          />

          <Input
            label="Modelo"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
            placeholder="Ej. Ryzen 7 7800X3D"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Precio de Venta ($ USD)"
            type="number"
            step="0.01"
            min="0"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
            placeholder="0.00"
            required
          />

          <Input
            label="Costo de Adquisición ($ USD)"
            type="number"
            step="0.01"
            min="0"
            value={formData.costPrice}
            onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
            placeholder="0.00"
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label={product ? 'Stock Actual (Para modificarlo use Movimientos)' : 'Stock Inicial'}
            type="number"
            min="0"
            disabled={!!product}
            value={formData.stock}
            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
            required
          />

          <Input
            label="Stock Mínimo (Alerta)"
            type="number"
            min="1"
            value={formData.minStock}
            onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
            required
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1.5">Descripción y Especificaciones</label>
          <textarea
            rows={3}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Detalles técnicos, compatibilidad, garantía..."
            className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {product ? 'Actualizar Producto' : 'Guardar Producto'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
