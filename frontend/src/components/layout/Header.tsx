import React from 'react';
import { Cpu, Database, RefreshCw } from 'lucide-react';
import { Badge } from '../ui/Badge';

interface HeaderProps {
  apiStatus: 'connected' | 'connecting' | 'disconnected';
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ apiStatus, onRefresh, isRefreshing = false }) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between h-16 px-6 bg-white/95 backdrop-blur border-b border-slate-200/80 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
          <Cpu className="w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-slate-900 leading-none">TechParts</h1>
          <span className="text-xs text-slate-500">Sistema de Inventario & Catálogo</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Indicador de estado de la base de datos */}
        <div className="flex items-center gap-2 text-xs">
          <Database className="w-4 h-4 text-slate-400" />
          <span className="text-slate-600 hidden sm:inline">PostgreSQL:</span>
          {apiStatus === 'connected' ? (
            <Badge variant="success" size="sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5 animate-pulse"></span>
              Conectado
            </Badge>
          ) : apiStatus === 'connecting' ? (
            <Badge variant="warning" size="sm">
              Conectando...
            </Badge>
          ) : (
            <Badge variant="danger" size="sm">
              Desconectado
            </Badge>
          )}
        </div>

        {/* Botón de refresco manual */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Recargar datos"
          className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        </button>
      </div>
    </header>
  );
};
