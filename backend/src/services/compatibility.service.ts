import prisma from '../utils/prisma';

export interface ComponentSpecs {
  id?: number;
  sku?: string;
  name?: string;
  category?: string;
  socket?: string; // AM5, AM4, LGA1700, LGA1851
  supportedSockets?: string[];
  memoryType?: 'DDR4' | 'DDR5';
  supportedMemoryTypes?: ('DDR4' | 'DDR5')[];
  tdpWatts?: number;
  tgpWatts?: number;
  wattage?: number;
  recommendedPsuWatts?: number;
  formFactor?: 'ATX' | 'Micro-ATX' | 'Mini-ITX';
}

export type CheckStatus = 'PASS' | 'FAIL' | 'WARN';

export interface CompatibilityCheckResult {
  rule: 'CPU_MOTHERBOARD_SOCKET' | 'RAM_MOTHERBOARD_TYPE' | 'GPU_PSU_WATTAGE' | 'SYSTEM_POWER_HEADROOM';
  status: CheckStatus;
  title: string;
  message: string;
  details?: Record<string, any>;
}

export interface CompatibilityReport {
  compatible: boolean;
  score: number; // 0 - 100
  summary: string;
  componentsAnalyzed: {
    cpu?: ComponentSpecs;
    motherboard?: ComponentSpecs;
    ram?: ComponentSpecs;
    gpu?: ComponentSpecs;
    psu?: ComponentSpecs;
  };
  metrics: {
    estimatedSystemLoadWatts: number;
    recommendedPsuWatts: number;
    selectedPsuWatts?: number;
    powerHeadroomWatts?: number;
  };
  checks: CompatibilityCheckResult[];
}

export class CompatibilityService {
  /**
   * Extrae especificaciones técnicas automáticas a partir del nombre, modelo, descripción y categoría.
   */
  static extractSpecs(product: any): ComponentSpecs {
    const text = `${product.name} ${product.model} ${product.description || ''} ${product.sku}`.toUpperCase();
    const categoryName = (product.category?.name || '').toUpperCase();

    const specs: ComponentSpecs = {
      id: product.id,
      sku: product.sku,
      name: product.name,
      category: product.category?.name,
    };

    // 1. Identificar Sockets (CPUs y Placas Base)
    if (text.includes('AM5') || text.includes('RYZEN 7000') || text.includes('RYZEN 8000') || text.includes('RYZEN 9000') || text.includes('B650') || text.includes('X670') || text.includes('A620') || text.includes('X870') || text.includes('B850')) {
      specs.socket = 'AM5';
      specs.supportedSockets = ['AM5'];
    } else if (text.includes('AM4') || text.includes('RYZEN 5000') || text.includes('RYZEN 3000') || text.includes('B550') || text.includes('X570') || text.includes('B450') || text.includes('A520')) {
      specs.socket = 'AM4';
      specs.supportedSockets = ['AM4'];
    } else if (text.includes('LGA1700') || text.includes('LGA 1700') || text.includes('14700') || text.includes('13700') || text.includes('12700') || text.includes('Z790') || text.includes('B760') || text.includes('Z690') || text.includes('B660')) {
      specs.socket = 'LGA1700';
      specs.supportedSockets = ['LGA1700'];
    } else if (text.includes('LGA1851') || text.includes('CORE ULTRA') || text.includes('Z890')) {
      specs.socket = 'LGA1851';
      specs.supportedSockets = ['LGA1851'];
    }

    // 2. Identificar Tipo de Memoria RAM
    if (text.includes('DDR5')) {
      specs.memoryType = 'DDR5';
      specs.supportedMemoryTypes = ['DDR5'];
    } else if (text.includes('DDR4')) {
      specs.memoryType = 'DDR4';
      specs.supportedMemoryTypes = ['DDR4'];
    }

    // Soportes especiales de memoria por plataforma
    if (specs.socket === 'AM5') {
      specs.supportedMemoryTypes = ['DDR5']; // AM5 es exclusivamente DDR5
    } else if (specs.socket === 'AM4') {
      specs.supportedMemoryTypes = ['DDR4']; // AM4 es exclusivamente DDR4
    } else if (specs.socket === 'LGA1700') {
      // Si la placa menciona DDR5 explícitamente soporta DDR5, de lo contrario DDR4
      if (text.includes('DDR4')) {
        specs.supportedMemoryTypes = ['DDR4'];
      } else {
        specs.supportedMemoryTypes = ['DDR5']; // La mayoría de gama media/alta actual
      }
    }

    // 3. Identificar Consumo Eléctrico y Fuentes (TDP / TGP / PSU Watts)
    // Procesadores TDP
    if (categoryName.includes('PROCESADOR') || text.includes('RYZEN') || text.includes('CORE I')) {
      if (text.includes('14900') || text.includes('13900')) specs.tdpWatts = 250;
      else if (text.includes('14700') || text.includes('13700')) specs.tdpWatts = 200;
      else if (text.includes('7800X3D') || text.includes('7900X3D') || text.includes('7950X3D')) specs.tdpWatts = 120;
      else if (text.includes('7600') || text.includes('14600')) specs.tdpWatts = 100;
      else specs.tdpWatts = 95;
    }

    // Tarjetas Gráficas TGP y PSU recomendada
    if (categoryName.includes('GRÁFICA') || categoryName.includes('GRAFICA') || text.includes('RTX') || text.includes('RADEON') || text.includes('GEFORCE')) {
      if (text.includes('4090')) {
        specs.tgpWatts = 450;
        specs.recommendedPsuWatts = 850;
      } else if (text.includes('4080') || text.includes('7900 XTX')) {
        specs.tgpWatts = 320;
        specs.recommendedPsuWatts = 750;
      } else if (text.includes('4070') || text.includes('7800 XT')) {
        specs.tgpWatts = 230;
        specs.recommendedPsuWatts = 650;
      } else if (text.includes('4060') || text.includes('7600')) {
        specs.tgpWatts = 130;
        specs.recommendedPsuWatts = 550;
      } else {
        specs.tgpWatts = 180;
        specs.recommendedPsuWatts = 600;
      }
    }

    // Fuentes de Poder (Potencia nominal en Watts)
    if (categoryName.includes('FUENTE') || text.includes('PSU') || text.includes('WATT') || text.includes('850W') || text.includes('750W') || text.includes('650W') || text.includes('1000W') || text.includes('550W')) {
      const match = text.match(/(\d{3,4})\s*W/);
      if (match) {
        specs.wattage = parseInt(match[1], 10);
      } else if (text.includes('850')) {
        specs.wattage = 850;
      } else if (text.includes('750')) {
        specs.wattage = 750;
      } else if (text.includes('650')) {
        specs.wattage = 650;
      } else if (text.includes('1000')) {
        specs.wattage = 1000;
      }
    }

    // 4. Form Factor (Placas Base)
    if (text.includes('MINI-ITX') || text.includes('ITX')) {
      specs.formFactor = 'Mini-ITX';
    } else if (text.includes('MICRO-ATX') || text.includes('MATX') || text.includes('M-ATX')) {
      specs.formFactor = 'Micro-ATX';
    } else {
      specs.formFactor = 'ATX';
    }

    return specs;
  }

  /**
   * Ejecuta el análisis de compatibilidad cruzada entre componentes de PC.
   */
  static async evaluateCompatibility(input: {
    productIds?: number[];
    cpuId?: number;
    motherboardId?: number;
    ramId?: number;
    gpuId?: number;
    psuId?: number;
    customSpecs?: ComponentSpecs[];
  }): Promise<CompatibilityReport> {
    const idsToFetch = new Set<number>();
    if (input.cpuId) idsToFetch.add(input.cpuId);
    if (input.motherboardId) idsToFetch.add(input.motherboardId);
    if (input.ramId) idsToFetch.add(input.ramId);
    if (input.gpuId) idsToFetch.add(input.gpuId);
    if (input.psuId) idsToFetch.add(input.psuId);
    if (Array.isArray(input.productIds)) {
      input.productIds.forEach((id) => idsToFetch.add(id));
    }

    let loadedProducts: any[] = [];
    if (idsToFetch.size > 0) {
      loadedProducts = await prisma.product.findMany({
        where: { id: { in: Array.from(idsToFetch) } },
        include: { category: true },
      });
    }

    const allSpecs: ComponentSpecs[] = [
      ...loadedProducts.map((p) => this.extractSpecs(p)),
      ...(input.customSpecs || []),
    ];

    // Clasificar componentes de forma segura comprobando que los IDs existan
    const hasCpuId = typeof input.cpuId === 'number';
    const hasMbId = typeof input.motherboardId === 'number';
    const hasRamId = typeof input.ramId === 'number';
    const hasGpuId = typeof input.gpuId === 'number';
    const hasPsuId = typeof input.psuId === 'number';

    let cpu = (hasCpuId ? allSpecs.find((s) => s.id === input.cpuId) : null) ||
      allSpecs.find((s) => (s.category || '').toUpperCase().includes('PROCESADOR') || (s.name || '').toUpperCase().includes('RYZEN') || (s.name || '').toUpperCase().includes('INTEL CORE'));

    let motherboard = (hasMbId ? allSpecs.find((s) => s.id === input.motherboardId) : null) ||
      allSpecs.find((s) => (s.category || '').toUpperCase().includes('PLACA') || (s.category || '').toUpperCase().includes('MOTHER') || (s.name || '').toUpperCase().includes('B650') || (s.name || '').toUpperCase().includes('Z790') || (s.name || '').toUpperCase().includes('B760') || (s.name || '').toUpperCase().includes('X670'));

    let ram = (hasRamId ? allSpecs.find((s) => s.id === input.ramId) : null) ||
      allSpecs.find((s) => (s.category || '').toUpperCase().includes('MEMORIA') || (s.category || '').toUpperCase().includes('RAM') || (s.name || '').toUpperCase().includes('DDR5') || (s.name || '').toUpperCase().includes('DDR4'));

    let gpu = (hasGpuId ? allSpecs.find((s) => s.id === input.gpuId) : null) ||
      allSpecs.find((s) => (s.category || '').toUpperCase().includes('GRÁFICA') || (s.category || '').toUpperCase().includes('GRAFICA') || (s.name || '').toUpperCase().includes('RTX') || (s.name || '').toUpperCase().includes('RADEON'));

    let psu = (hasPsuId ? allSpecs.find((s) => s.id === input.psuId) : null) ||
      allSpecs.find((s) => (s.category || '').toUpperCase().includes('FUENTE') || (s.category || '').toUpperCase().includes('PSU') || (s.name || '').toUpperCase().includes('WATT') || (s.name || '').toUpperCase().includes('850W') || (s.name || '').toUpperCase().includes('750W'));

    const checks: CompatibilityCheckResult[] = [];
    let isFullyCompatible = true;
    let score = 100;

    // Regla 1: Socket CPU vs Socket Placa Base
    if (cpu && motherboard) {
      const cpuSocket = cpu.socket;
      const mbSocket = motherboard.socket;

      if (cpuSocket && mbSocket) {
        if (cpuSocket === mbSocket) {
          checks.push({
            rule: 'CPU_MOTHERBOARD_SOCKET',
            status: 'PASS',
            title: 'Socket de Procesador y Placa Base Compatible',
            message: `El zócalo ${cpuSocket} del procesador (${cpu.name}) coincide exactamente con la placa base (${motherboard.name}).`,
            details: { cpuSocket, motherboardSocket: mbSocket },
          });
        } else {
          isFullyCompatible = false;
          score -= 50;
          checks.push({
            rule: 'CPU_MOTHERBOARD_SOCKET',
            status: 'FAIL',
            title: 'Incompatibilidad Crítica de Socket',
            message: `El procesador requiere socket ${cpuSocket}, pero la placa base seleccionada tiene socket ${mbSocket}. No podrán ensamblarse físicamente.`,
            details: { cpuSocket, motherboardSocket: mbSocket },
          });
        }
      } else {
        checks.push({
          rule: 'CPU_MOTHERBOARD_SOCKET',
          status: 'WARN',
          title: 'Verificación de Socket Asistida Requerida',
          message: 'No se pudo inferir automáticamente el socket exacto. Por favor valida que coincidan AM5/AM4 o LGA1700.',
        });
        score -= 5;
      }
    }

    // Regla 2: Tipo de Memoria RAM (DDR4 vs DDR5)
    if (ram && motherboard) {
      const ramType = ram.memoryType;
      const supportedRam = motherboard.supportedMemoryTypes || [];

      if (ramType && supportedRam.length > 0) {
        if (supportedRam.includes(ramType)) {
          checks.push({
            rule: 'RAM_MOTHERBOARD_TYPE',
            status: 'PASS',
            title: 'Tecnología de Memoria RAM Compatible',
            message: `La memoria ${ramType} (${ram.name}) es compatible con las ranuras de la placa base (${motherboard.name}).`,
            details: { ramType, supportedRamTypes: supportedRam },
          });
        } else {
          isFullyCompatible = false;
          score -= 35;
          checks.push({
            rule: 'RAM_MOTHERBOARD_TYPE',
            status: 'FAIL',
            title: 'Incompatibilidad de Generación de Memoria RAM',
            message: `Se seleccionó memoria ${ramType}, pero la placa base solo admite tecnología ${supportedRam.join('/')}. Las muescas físicas no son compatibles.`,
            details: { ramType, supportedRamTypes: supportedRam },
          });
        }
      }
    }

    // Regla 3: Cálculo de Consumo y Capacidad de Fuente de Poder (PSU)
    const baseSystemOverhead = 100; // Almacenamiento, ventiladores, chipset, periféricos
    const cpuWatts = cpu?.tdpWatts || 105;
    const gpuWatts = gpu?.tgpWatts || 0;
    const estimatedSystemLoadWatts = cpuWatts + gpuWatts + baseSystemOverhead;

    // Potencia de fuente recomendada (margen de eficiencia del 30% + transitorios de GPU)
    let recommendedPsuWatts = Math.ceil((estimatedSystemLoadWatts * 1.35) / 50) * 50;
    if (gpu?.recommendedPsuWatts && gpu.recommendedPsuWatts > recommendedPsuWatts) {
      recommendedPsuWatts = gpu.recommendedPsuWatts;
    }
    if (recommendedPsuWatts < 500) recommendedPsuWatts = 500;

    let selectedPsuWatts = psu?.wattage;
    let powerHeadroomWatts = selectedPsuWatts ? selectedPsuWatts - estimatedSystemLoadWatts : undefined;

    if (psu && selectedPsuWatts) {
      if (selectedPsuWatts >= recommendedPsuWatts) {
        checks.push({
          rule: 'GPU_PSU_WATTAGE',
          status: 'PASS',
          title: 'Fuente de Alimentación Óptima',
          message: `La fuente de poder (${selectedPsuWatts}W) supera con holgura los ${recommendedPsuWatts}W recomendados para la configuración. Margen libre: +${powerHeadroomWatts}W.`,
          details: { selectedPsuWatts, recommendedPsuWatts, estimatedSystemLoadWatts, powerHeadroomWatts },
        });
      } else if (selectedPsuWatts >= estimatedSystemLoadWatts) {
        score -= 15;
        checks.push({
          rule: 'GPU_PSU_WATTAGE',
          status: 'WARN',
          title: 'Potencia de Fuente Ajustada',
          message: `La fuente seleccionada (${selectedPsuWatts}W) cubre la carga estimada (${estimatedSystemLoadWatts}W), pero no alcanza el umbral de seguridad recomendado (${recommendedPsuWatts}W) para picos transitorios.`,
          details: { selectedPsuWatts, recommendedPsuWatts, estimatedSystemLoadWatts },
        });
      } else {
        isFullyCompatible = false;
        score -= 40;
        checks.push({
          rule: 'GPU_PSU_WATTAGE',
          status: 'FAIL',
          title: 'Potencia Insuficiente en Fuente de Poder',
          message: `Peligro de apagón térmico: La configuración consume ~${estimatedSystemLoadWatts}W y la fuente solo provee ${selectedPsuWatts}W. Se requiere al menos ${recommendedPsuWatts}W.`,
          details: { selectedPsuWatts, recommendedPsuWatts, estimatedSystemLoadWatts },
        });
      }
    } else if (gpu || cpu) {
      checks.push({
        rule: 'SYSTEM_POWER_HEADROOM',
        status: 'WARN',
        title: 'Recomendación de Fuente de Poder',
        message: `Consumo proyectado de ${estimatedSystemLoadWatts}W. Te sugerimos adquirir una fuente de alimentación de al menos ${recommendedPsuWatts}W con certificación 80 Plus.`,
        details: { recommendedPsuWatts, estimatedSystemLoadWatts },
      });
    }

    // Resumen ejecutivo
    let summary = 'Todos los componentes seleccionados son 100% compatibles entre sí.';
    if (!isFullyCompatible) {
      summary = 'Se han detectado incompatibilidades técnicas críticas que impedirían el ensamblaje o funcionamiento seguro del equipo.';
    } else if (checks.some((c) => c.status === 'WARN')) {
      summary = 'Los componentes son ensamblables, pero existen recomendaciones técnicas para optimizar estabilidad o potencia.';
    }

    return {
      compatible: isFullyCompatible,
      score: Math.max(0, score),
      summary,
      componentsAnalyzed: { cpu, motherboard, ram, gpu, psu },
      metrics: {
        estimatedSystemLoadWatts,
        recommendedPsuWatts,
        selectedPsuWatts,
        powerHeadroomWatts,
      },
      checks,
    };
  }

  /**
   * Retorna directrices y matriz oficial de compatibilidad para referencia técnica.
   */
  static getCompatibilityGuidelines() {
    return {
      updatedAt: new Date().toISOString(),
      standards: [
        {
          platform: 'AMD Socket AM5',
          processors: ['AMD Ryzen serie 7000', 'AMD Ryzen serie 8000', 'AMD Ryzen serie 9000'],
          chipsets: ['A620', 'B650', 'B650E', 'X670', 'X670E', 'B850', 'X870'],
          memory: 'DDR5 obligatoria (No compatible con DDR4)',
          pcie: 'PCIe 4.0 / PCIe 5.0 retrocompatible',
        },
        {
          platform: 'Intel LGA1700',
          processors: ['Intel Core 12va generación', 'Intel Core 13va generación', 'Intel Core 14va generación'],
          chipsets: ['H610', 'B660', 'B760', 'Z690', 'Z790'],
          memory: 'Soporte DDR4 o DDR5 (según modelo específico de placa base)',
          pcie: 'PCIe 4.0 / PCIe 5.0',
        },
        {
          platform: 'AMD Socket AM4',
          processors: ['AMD Ryzen series 1000 a 5000 (ej. Ryzen 5 5600, Ryzen 7 5700X3D)'],
          chipsets: ['A320', 'B450', 'B550', 'X570'],
          memory: 'DDR4 obligatoria',
          pcie: 'PCIe 3.0 / PCIe 4.0',
        },
      ],
      gpuPsuRecommendations: [
        { gpuTier: 'NVIDIA RTX 4090 / AMD RX 7900 XTX', minPsu: '850W - 1000W 80 Plus Gold' },
        { gpuTier: 'NVIDIA RTX 4080 Super / AMD RX 7900 XT', minPsu: '750W - 850W 80 Plus Gold' },
        { gpuTier: 'NVIDIA RTX 4070 Super / AMD RX 7800 XT', minPsu: '650W - 750W 80 Plus Gold' },
        { gpuTier: 'NVIDIA RTX 4060 Ti / AMD RX 7600 XT', minPsu: '550W - 650W 80 Plus Bronze/Gold' },
      ],
    };
  }
}
