import React, { useState, useEffect } from 'react';
import { CartItem, ShippingZone, Order } from '../types';
import { orderService } from '../api/apiClient';
import { Modal } from '../components/ui/Modal';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import {
  ShoppingCart,
  Trash2,
  Truck,
  CreditCard,
  Building2,
  CheckCircle2,
  AlertCircle,
  MessageCircle,
  FileText,
  ShieldCheck,
  Plus,
  Minus,
} from 'lucide-react';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (index: number, quantity: number) => void;
  onRemoveItem: (index: number) => void;
  onClearCart: () => void;
  onOrderSuccess: (order: Order) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onOrderSuccess,
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [shippingZones, setShippingZones] = useState<ShippingZone[]>([]);
  const [selectedZoneId, setSelectedZoneId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'SANDBOX_CARD'>('BANK_TRANSFER');

  // Datos del Cliente
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerCedula, setCustomerCedula] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerCity, setCustomerCity] = useState('Quito, Pichincha');
  const [notes, setNotes] = useState('');

  // Sandbox Card State
  const [cardNumber, setCardNumber] = useState('4532 •••• •••• 8821');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  // Cargar Zonas de Envío
  useEffect(() => {
    if (isOpen) {
      orderService.getShippingZones().then((res) => {
        if (res.data && res.data.length > 0) {
          setShippingZones(res.data);
          setSelectedZoneId(res.data[0].id);
        }
      });
      setStep('cart');
      setErrorMessage(null);
    }
  }, [isOpen]);

  // Cálculos de Precios
  const subtotal = cart.reduce((sum, item) => {
    const price = item.selectedVariant ? Number(item.selectedVariant.price) : Number(item.product.price);
    return sum + price * item.quantity;
  }, 0);

  const selectedZone = shippingZones.find((z) => z.id === selectedZoneId);
  let shippingCost = selectedZone ? Number(selectedZone.cost) : 0;
  const isFreeShipping = selectedZone?.freeThreshold ? subtotal >= Number(selectedZone.freeThreshold) : false;
  if (isFreeShipping) {
    shippingCost = 0;
  }

  const taxRate = 0.15; // 15% IVA Ecuador
  const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
  const total = Math.round((subtotal + shippingCost + taxAmount) * 100) / 100;

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!selectedZoneId) {
      setErrorMessage('Por favor selecciona una zona de envío.');
      return;
    }

    if (!customerName || !customerEmail || !customerPhone || !customerAddress) {
      setErrorMessage('Por favor completa todos los campos obligatorios del cliente.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        customerCity,
        customerCedula,
        shippingZoneId: selectedZoneId,
        paymentMethod,
        notes,
        items: cart.map((item) => ({
          productId: item.product.id,
          variantId: item.selectedVariant ? item.selectedVariant.id : undefined,
          quantity: item.quantity,
        })),
      };

      const res = await orderService.create(payload);
      setCompletedOrder(res.data);
      setStep('success');
      onClearCart();
      onOrderSuccess(res.data);
    } catch (err: any) {
      setErrorMessage(err?.response?.data?.message || 'Error al procesar el pedido. Revisa el stock disponible.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'cart'
          ? `Carrito de Compras (${cart.length} productos)`
          : step === 'checkout'
          ? 'Finalizar Compra - Datos de Facturación y Entrega'
          : '¡Pedido Confirmado con Éxito!'
      }
      maxWidth="xl"
    >
      <div className="space-y-4">
        {errorMessage && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* PASO 1: VISTA DE CARRITO */}
        {step === 'cart' && (
          <div className="space-y-4">
            {cart.length === 0 ? (
              <div className="text-center py-12 text-slate-400">
                <ShoppingCart className="w-12 h-12 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-semibold">Tu carrito de compras está vacío</p>
                <p className="text-xs mt-1">Explora el catálogo y añade componentes de tu interés.</p>
                <Button variant="primary" size="sm" className="mt-4" onClick={onClose}>
                  Ver Catálogo
                </Button>
              </div>
            ) : (
              <>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-80 overflow-y-auto pr-1">
                  {cart.map((item, idx) => {
                    const price = item.selectedVariant
                      ? Number(item.selectedVariant.price)
                      : Number(item.product.price);
                    const itemTotal = price * item.quantity;
                    const stock = item.selectedVariant
                      ? item.selectedVariant.stock
                      : item.product.stock;

                    return (
                      <div key={idx} className="py-3 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-12 h-12 rounded-lg bg-indigo-50 dark:bg-slate-800 flex items-center justify-center text-indigo-500 font-bold text-xs">
                              TP
                            </div>
                          )}
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                              {item.product.name}
                            </h4>
                            {item.selectedVariant && (
                              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 font-medium mt-0.5">
                                Variante: {item.selectedVariant.name}
                              </span>
                            )}
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              ${price.toFixed(2)} c/u • Disponible: {stock}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 shrink-0">
                          {/* Controles de Cantidad */}
                          <div className="flex items-center border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-800">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, Math.max(1, item.quantity - 1))}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2.5 text-xs font-bold text-slate-800 dark:text-slate-200">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(idx, Math.min(stock, item.quantity + 1))}
                              className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>

                          <div className="text-right min-w-[70px]">
                            <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                              ${itemTotal.toFixed(2)}
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => onRemoveItem(idx)}
                            className="p-1.5 text-slate-400 hover:text-rose-500 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Subtotal del Carrito */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Subtotal de artículos:</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Impuestos estimados (15% IVA Ecuador):</span>
                    <span>${taxAmount.toFixed(2)}</span>
                  </div>
                  {subtotal >= 500 && (
                    <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5" /> ¡Calificas para Envío Gratis a nivel nacional!
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2">
                  <Button variant="secondary" size="sm" onClick={onClose}>
                    Seguir Comprando
                  </Button>
                  <Button
                    variant="primary"
                    onClick={() => setStep('checkout')}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
                  >
                    <span>Proceder al Checkout</span>
                    <ShieldCheck className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}
          </div>
        )}

        {/* PASO 2: FORMULARIO DE CHECKOUT */}
        {step === 'checkout' && (
          <form onSubmit={handleSubmitOrder} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Información del Cliente */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-indigo-500" />
                  1. Datos de Contacto y Facturación
                </h3>
                <Input
                  label="Nombre y Apellido *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Ej. Juan Pérez"
                  required
                />
                <Input
                  label="Correo Electrónico (Para recibir Factura) *"
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="ejemplo@correo.com"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <Input
                    label="Teléfono / WhatsApp *"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+593 99..."
                    required
                  />
                  <Input
                    label="Cédula o RUC"
                    value={customerCedula}
                    onChange={(e) => setCustomerCedula(e.target.value)}
                    placeholder="17..."
                  />
                </div>
                <Input
                  label="Dirección de Entrega Completa *"
                  value={customerAddress}
                  onChange={(e) => setCustomerAddress(e.target.value)}
                  placeholder="Calle principal, número de casa, intersección"
                  required
                />
                <Input
                  label="Ciudad y Provincia *"
                  value={customerCity}
                  onChange={(e) => setCustomerCity(e.target.value)}
                  placeholder="Quito, Pichincha"
                  required
                />
              </div>

              {/* Zona de Envío y Forma de Pago */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <Truck className="w-4 h-4 text-indigo-500" />
                  2. Zona de Envío Geográfica (Fase 2)
                </h3>
                <div className="space-y-2">
                  {shippingZones.map((zone) => {
                    const isSelected = selectedZoneId === zone.id;
                    const isFree = zone.freeThreshold && subtotal >= Number(zone.freeThreshold);
                    const costDisplay = isFree ? 'GRATIS' : `$${Number(zone.cost).toFixed(2)}`;

                    return (
                      <label
                        key={zone.id}
                        onClick={() => setSelectedZoneId(zone.id)}
                        className={`flex items-start justify-between p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                            : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                            <span>{zone.name}</span>
                            {isFree && <Badge variant="success" size="sm">Envío Gratis</Badge>}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            {zone.description} • Tiempo estimado: {zone.estimatedDays}
                          </div>
                        </div>
                        <span className={`font-mono font-bold ${isFree ? 'text-emerald-600' : 'text-slate-800 dark:text-slate-100'}`}>
                          {costDisplay}
                        </span>
                      </label>
                    );
                  })}
                </div>

                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5 pt-2">
                  <CreditCard className="w-4 h-4 text-indigo-500" />
                  3. Forma de Pago (Mínimo 2 Formas Requeridas)
                </h3>
                <div className="space-y-2">
                  {/* Opción 1: Transferencia Bancaria */}
                  <label
                    onClick={() => setPaymentMethod('BANK_TRANSFER')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'BANK_TRANSFER'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-indigo-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Transferencia Bancaria Directa
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Transfiere desde Banco Pichincha o Produbanco. Los datos de la cuenta se mostrarán al confirmar.
                      </p>
                    </div>
                  </label>

                  {/* Opción 2: Pago Contra Entrega */}
                  <label
                    onClick={() => setPaymentMethod('CASH_ON_DELIVERY')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <Truck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Pago Contra Entrega (Efectivo / Datáfono)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Paga al repartidor al momento de recibir tus componentes en tu domicilio u oficina.
                      </p>
                    </div>
                  </label>

                  {/* Opción 3: Sandbox Card */}
                  <label
                    onClick={() => setPaymentMethod('SANDBOX_CARD')}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                      paymentMethod === 'SANDBOX_CARD'
                        ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500'
                        : 'border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <CreditCard className="w-4 h-4 text-purple-600 mt-0.5 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200">
                        Pasarela Digital Sandbox (Tarjeta de Prueba)
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Simula un pago instantáneo con tarjeta de crédito o débito con confirmación inmediata.
                      </p>
                    </div>
                  </label>
                </div>
              </div>
            </div>

            {/* Resumen Final de Costos */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2 mt-4">
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Subtotal de Productos:</span>
                <span className="font-semibold">${subtotal.toFixed(2)} USD</span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>Tarifa de Envío ({selectedZone?.name || 'Zona'}):</span>
                <span className="font-semibold">
                  {shippingCost === 0 ? 'GRATIS ($0.00)' : `$${shippingCost.toFixed(2)} USD`}
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300">
                <span>IVA (15%):</span>
                <span className="font-semibold">${taxAmount.toFixed(2)} USD</span>
              </div>
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700 flex justify-between text-sm font-extrabold text-indigo-600 dark:text-indigo-400">
                <span>Total a Pagar:</span>
                <span className="text-lg">${total.toFixed(2)} USD</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="button" variant="secondary" onClick={() => setStep('cart')} disabled={isSubmitting}>
                Volver al Carrito
              </Button>
              <Button
                type="submit"
                variant="primary"
                disabled={isSubmitting}
                className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2"
              >
                {isSubmitting ? 'Procesando...' : `Confirmar y Pagar $${total.toFixed(2)} USD`}
              </Button>
            </div>
          </form>
        )}

        {/* PASO 3: CONFIRMACIÓN DE PEDIDO Y FACTURA */}
        {step === 'success' && completedOrder && (
          <div className="space-y-4 text-center py-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                ¡Tu pedido ha sido registrado con éxito!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Hemos enviado un correo con la factura digital a <strong className="text-slate-700 dark:text-slate-200">{completedOrder.customerEmail}</strong>.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between border-b pb-2 border-slate-200 dark:border-slate-700 font-mono font-bold text-indigo-600">
                <span>Número de Orden:</span>
                <span>{completedOrder.orderNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Cliente:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">{completedOrder.customerName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Método de Pago:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {completedOrder.paymentMethod === 'BANK_TRANSFER'
                    ? 'Transferencia Bancaria'
                    : completedOrder.paymentMethod === 'CASH_ON_DELIVERY'
                    ? 'Pago Contra Entrega'
                    : 'Tarjeta Sandbox'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Liquidado:</span>
                <span className="font-bold text-base text-emerald-600">${Number(completedOrder.total).toFixed(2)} USD</span>
              </div>
            </div>

            {/* Instrucciones si seleccionó Transferencia Bancaria */}
            {completedOrder.paymentMethod === 'BANK_TRANSFER' && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-left text-xs space-y-1.5 text-amber-800 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1.5 text-amber-900 dark:text-amber-200">
                  <Building2 className="w-4 h-4" /> Datos para la Transferencia Bancaria:
                </div>
                <div>• <strong>Banco:</strong> Banco Pichincha (Cuenta Corriente)</div>
                <div>• <strong>Número de Cuenta:</strong> 2100845920</div>
                <div>• <strong>Titular:</strong> TechParts Ecuador S.A.S.</div>
                <div>• <strong>RUC:</strong> 1793204918001</div>
                <div>• <strong>Referencia:</strong> {completedOrder.orderNumber}</div>
                <div className="text-[11px] pt-1 opacity-90">
                  Envía el comprobante a <strong>pagos@techparts.com</strong> o mediante nuestro WhatsApp oficial.
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
              <a
                href={`https://wa.me/593998765432?text=${encodeURIComponent(
                  `Hola TechParts, acabo de registrar el pedido ${completedOrder.orderNumber} por un valor de $${Number(completedOrder.total).toFixed(2)} USD. Deseo coordinar la entrega.`
                )}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md transition-colors"
              >
                <MessageCircle className="w-4 h-4" />
                Contactar por WhatsApp sobre mi Pedido
              </a>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cerrar y Continuar
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
