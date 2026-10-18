import prisma from '../utils/prisma';
import { EmailService } from './email.service';
import { SubscriptionService } from './subscription.service';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface MovementInput {
  productId: number;
  variantId?: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
}

export class InventoryService {
  /**
   * Registra un movimiento de stock atómico y seguro (ACID) mediante transacciones Prisma.
   * Soporta tanto productos simples como variantes de producto (control de stock independiente).
   */
  static async registerMovement(input: MovementInput) {
    const { productId, variantId, type, quantity, reason, reference } = input;

    if (quantity <= 0) {
      const error: any = new Error('La cantidad debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    let lowStockTrigger: {
      productName: string;
      sku: string;
      variantName?: string | null;
      currentStock: number;
      minStock: number;
      productId: number;
      variantId?: number | null;
    } | null = null;

    let restockTrigger: {
      productId: number;
      variantId?: number | null;
      newStock: number;
    } | null = null;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Obtener producto principal
      const product = await tx.product.findUnique({
        where: { id: productId },
        include: { variants: true },
      });

      if (!product) {
        const error: any = new Error(`Producto con ID ${productId} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      let previousStock = product.stock;
      let newStock = previousStock;
      let targetVariant: any = null;

      // 2. Si el movimiento apunta a una variante específica
      if (variantId) {
        targetVariant = await tx.productVariant.findUnique({
          where: { id: variantId },
        });

        if (!targetVariant || targetVariant.productId !== productId) {
          const error: any = new Error(`Variante con ID ${variantId} no pertenece al producto`);
          error.statusCode = 404;
          throw error;
        }

        const prevVarStock = targetVariant.stock;
        let newVarStock = prevVarStock;

        if (type === 'IN') {
          newVarStock = prevVarStock + quantity;
        } else if (type === 'OUT') {
          if (prevVarStock < quantity) {
            const error: any = new Error(
              `Stock insuficiente para la variante ${targetVariant.sku}. Stock actual: ${prevVarStock}, Solicitado: ${quantity}`
            );
            error.statusCode = 400;
            throw error;
          }
          newVarStock = prevVarStock - quantity;
        } else if (type === 'ADJUSTMENT') {
          newVarStock = quantity;
        }

        // Estado de la variante
        let newVarStatus = 'ACTIVE';
        if (newVarStock === 0) {
          newVarStatus = 'OUT_OF_STOCK';
        } else if (newVarStock <= targetVariant.minStock) {
          newVarStatus = 'LOW_STOCK';
        }

        // Triggers de Alerta o Notificación de Reposición (Fase 3 - Dev 2)
        if ((type === 'OUT' || type === 'ADJUSTMENT') && newVarStock <= targetVariant.minStock) {
          lowStockTrigger = {
            productName: product.name,
            sku: targetVariant.sku,
            variantName: targetVariant.name,
            currentStock: newVarStock,
            minStock: targetVariant.minStock,
            productId: product.id,
            variantId: targetVariant.id,
          };
        } else if (type === 'IN' && prevVarStock === 0 && newVarStock > 0) {
          restockTrigger = {
            productId: product.id,
            variantId: targetVariant.id,
            newStock: newVarStock,
          };
        }

        // Actualizar variante
        await tx.productVariant.update({
          where: { id: variantId },
          data: {
            stock: newVarStock,
            status: newVarStatus,
          },
        });

        // Recalcular stock consolidado del producto padre
        const allVariants = await tx.productVariant.findMany({
          where: { productId },
        });
        const consolidatedStock = allVariants.reduce((sum, v) => sum + (v.id === variantId ? newVarStock : v.stock), 0);

        let parentStatus = 'ACTIVE';
        if (consolidatedStock === 0) parentStatus = 'OUT_OF_STOCK';
        else if (consolidatedStock <= product.minStock) parentStatus = 'LOW_STOCK';

        await tx.product.update({
          where: { id: productId },
          data: {
            stock: consolidatedStock,
            status: parentStatus,
          },
        });

        previousStock = prevVarStock;
        newStock = newVarStock;
      } else {
        // Producto simple
        if (type === 'IN') {
          newStock = previousStock + quantity;
        } else if (type === 'OUT') {
          if (previousStock < quantity) {
            const error: any = new Error(
              `Stock insuficiente para el SKU ${product.sku}. Stock actual: ${previousStock}, Solicitado: ${quantity}`
            );
            error.statusCode = 400;
            throw error;
          }
          newStock = previousStock - quantity;
        } else if (type === 'ADJUSTMENT') {
          newStock = quantity;
        }

        let newStatus = 'ACTIVE';
        if (newStock === 0) newStatus = 'OUT_OF_STOCK';
        else if (newStock <= product.minStock) newStatus = 'LOW_STOCK';

        // Triggers de Alerta o Reposición
        if ((type === 'OUT' || type === 'ADJUSTMENT') && newStock <= product.minStock) {
          lowStockTrigger = {
            productName: product.name,
            sku: product.sku,
            variantName: null,
            currentStock: newStock,
            minStock: product.minStock,
            productId: product.id,
            variantId: null,
          };
        } else if (type === 'IN' && previousStock === 0 && newStock > 0) {
          restockTrigger = {
            productId: product.id,
            variantId: null,
            newStock,
          };
        }

        await tx.product.update({
          where: { id: productId },
          data: {
            stock: newStock,
            status: newStatus,
          },
        });
      }

      // 3. Registrar transacción en auditoría
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          variantId: variantId || null,
          type,
          quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : quantity,
          previousStock,
          newStock,
          reason: reason || (type === 'IN' ? 'Ingreso de mercancía' : type === 'OUT' ? 'Salida por venta o despacho' : 'Ajuste manual de inventario'),
          reference: reference || null,
        },
        include: {
          variant: true,
        },
      });

      const finalProduct = await tx.product.findUnique({
        where: { id: productId },
        include: { category: true, variants: true },
      });

      return {
        product: finalProduct,
        transaction,
      };
    });

    // 4. Disparo asíncrono de Alertas y Notificaciones (Fase 3 - Dev 2)
    if (lowStockTrigger) {
      EmailService.sendLowStockAlertEmail(lowStockTrigger).catch((err) =>
        console.warn('⚠️ Error al enviar alerta de stock bajo:', err)
      );
    }

    if (restockTrigger) {
      SubscriptionService.notifyRestockedSubscribers(restockTrigger).catch((err) =>
        console.warn('⚠️ Error al notificar reposición a clientes:', err)
      );
    }

    return result;
  }

  static async getMovements(params: { productId?: number; variantId?: number; type?: MovementType; limit?: number }) {
    const { productId, variantId, type, limit = 100 } = params;
    const where: any = {};

    if (productId) where.productId = productId;
    if (variantId) where.variantId = variantId;
    if (type) where.type = type;

    return prisma.inventoryTransaction.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            brand: true,
            model: true,
            category: { select: { name: true } },
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            capacity: true,
            color: true,
          },
        },
      },
    });
  }

  static async getLowStockAlerts() {
    return prisma.product.findMany({
      where: {
        OR: [{ status: 'LOW_STOCK' }, { status: 'OUT_OF_STOCK' }],
      },
      include: {
        category: true,
        variants: {
          where: {
            OR: [{ status: 'LOW_STOCK' }, { status: 'OUT_OF_STOCK' }],
          },
        },
      },
      orderBy: [{ stock: 'asc' }, { minStock: 'desc' }],
    });
  }

  static async getDashboardMetrics() {
    const [totalProducts, lowStockProducts, outOfStockProducts, allProducts, totalOrders] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'LOW_STOCK' } }),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
      prisma.product.findMany({
        select: { stock: true, costPrice: true, price: true },
      }),
      prisma.order.count(),
    ]);

    const totalStockItems = allProducts.reduce((sum, p) => sum + p.stock, 0);
    const totalCostValuation = allProducts.reduce((sum, p) => sum + Number(p.costPrice) * p.stock, 0);
    const totalRetailValuation = allProducts.reduce((sum, p) => sum + Number(p.price) * p.stock, 0);

    return {
      totalProducts,
      totalStockItems,
      lowStockProducts,
      outOfStockProducts,
      totalCostValuation,
      totalRetailValuation,
      potentialProfit: totalRetailValuation - totalCostValuation,
      totalOrders,
    };
  }
}
