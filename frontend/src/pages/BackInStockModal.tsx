import React, { useState } from 'react';
import { Product, ProductVariant } from '../types';
import { subscriptionService } from '../api/apiClient';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Bell, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface BackInStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  variant?: ProductVariant | null;
}

export const BackInStockModal: React.FC<BackInStockModalProps> = ({
  isOpen,
  onClose,
  product,
  variant,
}) => {
  const [email, setEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  if (!isOpen || !product) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) {
      setStatusMessage({ type: 'error', text: 'Por favor ingresa un correo electrónico válido.' });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      const res = await subscriptionService.subscribe({
        email,
        customerName: customerName || undefined,
        productId: product.id,
        variantId: variant ? variant.id : undefined,
      });

      setStatusMessage({
        type: 'success',
        text: res.message || '¡Te notificaremos automáticamente apenas reingrese stock!',
      });

      setTimeout(() => {
        onClose();
        setStatusMessage(null);
        setEmail('');
        setCustomerName('');
      }, 2200);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.response?.data?.message || 'Error al procesar tu solicitud de suscripción.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔔 Avisarme cuando haya stock" maxWidth="md">
      <div className="space-y-4">
        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-indigo-600 text-white flex-shrink-0">
            <Bell className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-indigo-950 dark:text-indigo-200 text-sm">
              {product.name}
            </h4>
            {variant && (
              <p className="text-xs text-indigo-700 dark:text-indigo-300 font-medium mt-0.5">
                Variación: {variant.name} (SKU: {variant.sku})
              </p>
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Este componente se encuentra actualmente agotado. Deja tus datos y nuestro sistema automatizado de inventario te enviará un correo en cuanto se registre un nuevo lote de ingreso.
            </p>
          </div>
        </div>

        {statusMessage && (
          <div
            className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
              statusMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-200'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-200'
            }`}
          >
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Tu Nombre (Opcional):
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Ej: Carlos Andrade"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Correo Electrónico <span className="text-rose-500">*</span>:
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="correo@ejemplo.com"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="pt-3 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
            <Button variant="secondary" size="sm" type="button" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={isLoading}
              className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {isLoading ? 'Registrando...' : 'Notificarme al Reponer'}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
