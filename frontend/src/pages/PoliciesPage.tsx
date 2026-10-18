import React from 'react';
import {
  Truck,
  RotateCcw,
  ShieldCheck,
  Clock,
  Phone,
  Mail,
  MapPin,
  Building2,
  CheckCircle2,
  FileCheck,
} from 'lucide-react';

export const PoliciesPage: React.FC = () => {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Encabezado */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm text-center">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white">
          Políticas Comerciales, Garantías y Contacto Oficial
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl mx-auto">
          En <strong>TechParts Ecuador</strong> garantizamos transparencia operativa en envíos geográficos, control de inventario de componentes y respaldo técnico integral.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Políticas de Envío */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-bold text-sm">
            <Truck className="w-5 h-5" />
            <h3>Políticas de Despacho y Zonas de Envío</h3>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <strong>Zona Local (Quito Metropolitano y Valles):</strong> Tarifa base de $3.50 USD. Despachos en motorizado directo en un plazo máximo de 24 horas laborables.
            </p>
            <p>
              • <strong>Zona Regional / Costa (Guayas, Manabí, Azuay):</strong> Tarifa de $5.50 USD. Envíos asegurados vía courier express con tiempo estimado de entrega de 24 a 48 horas.
            </p>
            <p>
              • <strong>Zona Nacional (Resto del País y Galápagos):</strong> Tarifa de $8.50 USD. Cobertura puerta a puerta con número de seguimiento y tiempo estimado de 48 a 72 horas.
            </p>
            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 font-medium">
              🎁 <strong>Envío Gratis:</strong> En compras acumuladas iguales o superiores a <strong>$500.00 USD</strong> el costo de despacho es 100% gratuito a cualquier parte del territorio continental.
            </div>
          </div>
        </div>

        {/* Políticas de Devolución y Garantía */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-bold text-sm">
            <RotateCcw className="w-5 h-5" />
            <h3>Garantía Técnica y Devoluciones</h3>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <p>
              • <strong>Plazo de Devolución:</strong> Tienes hasta <strong>30 días calendario</strong> desde la recepción del producto para solicitar devolución o cambio por incompatibilidad o disconformidad.
            </p>
            <p>
              • <strong>Condiciones del Componente:</strong> La pieza no debe presentar pines doblados, marcas de sobrevoltaje ni manipulación indebida. Debe incluir empaques originales, sellos y accesorios.
            </p>
            <p>
              • <strong>Diagnóstico de Laboratorio:</strong> Todo reclamo por fallo técnico pasa por el banco de pruebas de TechParts en un tiempo máximo de 48 horas hábiles para reemplazo inmediato.
            </p>
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800 text-purple-800 dark:text-purple-300 font-medium">
              🛡️ <strong>Garantía de Fábrica:</strong> Todos los procesadores, tarjetas gráficas y fuentes de poder cuentan con 12 a 36 meses de garantía oficial del fabricante.
            </div>
          </div>
        </div>

        {/* Horarios de Atención al Cliente (Obligatorio en Proyecto.md) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
            <Clock className="w-5 h-5" />
            <h3>Horario de Atención Técnica al Cliente</h3>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-1.5 font-mono">
              <div className="flex justify-between">
                <span>Lunes a Viernes:</span>
                <strong>08:30 AM - 18:30 PM (Continuo)</strong>
              </div>
              <div className="flex justify-between">
                <span>Sábados:</span>
                <strong>09:00 AM - 14:00 PM</strong>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Domingos y Feriados:</span>
                <span>Guardia técnica remota vía WhatsApp</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400">
              Nuestro equipo técnico atiende consultas previas sobre compatibilidad de sockets, memorias RAM y fuentes en tiempo real durante todo el horario laboral.
            </p>
          </div>
        </div>

        {/* Información Corporativa y Contacto */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-bold text-sm">
            <Building2 className="w-5 h-5" />
            <h3>Información Legal y Contacto Directo</h3>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-300 space-y-2">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Razón Social:</strong> TechParts Ecuador S.A.S.</span>
            </div>
            <div className="flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>R.U.C.:</strong> 1793204918001</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Sede Principal:</strong> Av. República de El Salvador 1084 y Moscú, Quito, Ecuador</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>WhatsApp Técnico:</strong> +593 99 876 5432</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span><strong>Correo de Soporte:</strong> soporte@techparts.com</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
