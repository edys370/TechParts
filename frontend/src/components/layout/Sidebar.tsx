import React from 'react';
import {
  Store,
  Cpu,
  Package,
  ShoppingBag,
  LayoutDashboard,
  ArrowLeftRight,
  ShieldCheck,
  Settings,
} from 'lucide-react';

export type TabType =
  | 'shop'
  | 'compatibility'
  | 'inventory'
  | 'orders'
  | 'dashboard'
  | 'movements'
  | 'policies'
  | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  lowStockCount?: number;
  ordersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  lowStockCount = 0,
  ordersCount = 0,
}) => {
  const customerNavItems = [
    {
      id: 'shop' as TabType,
      label: 'Tienda & Catálogo',
      icon: Store,
    },
    {
      id: 'compatibility' as TabType,
      label: 'Asistente de Compatibilidad',
      icon: Cpu,
    },
    {
      id: 'policies' as TabType,
      label: 'Políticas & Horarios',
      icon: ShieldCheck,
    },
  ];

  const adminNavItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard & Métricas',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory' as TabType,
      label: 'Gestión de Inventario',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'orders' as TabType,
      label: 'Pedidos y Ventas',
      icon: ShoppingBag,
      badge: ordersCount > 0 ? ordersCount : undefined,
    },
    {
      id: 'movements' as TabType,
      label: 'Movimientos ACID',
      icon: ArrowLeftRight,
    },
    {
      id: 'settings' as TabType,
      label: 'Configuración & DB',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-4">
        {/* Sección Tienda / Cliente */}
        <div className="space-y-1">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Tienda y Experiencia Cliente
          </div>
          {customerNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sección Administración / Backend */}
        <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-slate-800">
          <div className="px-3 py-1.5 text-[10px] font-bold tracking-wider text-slate-400 uppercase">
            Administración & Control
          </div>
          {adminNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 font-semibold shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl space-y-1">
        <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
          <span>TechParts 2026</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400">
            Fase 1 & 2
          </span>
        </div>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          PostgreSQL 18 + Prisma ORM + Express + React + Google Stitch
        </p>
      </div>
    </aside>
  );
};
