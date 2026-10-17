import React from 'react';
import { ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';
import { WhatsAppButton } from './WhatsAppButton';

export const CompatibilityNotice: React.FC = () => {
  return (
    <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200/80 rounded-2xl p-4 shadow-sm mb-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-blue-600 text-white shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              Aviso Técnico de Compatibilidad TechParts
              <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                Garantía Hardware
              </span>
            </h4>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl leading-relaxed">
              Antes de adquirir componentes, verifica la compatibilidad de <strong>Socket CPU</strong> (AM5 vs LGA1700), tipo de <strong>Memoria RAM</strong> (DDR4 vs DDR5) y <strong>potencia de la Fuente de Poder</strong> recomendada para tu tarjeta gráfica.
            </p>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> Asesoría preventiva gratuita
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Horario de Atención: Lun - Vie 08:30 - 18:00 | Sáb 09:00 - 13:00
              </span>
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto">
          <WhatsAppButton />
        </div>
      </div>
    </div>
  );
};
