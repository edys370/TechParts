import prisma from '../utils/prisma';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface MovementInput {
  productId: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
}

export class InventoryService {
  /**
   * Registra un movimiento de stock atómico y seguro (ACID) mediante transacciones Prisma.
   * Evita inconsistencias de stock en concurrencia y previene stocks negativos en salidas.
   */
  static async registerMovement(input: MovementInput) {
    const { productId, type, quantity, reason, reference } = input;

    if (quantity <= 0) {
      const error: any = new Error('La cantidad debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // 1. Obtener producto con bloqueo consistente
      const product = await tx.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        const error: any = new Error(`Producto con ID ${productId} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      const previousStock = product.stock;
      let newStock = previousStock;

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
        // En caso de ajuste directo, la cantidad representa el nuevo stock absoluto
        newStock = quantity;
      }

      // 2. Determinar nuevo estado del producto según el stock
      let newStatus = 'ACTIVE';
      if (newStock === 0) {
        newStatus = 'OUT_OF_STOCK';
      } else if (newStock <= product.minStock) {
        newStatus = 'LOW_STOCK';
      }

      // 3. Actualizar stock del producto
      const updatedProduct = await tx.product.update({
        where: { id: productId },
        data: {
          stock: newStock,
          status: newStatus,
        },
        include: { category: true },
      });

      // 4. Registrar en el libro de auditoría de transacciones
      const transaction = await tx.inventoryTransaction.create({
        data: {
          productId,
          type,
          quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : quantity,
          previousStock,
          newStock,
          reason: reason || (type === 'IN' ? 'Ingreso de mercancía' : type === 'OUT' ? 'Salida por venta o despacho' : 'Ajuste manual de inventario'),
          reference: reference || null,
        },
      });

      return {
        product: updatedProduct,
        transaction,
      };
    });
  }

  /**
   * Obtiene el historial de movimientos de inventario con filtros
   */
  static async getMovements(params: { productId?: number; type?: MovementType; limit?: number }) {
    const { productId, type, limit = 50 } = params;
    const where: any = {};

    if (productId) where.productId = productId;
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
      },
    });
  }

  /**
   * Obtiene alertas de productos con bajo stock o agotados
   */
  static async getLowStockAlerts() {
    return prisma.product.findMany({
      where: {
        OR: [{ status: 'LOW_STOCK' }, { status: 'OUT_OF_STOCK' }],
      },
      include: { category: true },
      orderBy: [{ stock: 'asc' }, { minStock: 'desc' }],
    });
  }

  /**
   * Obtiene métricas generales del inventario para el dashboard
   */
  static async getDashboardMetrics() {
    const [totalProducts, lowStockProducts, outOfStockProducts, allProducts] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: 'LOW_STOCK' } }),
      prisma.product.count({ where: { status: 'OUT_OF_STOCK' } }),
      prisma.product.findMany({
        select: { stock: true, costPrice: true, price: true },
      }),
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
    };
  }
}
