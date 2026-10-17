import React from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { DashboardMetrics, Product } from '../types';
import {
  Package,
  AlertTriangle,
  Boxes,
  DollarSign,
  TrendingUp,
  ArrowRight,
  PlusCircle,
  ArrowLeftRight,
} from 'lucide-react';

interface DashboardPageProps {
  metrics: DashboardMetrics | null;
  lowStockAlerts: Product[];
  onOpenNewProduct: () => void;
  onGoToInventory: () => void;
  onOpenMovement: (product: Product) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  metrics,
  lowStockAlerts,
  onOpenNewProduct,
  onGoToInventory,
  onOpenMovement,
}) => {
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(val || 0);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Barra superior de bienvenida y acciones rápidas */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Panel de Control de Inventario</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Métricas clave, salud del stock y estado del catálogo TechParts
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={onGoToInventory}>
            Ver Catálogo
          </Button>
          <Button variant="primary" size="sm" onClick={onOpenNewProduct}>
            <PlusCircle className="w-4 h-4 mr-1.5" />
            Nuevo Componente
          </Button>
        </div>
      </div>

      {/* Grid de KPIs / Métricas principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="flex items-center gap-4 !p-5">
          <div className="p-3 rounded-xl bg-blue-50 text-blue-600">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Catálogo de SKUs</p>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalProducts ?? 0}</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Modelos registrados</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 !p-5">
          <div className="p-3 rounded-xl bg-emerald-50 text-emerald-600">
            <Boxes className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Unidades en Almacén</p>
            <p className="text-2xl font-bold text-slate-900">{metrics?.totalStockItems ?? 0}</p>
            <p className="text-[11px] text-emerald-600 font-medium mt-0.5">Stock físico disponible</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 !p-5">
          <div className="p-3 rounded-xl bg-amber-50 text-amber-600">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Alertas de Stock</p>
            <p className="text-2xl font-bold text-slate-900">
              {(metrics?.lowStockProducts ?? 0) + (metrics?.outOfStockProducts ?? 0)}
            </p>
            <p className="text-[11px] text-amber-600 font-medium mt-0.5">
              {metrics?.outOfStockProducts ?? 0} agotados / {metrics?.lowStockProducts ?? 0} bajos
            </p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 !p-5">
          <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500">Valoración Estimada</p>
            <p className="text-2xl font-bold text-slate-900">
              {formatCurrency(metrics?.totalRetailValuation ?? 0)}
            </p>
            <p className="text-[11px] text-indigo-600 font-medium mt-0.5 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Costo: {formatCurrency(metrics?.totalCostValuation ?? 0)}
            </p>
          </div>
        </Card>
      </div>

      {/* Sección de Alertas Críticas de Stock */}
      <Card
        title="Alertas de Reabastecimiento Crítico"
        subtitle="Componentes tecnológicos por debajo del umbral mínimo de seguridad"
        action={
          <Button variant="ghost" size="sm" onClick={onGoToInventory}>
            Ver todos <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        }
      >
        {lowStockAlerts.length === 0 ? (
          <div className="py-8 text-center text-slate-500 text-sm">
            🎉 Todos los componentes cuentan con niveles óptimos de stock.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {lowStockAlerts.slice(0, 5).map((prod) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-slate-900 truncate">{prod.name}</span>
                    <Badge variant={prod.stock === 0 ? 'danger' : 'warning'} size="sm">
                      {prod.stock === 0 ? 'Agotado' : 'Stock Bajo'}
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    SKU: <span className="font-mono text-slate-700">{prod.sku}</span> • Marca:{' '}
                    {prod.brand} • Mínimo sugerido: {prod.minStock}
                  </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <div className="text-right">
                    <span className="text-xs text-slate-400 block">Actual</span>
                    <span
                      className={`text-sm font-bold ${
                        prod.stock === 0 ? 'text-rose-600' : 'text-amber-600'
                      }`}
                    >
                      {prod.stock} uds.
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenMovement(prod)}
                    className="hidden sm:inline-flex text-xs"
                  >
                    <ArrowLeftRight className="w-3.5 h-3.5 mr-1" />
                    Reabastecer
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
