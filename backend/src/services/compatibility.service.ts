import prisma from '../utils/prisma';

export interface CompatibilityCheckInput {
  productIds: number[];
}

export interface CompatibilityResult {
  compatible: boolean;
  score: number; // 0 a 100
  issues: string[]; // Errores fatales de incompatibilidad
  warnings: string[]; // Advertencias no fatales (ej. cuello de botella, fuente justa)
  recommendations: string[]; // Sugerencias de mejora
  totalEstimatedWattage: number; // Consumo estimado total en Watts
  recommendedPsuWattage: number; // Potencia recomendada de fuente en Watts
  componentsAnalyzed: Array<{
    id: number;
    name: string;
    category: string;
    socket?: string | null;
    ramType?: string | null;
    wattage?: number | null;
  }>;
}

export class CompatibilityService {
  /**
   * Analiza un conjunto de componentes de PC y determina compatibilidad de sockets,
   * tecnologías de memoria y balance de potencia eléctrica (PSU).
   */
  static async checkCompatibility(productIds: number[]): Promise<CompatibilityResult> {
    if (!productIds || productIds.length === 0) {
      return {
        compatible: true,
        score: 100,
        issues: [],
        warnings: ['No has seleccionado ningún componente aún.'],
        recommendations: ['Selecciona al menos un procesador y una placa base para verificar su compatibilidad.'],
        totalEstimatedWattage: 0,
        recommendedPsuWattage: 0,
        componentsAnalyzed: [],
      };
    }

    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      include: { category: true },
    });

    const issues: string[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Clasificar por categorías
    const cpus = products.filter((p) => p.category.name.toLowerCase().includes('procesador'));
    const motherboards = products.filter((p) => p.category.name.toLowerCase().includes('placa'));
    const gpus = products.filter((p) => p.category.name.toLowerCase().includes('tarjeta') || p.category.name.toLowerCase().includes('gráfica'));
    const rams = products.filter((p) => p.category.name.toLowerCase().includes('ram') || p.category.name.toLowerCase().includes('memoria'));
    const psus = products.filter((p) => p.category.name.toLowerCase().includes('fuente') || p.category.name.toLowerCase().includes('poder'));
    const ssds = products.filter((p) => p.category.name.toLowerCase().includes('almacenamiento') || p.category.name.toLowerCase().includes('ssd'));

    // 1. Regla: Socket CPU vs Motherboard
    if (cpus.length > 0 && motherboards.length > 0) {
      const cpu = cpus[0];
      const mb = motherboards[0];

      if (cpu.socket && mb.socket && cpu.socket !== mb.socket) {
        issues.push(
          `❌ Incompatibilidad crítica de Socket: El procesador "${cpu.name}" utiliza el socket ${cpu.socket}, mientras que la placa base "${mb.name}" utiliza el socket ${mb.socket}. No podrán ensamblarse físicamente.`
        );
      } else if (cpu.socket && mb.socket && cpu.socket === mb.socket) {
        recommendations.push(
          `✅ Socket verificado: ${cpu.socket} perfectamente compatible entre "${cpu.name}" y "${mb.name}".`
        );
      }
    }

    // 2. Regla: Tipo de RAM (DDR4 vs DDR5)
    if (rams.length > 0 && motherboards.length > 0) {
      const ram = rams[0];
      const mb = motherboards[0];

      if (ram.ramType && mb.ramType && ram.ramType !== mb.ramType) {
        issues.push(
          `❌ Incompatibilidad de Memoria RAM: La memoria "${ram.name}" es ${ram.ramType}, pero la placa base "${mb.name}" soporta ${mb.ramType}. Los módulos DDR4 y DDR5 tienen muescas diferentes.`
        );
      } else if (ram.ramType && mb.ramType && ram.ramType === mb.ramType) {
        recommendations.push(
          `✅ Memoria RAM verificada: Formato ${ram.ramType} compatible entre memoria y placa base.`
        );
      }
    }

    // 3. Regla: Cálculo de Potencia (Wattage) y Fuente de Poder
    let totalDraw = 90; // Consumo base del sistema (Placa base, ventiladores, chipset, LEDs)

    for (const p of products) {
      if (!p.category.name.toLowerCase().includes('fuente')) {
        totalDraw += p.wattage || 15;
      }
    }

    // Margen de seguridad estándar del 30% para picos transitorios (ATX 3.0 / PCIe 5.0)
    const recommendedPsuWattage = Math.ceil((totalDraw * 1.35) / 50) * 50;

    if (psus.length > 0) {
      const psu = psus[0];
      const psuCapacity = psu.wattage || 650;

      if (psuCapacity < totalDraw) {
        issues.push(
          `❌ Fuente de poder insuficiente: El ensamble consume aproximadamente ${totalDraw}W bajo carga, pero la fuente "${psu.name}" entrega solo ${psuCapacity}W. El equipo se apagará por sobrecorriente.`
        );
      } else if (psuCapacity < recommendedPsuWattage) {
        warnings.push(
          `⚠️ Fuente de poder justa: La fuente entrega ${psuCapacity}W y el consumo estimado es de ${totalDraw}W. Para mayor estabilidad y eficiencia se recomienda una de al menos ${recommendedPsuWattage}W.`
        );
      } else {
        recommendations.push(
          `✅ Potencia eléctrica óptima: La fuente de ${psuCapacity}W supera el mínimo recomendado de ${recommendedPsuWattage}W con excelente margen térmico.`
        );
      }
    } else if (gpus.length > 0 || cpus.length > 0) {
      warnings.push(
        `💡 Sugerencia de Fuente: Para esta configuración de CPU y GPU se recomienda añadir una fuente de alimentación de al menos ${recommendedPsuWattage}W (80 Plus Gold).`
      );
    }

    // 4. Advertencias de múltiples piezas del mismo tipo
    if (cpus.length > 1) {
      warnings.push('Has seleccionado más de un procesador. Un computador de escritorio estándar solo admite 1 CPU.');
    }
    if (motherboards.length > 1) {
      warnings.push('Has seleccionado más de una placa base. Elige una sola para tu ensamble.');
    }

    // Puntaje de compatibilidad
    let score = 100;
    if (issues.length > 0) {
      score = Math.max(10, 100 - issues.length * 45);
    } else if (warnings.length > 0) {
      score = Math.max(70, 100 - warnings.length * 10);
    }

    return {
      compatible: issues.length === 0,
      score,
      issues,
      warnings,
      recommendations,
      totalEstimatedWattage: totalDraw,
      recommendedPsuWattage,
      componentsAnalyzed: products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category.name,
        socket: p.socket,
        ramType: p.ramType,
        wattage: p.wattage,
      })),
    };
  }
}
