import React, { useState } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { InventoryTransaction, MovementType } from '../types';
import { ArrowDownRight, ArrowUpRight, SlidersHorizontal, History } from 'lucide-react';

interface MovementsPageProps {
  movements: InventoryTransaction[];
  isLoading: boolean;
}

export const MovementsPage: React.FC<MovementsPageProps> = ({ movements, isLoading }) => {
  const [filterType, setFilterType] = useState<string>('all');

  const filteredMovements = movements.filter((m) => {
    return filterType === 'all' || m.type === filterType;
  });

  const getTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'IN':
        return (
          <Badge variant="success" size="sm">
            <ArrowUpRight className="w-3 h-3 mr-1" /> Ingreso
          </Badge>
        );
      case 'OUT':
        return (
          <Badge variant="danger" size="sm">
            <ArrowDownRight className="w-3 h-3 mr-1" /> Salida
          </Badge>
        );
      case 'ADJUSTMENT':
        return (
          <Badge variant="info" size="sm">
            <SlidersHorizontal className="w-3 h-3 mr-1" /> Ajuste
          </Badge>
        );
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const formatDate = (isoString: string) => {
    const d = new Date(isoString);
    return d.toLocaleString('es-ES', {
      dateStyle: 'short',
      timeStyle: 'medium',
    });
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Libro de Movimientos Transaccionales (ACID)</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Registro inmutable de auditoría para ingresos, salidas y ajustes de stock
          </p>
        </div>

        {/* Filtros de Tipo */}
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterType === 'all' ? 'bg-white shadow-sm text-slate-900 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos
          </button>
          <button
            onClick={() => setFilterType('IN')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterType === 'IN' ? 'bg-white shadow-sm text-emerald-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ingresos
          </button>
          <button
            onClick={() => setFilterType('OUT')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterType === 'OUT' ? 'bg-white shadow-sm text-rose-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Salidas
          </button>
          <button
            onClick={() => setFilterType('ADJUSTMENT')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
              filterType === 'ADJUSTMENT' ? 'bg-white shadow-sm text-blue-700 font-semibold' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ajustes
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-stitch overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Tipo</th>
                <th className="py-3 px-4">Componente (SKU)</th>
                <th className="py-3 px-4 text-center">Cantidad</th>
                <th className="py-3 px-4 text-center">Stock Anterior → Nuevo</th>
                <th className="py-3 px-4">Referencia</th>
                <th className="py-3 px-4">Motivo / Auditoría</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Cargando historial de transacciones...
                  </td>
                </tr>
              ) : filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    No hay transacciones registradas aún.
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                      {formatDate(m.createdAt)}
                    </td>
                    <td className="py-3.5 px-4">{getTypeBadge(m.type)}</td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-slate-900 block">
                        {m.product?.name || `Producto #${m.productId}`}
                      </span>
                      <span className="font-mono text-[11px] text-blue-600">{m.product?.sku}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold text-sm ${
                          m.type === 'IN'
                            ? 'text-emerald-600'
                            : m.type === 'OUT'
                            ? 'text-rose-600'
                            : 'text-blue-600'
                        }`}
                      >
                        {m.type === 'IN' ? `+${m.quantity}` : m.type === 'OUT' ? `-${m.quantity}` : m.quantity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono">
                      <span className="text-slate-400">{m.previousStock}</span>
                      <span className="mx-1.5 text-slate-300">→</span>
                      <span className="font-semibold text-slate-800">{m.newStock}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-mono text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                        {m.reference || 'N/A'}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs truncate" title={m.reason || undefined}>
                      {m.reason || 'Sin observación'}
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
