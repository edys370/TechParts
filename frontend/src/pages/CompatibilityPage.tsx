import React, { useState, useEffect } from 'react';
import { Product, ProductVariant, CompatibilityResult } from '../types';
import { compatibilityService } from '../api/apiClient';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  Cpu,
  Layers,
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Sparkles,
  RefreshCw,
  ShoppingCart,
  MessageCircle,
} from 'lucide-react';

interface CompatibilityPageProps {
  products: Product[];
  initialSelectedProduct?: Product | null;
  onAddToCart: (product: Product, variant?: ProductVariant, quantity?: number) => void;
}

export const CompatibilityPage: React.FC<CompatibilityPageProps> = ({
  products,
  initialSelectedProduct,
  onAddToCart,
}) => {
  // Slots de selección de hardware
  const [selectedCpu, setSelectedCpu] = useState<Product | null>(null);
  const [selectedMotherboard, setSelectedMotherboard] = useState<Product | null>(null);
  const [selectedGpu, setSelectedGpu] = useState<Product | null>(null);
  const [selectedRam, setSelectedRam] = useState<Product | null>(null);
  const [selectedPsu, setSelectedPsu] = useState<Product | null>(null);

  const [result, setResult] = useState<CompatibilityResult | null>(null);
  const [isChecking, setIsChecking] = useState(false);

  // Clasificar componentes por categoría
  const cpus = products.filter((p) => p.category?.name.toLowerCase().includes('procesador'));
  const motherboards = products.filter((p) => p.category?.name.toLowerCase().includes('placa'));
  const gpus = products.filter((p) => p.category?.name.toLowerCase().includes('tarjeta') || p.category?.name.toLowerCase().includes('gráfica'));
  const rams = products.filter((p) => p.category?.name.toLowerCase().includes('ram') || p.category?.name.toLowerCase().includes('memoria'));
  const psus = products.filter((p) => p.category?.name.toLowerCase().includes('fuente') || p.category?.name.toLowerCase().includes('poder'));

  // Cargar selección inicial si se pasó una pieza
  useEffect(() => {
    if (initialSelectedProduct) {
      const cat = initialSelectedProduct.category?.name.toLowerCase() || '';
      if (cat.includes('procesador')) setSelectedCpu(initialSelectedProduct);
      else if (cat.includes('placa')) setSelectedMotherboard(initialSelectedProduct);
      else if (cat.includes('tarjeta') || cat.includes('gráfica')) setSelectedGpu(initialSelectedProduct);
      else if (cat.includes('ram') || cat.includes('memoria')) setSelectedRam(initialSelectedProduct);
      else if (cat.includes('fuente') || cat.includes('poder')) setSelectedPsu(initialSelectedProduct);
    }
  }, [initialSelectedProduct]);

  // Verificar compatibilidad
  const runCheck = async () => {
    const selectedIds: number[] = [];
    if (selectedCpu) selectedIds.push(selectedCpu.id);
    if (selectedMotherboard) selectedIds.push(selectedMotherboard.id);
    if (selectedGpu) selectedIds.push(selectedGpu.id);
    if (selectedRam) selectedIds.push(selectedRam.id);
    if (selectedPsu) selectedIds.push(selectedPsu.id);

    if (selectedIds.length === 0) {
      setResult(null);
      return;
    }

    setIsChecking(true);
    try {
      const response = await compatibilityService.check(selectedIds);
      setResult(response.data);
    } catch (err) {
      console.error('Error al verificar compatibilidad:', err);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    runCheck();
  }, [selectedCpu, selectedMotherboard, selectedGpu, selectedRam, selectedPsu]);

  const handleClearAll = () => {
    setSelectedCpu(null);
    setSelectedMotherboard(null);
    setSelectedGpu(null);
    setSelectedRam(null);
    setSelectedPsu(null);
    setResult(null);
  };

  const handleAddAllToCart = () => {
    const items = [selectedCpu, selectedMotherboard, selectedGpu, selectedRam, selectedPsu].filter(Boolean) as Product[];
    for (const item of items) {
      onAddToCart(item, undefined, 1);
    }
    alert(`Se agregaron ${items.length} componentes del ensamble al carrito de compras.`);
  };

  return (
    <div className="space-y-6">
      {/* Header explicativo */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-semibold mb-2 border border-indigo-200 dark:border-indigo-800">
            <Sparkles className="w-3.5 h-3.5" />
            Motor de Integridad Técnica (Dev 1 & Dev 2)
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
            Asistente de Compatibilidad Técnica PC
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Verifica en tiempo real la compatibilidad de sockets (AM5 / LGA1700), formatos de memoria (DDR4 / DDR5) y demanda eléctrica (Watts) para evitar errores de compra.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" onClick={handleClearAll} className="flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" />
            Limpiar Ensamble
          </Button>
          <a
            href="https://wa.me/593998765432?text=Hola%20TechParts,%20tengo%20dudas%20sobre%20la%20compatibilidad%20de%20mi%20ensamble%20PC"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            Consultar a un Ingeniero
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Columna Izquierda: Selectores de Componentes (7 columnas) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Selector 1: Procesador (CPU) */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Cpu className="w-4 h-4 text-indigo-600" />
                1. Procesador (CPU)
              </label>
              {selectedCpu?.socket && (
                <span className="text-[11px] font-mono text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
                  Socket: {selectedCpu.socket}
                </span>
              )}
            </div>
            <select
              value={selectedCpu?.id || ''}
              onChange={(e) => {
                const found = cpus.find((p) => p.id === Number(e.target.value));
                setSelectedCpu(found || null);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar Procesador --</option>
              {cpus.map((cpu) => (
                <option key={cpu.id} value={cpu.id}>
                  {cpu.name} | Socket: {cpu.socket} | TDP: {cpu.wattage}W - ${Number(cpu.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 2: Placa Base (Motherboard) */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-600" />
                2. Placa Base (Motherboard)
              </label>
              {selectedMotherboard?.socket && (
                <span className="text-[11px] font-mono text-blue-600 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                  Socket: {selectedMotherboard.socket} ({selectedMotherboard.ramType})
                </span>
              )}
            </div>
            <select
              value={selectedMotherboard?.id || ''}
              onChange={(e) => {
                const found = motherboards.find((p) => p.id === Number(e.target.value));
                setSelectedMotherboard(found || null);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar Placa Base --</option>
              {motherboards.map((mb) => (
                <option key={mb.id} value={mb.id}>
                  {mb.name} | Socket: {mb.socket} | RAM: {mb.ramType} - ${Number(mb.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 3: Tarjeta Gráfica (GPU) */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" />
                3. Tarjeta Gráfica (GPU)
              </label>
              {selectedGpu?.wattage && (
                <span className="text-[11px] font-mono text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                  Consumo: {selectedGpu.wattage}W
                </span>
              )}
            </div>
            <select
              value={selectedGpu?.id || ''}
              onChange={(e) => {
                const found = gpus.find((p) => p.id === Number(e.target.value));
                setSelectedGpu(found || null);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar Tarjeta Gráfica (Opcional) --</option>
              {gpus.map((gpu) => (
                <option key={gpu.id} value={gpu.id}>
                  {gpu.name} | Consumo: {gpu.wattage}W - ${Number(gpu.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 4: Memoria RAM */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-600" />
                4. Memoria RAM
              </label>
              {selectedRam?.ramType && (
                <span className="text-[11px] font-mono text-purple-600 bg-purple-50 dark:bg-purple-950 px-2 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                  Tipo: {selectedRam.ramType}
                </span>
              )}
            </div>
            <select
              value={selectedRam?.id || ''}
              onChange={(e) => {
                const found = rams.find((p) => p.id === Number(e.target.value));
                setSelectedRam(found || null);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar Memoria RAM --</option>
              {rams.map((ram) => (
                <option key={ram.id} value={ram.id}>
                  {ram.name} | Tipo: {ram.ramType} - ${Number(ram.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Selector 5: Fuente de Poder (PSU) */}
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-2">
                <Zap className="w-4 h-4 text-emerald-600" />
                5. Fuente de Poder (PSU)
              </label>
              {selectedPsu?.wattage && (
                <span className="text-[11px] font-mono text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                  Capacidad: {selectedPsu.wattage}W
                </span>
              )}
            </div>
            <select
              value={selectedPsu?.id || ''}
              onChange={(e) => {
                const found = psus.find((p) => p.id === Number(e.target.value));
                setSelectedPsu(found || null);
              }}
              className="w-full text-xs p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">-- Seleccionar Fuente de Poder --</option>
              {psus.map((psu) => (
                <option key={psu.id} value={psu.id}>
                  {psu.name} | Potencia: {psu.wattage}W Gold - ${Number(psu.price).toFixed(2)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Columna Derecha: Reporte de Compatibilidad y Diagnóstico (5 columnas) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-3 flex items-center justify-between">
              <span>Diagnóstico de Integridad Técnica</span>
              {isChecking && <span className="text-xs text-indigo-500 animate-pulse">Analizando...</span>}
            </h2>

            {!result ? (
              <div className="text-center py-8 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">
                  Selecciona al menos un procesador y una placa base en el panel de la izquierda para comenzar el análisis.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Score y Veredicto */}
                <div
                  className={`p-4 rounded-xl border flex items-center justify-between ${
                    result.compatible
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300'
                      : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {result.compatible ? (
                      <CheckCircle2 className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <XCircle className="w-7 h-7 text-rose-600 dark:text-rose-400" />
                    )}
                    <div>
                      <div className="text-sm font-bold">
                        {result.compatible ? '¡Componentes 100% Compatibles!' : 'Incompatibilidad Detectada'}
                      </div>
                      <div className="text-xs opacity-90">
                        {result.compatible
                          ? 'No hay colisiones físicas de socket ni déficit eléctrico.'
                          : 'Se encontraron conflictos graves que impedirán el funcionamiento.'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black">{result.score}</span>
                    <span className="text-xs block opacity-75">/ 100 pts</span>
                  </div>
                </div>

                {/* Métricas Eléctricas */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Consumo Pico Estimado:</span>
                    <span className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5 text-amber-500" />
                      {result.totalEstimatedWattage} Watts
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    <span className="text-slate-400 block text-[11px]">Fuente Recomendada:</span>
                    <span className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                      {result.recommendedPsuWattage}W o superior
                    </span>
                  </div>
                </div>

                {/* Lista de Incompatibilidades (Errores Críticos) */}
                {result.issues.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Errores Críticos ({result.issues.length}):
                    </span>
                    {result.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 leading-relaxed"
                      >
                        {issue}
                      </div>
                    ))}
                  </div>
                )}

                {/* Advertencias */}
                {result.warnings.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Advertencias ({result.warnings.length}):
                    </span>
                    {result.warnings.map((warn, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-900 text-amber-700 dark:text-amber-300"
                      >
                        {warn}
                      </div>
                    ))}
                  </div>
                )}

                {/* Recomendaciones y Aciertos */}
                {result.recommendations.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verificaciones Aprobadas:
                    </span>
                    {result.recommendations.map((rec, idx) => (
                      <div
                        key={idx}
                        className="text-xs p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300"
                      >
                        {rec}
                      </div>
                    ))}
                  </div>
                )}

                {/* Botón de Añadir Ensamble Completo al Carrito */}
                {result.compatible && (
                  <Button
                    variant="primary"
                    className="w-full flex items-center justify-center gap-2 text-xs py-3 mt-2 bg-indigo-600 hover:bg-indigo-500 shadow-lg shadow-indigo-600/25"
                    onClick={handleAddAllToCart}
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Añadir Ensamble Completo al Carrito
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
