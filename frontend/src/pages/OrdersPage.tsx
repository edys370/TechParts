import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { orderService } from '../api/apiClient';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../components/ui/Table';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Truck,
  Building2,
  CreditCard,
  Eye,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const loadOrders = async () => {
    setIsLoading(true);
    try {
      const res = await orderService.getAll({ search });
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      console.error('Error al cargar pedidos:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [search]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'DELIVERED':
        return <Badge variant="success">Confirmado</Badge>;
      case 'PROCESSING':
        return <Badge variant="warning">En Proceso</Badge>;
      case 'SHIPPED':
        return <Badge variant="info">En Camino</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Cancelado</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getPaymentBadge = (method: string) => {
    switch (method) {
      case 'BANK_TRANSFER':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400">
            <Building2 className="w-3.5 h-3.5" /> Transferencia
          </span>
        );
      case 'CASH_ON_DELIVERY':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
            <Truck className="w-3.5 h-3.5" /> Contra Entrega
          </span>
        );
      case 'SANDBOX_CARD':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-purple-600 dark:text-purple-400">
            <CreditCard className="w-3.5 h-3.5" /> Tarjeta Sandbox
          </span>
        );
      default:
        return <span className="text-xs text-slate-500">{method}</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-indigo-600" />
            Registro de Pedidos y Ventas (Fase 2)
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Trazabilidad transaccional de órdenes, estado de pago, zonas de envío y facturación.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por orden o cliente..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button variant="secondary" size="sm" onClick={loadOrders} className="p-2">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tabla de Pedidos */}
      <Table>
        <TableHeader>
          <TableRow hoverable={false}>
            <TableHead>Número de Orden</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Zona de Envío</TableHead>
            <TableHead>Método de Pago</TableHead>
            <TableHead>Total (USD)</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Fecha</TableHead>
            <TableHead className="text-right">Acción</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <TableRow key={order.id}>
              <TableCell className="font-mono font-bold text-indigo-600 dark:text-indigo-400 text-xs">
                {order.orderNumber}
              </TableCell>
              <TableCell>
                <div className="font-medium text-slate-900 dark:text-slate-100 text-xs">
                  {order.customerName}
                </div>
                <div className="text-[11px] text-slate-400">{order.customerEmail}</div>
              </TableCell>
              <TableCell className="text-xs">
                <span className="text-slate-700 dark:text-slate-300">
                  {order.shippingZone?.name || 'Local'}
                </span>
                <div className="text-[10px] text-slate-400">
                  {order.shippingCost === '0' || Number(order.shippingCost) === 0 ? 'Envío Gratis' : `$${Number(order.shippingCost).toFixed(2)}`}
                </div>
              </TableCell>
              <TableCell>{getPaymentBadge(order.paymentMethod)}</TableCell>
              <TableCell className="font-bold text-xs text-slate-900 dark:text-slate-100">
                ${Number(order.total).toFixed(2)}
              </TableCell>
              <TableCell>{getStatusBadge(order.orderStatus)}</TableCell>
              <TableCell className="text-xs text-slate-500">
                {new Date(order.createdAt).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedOrder(order)}
                  className="p-1.5 text-xs text-indigo-600 dark:text-indigo-400"
                >
                  <Eye className="w-3.5 h-3.5 mr-1" /> Ver Detalle
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {orders.length === 0 && !isLoading && (
            <TableRow hoverable={false}>
              <TableCell colSpan={8} className="text-center py-8 text-slate-400 text-xs">
                No hay órdenes registradas. Realiza una compra desde la Tienda para probar el flujo de checkout.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Modal de Detalle de Orden */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white font-mono">
                  Detalle de Orden: {selectedOrder.orderNumber}
                </h3>
                <span className="text-xs text-slate-400">
                  Fecha: {new Date(selectedOrder.createdAt).toLocaleString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800">
                <div>
                  <span className="text-slate-400 block text-[10px]">Cliente:</span>
                  <strong className="text-slate-800 dark:text-slate-200">{selectedOrder.customerName}</strong>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Teléfono:</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedOrder.customerPhone}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-slate-400 block text-[10px]">Dirección:</span>
                  <span className="text-slate-700 dark:text-slate-300">
                    {selectedOrder.customerAddress}, {selectedOrder.customerCity}
                  </span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5 pt-2">
                <span className="font-bold text-slate-700 dark:text-slate-300 block">Artículos comprados:</span>
                <div className="divide-y divide-slate-100 dark:divide-slate-800 max-h-40 overflow-y-auto">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between items-center">
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">{item.productName}</div>
                        {item.variantName && (
                          <div className="text-[10px] text-indigo-500 font-mono">
                            Variante: {item.variantName}
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {item.quantity} x ${Number(item.unitPrice).toFixed(2)}
                        </div>
                      </div>
                      <span className="font-mono font-bold">${Number(item.total).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Desglose */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span>${Number(selectedOrder.subtotal).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Envío ({selectedOrder.shippingZone?.name || 'Zona'}):</span>
                  <span>${Number(selectedOrder.shippingCost).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IVA (15%):</span>
                  <span>${Number(selectedOrder.taxAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-indigo-600 pt-1 border-t border-slate-200 dark:border-slate-700">
                  <span>Total Liquidado:</span>
                  <span>${Number(selectedOrder.total).toFixed(2)} USD</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <Button variant="secondary" size="sm" onClick={() => setSelectedOrder(null)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
