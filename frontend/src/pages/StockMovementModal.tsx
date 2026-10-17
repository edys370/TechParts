import React, { useState } from 'react';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Product, MovementType } from '../types';
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal } from 'lucide-react';

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productId: number;
    type: MovementType;
    quantity: number;
    reason?: string;
    reference?: string;
  }) => Promise<void>;
  product: Product | null;
}

export const StockMovementModal: React.FC<StockMovementModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
}) => {
  const [type, setType] = useState<MovementType>('IN');
  const [quantity, setQuantity] = useState<string>('1');
  const [reason, setReason] = useState<string>('');
  const [reference, setReference] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!product) return null;

  const currentStock = product.stock;
  const qtyNum = parseInt(quantity, 10) || 0;

  let projectedStock = currentStock;
  if (type === 'IN') {
    projectedStock = currentStock + qtyNum;
  } else if (type === 'OUT') {
    projectedStock = currentStock - qtyNum;
  } else if (type === 'ADJUSTMENT') {
    projectedStock = qtyNum;
  }

  const isInvalidOut = type === 'OUT' && qtyNum > currentStock;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (qtyNum <= 0) {
      setError('La cantidad debe ser mayor a 0');
      return;
    }
    if (isInvalidOut) {
      setError(`Stock insuficiente. Máximo disponible a despachar: ${currentStock}`);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await onSubmit({
        productId: product.id,
        type,
        quantity: qtyNum,
        reason: reason.trim() || undefined,
        reference: reference.trim() || undefined,
      });
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err.message || 'Error al procesar movimiento');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Registrar Movimiento de Inventario"
      description={`Operación transaccional ACID para: ${product.name} (${product.sku})`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-lg">
            {error}
          </div>
        )}

        {/* Selector de Tipo de Movimiento */}
        <div>
          <label className="block text-xs font-medium text-slate-700 mb-2">Tipo de Transacción</label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setType('IN')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                type === 'IN'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-700 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-600" />
              Ingreso (IN)
            </button>

            <button
              type="button"
              onClick={() => setType('OUT')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                type === 'OUT'
                  ? 'bg-rose-50 border-rose-500 text-rose-700 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <ArrowDownRight className="w-4 h-4 text-rose-600" />
              Salida (OUT)
            </button>

            <button
              type="button"
              onClick={() => setType('ADJUSTMENT')}
              className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg text-xs font-medium border transition-all ${
                type === 'ADJUSTMENT'
                  ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-sm'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4 text-blue-600" />
              Ajuste
            </button>
          </div>
        </div>

        {/* Resumen de Stock proyectado */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-500 block">Stock Actual</span>
            <span className="text-sm font-semibold text-slate-800">{currentStock} unidades</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block">Stock Resultante</span>
            <span
              className={`text-sm font-bold ${
                projectedStock < 0
                  ? 'text-rose-600'
                  : projectedStock <= product.minStock
                  ? 'text-amber-600'
                  : 'text-emerald-600'
              }`}
            >
              {projectedStock} unidades
            </span>
          </div>
        </div>

        <Input
          label={type === 'ADJUSTMENT' ? 'Nuevo Stock Total Absoluto' : 'Cantidad a Mover'}
          type="number"
          min="1"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />

        <Input
          label="Referencia Documental"
          placeholder="Ej. Factura #4921, OC-882, Ticket soporte..."
          value={reference}
          onChange={(e) => setReference(e.target.value)}
        />

        <Input
          label="Motivo o Justificación"
          placeholder="Ej. Recepción proveedor mayorista / Despacho a cliente"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant={type === 'OUT' ? 'danger' : 'primary'}
            isLoading={isLoading}
            disabled={isInvalidOut}
          >
            Confirmar Transacción
          </Button>
        </div>
      </form>
    </Modal>
  );
};
