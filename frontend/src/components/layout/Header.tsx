import React from 'react';
import { Cpu, Database, RefreshCw, ShoppingCart, MessageCircle } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  apiStatus: 'connected' | 'connecting' | 'disconnected';
  onRefresh: () => void;
  isRefreshing?: boolean;
  cartCount?: number;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  apiStatus,
  onRefresh,
  isRefreshing = false,
  cartCount = 0,
  onOpenCart,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-4 sm:px-6 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow-md shadow-indigo-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base font-black text-slate-900 dark:text-white leading-none">TechParts</h1>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
              PRO
            </span>
          </div>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Hardware Store & Control de Inventario
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3 sm:gap-4">
        {/* Enlace WhatsApp Directo en Cabecera (Requisito Proyecto.md: cabecera/pie) */}
        <a
          href="https://wa.me/593998765432?text=Hola%20TechParts,%20deseo%20consultar%20sobre%20compatibilidad%20de%20piezas"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold hover:bg-emerald-100 transition-colors"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Atención WhatsApp</span>
        </a>

        {/* Botón Carrito de Compras */}
        <button
          type="button"
          onClick={onOpenCart}
          className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-700 dark:text-slate-200 transition-colors"
          title="Ver Carrito de Compras / Checkout"
        >
          <ShoppingCart className="w-5 h-5" />
          {cartCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center shadow-md animate-scale">
              {cartCount}
            </span>
          )}
        </button>

        {/* Indicador de estado de la base de datos */}
        <div className="flex items-center gap-1.5 text-xs">
          <Database className="w-4 h-4 text-slate-400 hidden sm:inline" />
          {apiStatus === 'connected' ? (
            <Badge variant="success" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1 animate-pulse"></span>
              PostgreSQL Conectado
            </Badge>
          ) : apiStatus === 'connecting' ? (
            <Badge variant="warning" size="sm">
              Conectando...
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              Sin Conexión
            </Badge>
          )}
        </div>

        {/* Botón de refresco manual */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Recargar datos de la tienda"
          className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
