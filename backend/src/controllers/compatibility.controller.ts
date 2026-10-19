import { Request, Response, NextFunction } from 'express';
import { CompatibilityService } from '../services/compatibility.service';

export class CompatibilityController {
  /**
   * Endpoint de evaluación de compatibilidad de componentes PC.
   * Acepta: { productIds: [1, 2, ...], cpuId, motherboardId, ramId, gpuId, psuId, customSpecs }
   */
  static async check(req: Request, res: Response, next: NextFunction) {
    try {
      const { productIds, cpuId, motherboardId, ramId, gpuId, psuId, customSpecs, items } = req.body;

      // Combinar posibles formatos de entrada
      const resolvedIds: number[] = [];
      if (Array.isArray(productIds)) resolvedIds.push(...productIds);
      if (Array.isArray(items)) resolvedIds.push(...items.map((i: any) => (typeof i === 'number' ? i : i.id)));

      const report = await CompatibilityService.evaluateCompatibility({
        productIds: resolvedIds.length > 0 ? resolvedIds : undefined,
        cpuId: cpuId ? Number(cpuId) : undefined,
        motherboardId: motherboardId ? Number(motherboardId) : undefined,
        ramId: ramId ? Number(ramId) : undefined,
        gpuId: gpuId ? Number(gpuId) : undefined,
        psuId: psuId ? Number(psuId) : undefined,
        customSpecs,
      });

      return res.json({
        success: true,
        data: report,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Endpoint con las normas y tablas de referencia de compatibilidad de TechParts.
   */
  static getGuidelines(_req: Request, res: Response) {
    const guidelines = CompatibilityService.getCompatibilityGuidelines();
    return res.json({
      success: true,
      data: guidelines,
    });
  }
}
