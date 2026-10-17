import React from 'react';
import { LayoutDashboard, Package, ArrowLeftRight, Settings } from 'lucide-react';

export type TabType = 'dashboard' | 'inventory' | 'movements' | 'settings';

interface SidebarProps {
  currentTab: TabType;
  onTabChange: (tab: TabType) => void;
  lowStockCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onTabChange, lowStockCount = 0 }) => {
  const navItems = [
    {
      id: 'dashboard' as TabType,
      label: 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'inventory' as TabType,
      label: 'Inventario',
      icon: Package,
      badge: lowStockCount > 0 ? lowStockCount : undefined,
    },
    {
      id: 'movements' as TabType,
      label: 'Movimientos (ACID)',
      icon: ArrowLeftRight,
    },
    {
      id: 'settings' as TabType,
      label: 'Configuración / DB',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-64 bg-white border-r border-slate-200/80 p-4 flex flex-col justify-between hidden md:flex min-h-[calc(100vh-4rem)]">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navegación
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-700 shadow-sm font-semibold'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge !== undefined && (
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-700">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
        <p className="text-xs font-medium text-slate-700">TechParts Stack</p>
        <p className="text-[11px] text-slate-500 mt-0.5">React + Node.js + Postgres + Stitch</p>
      </div>
    </aside>
  );
};
