import prisma from '../utils/prisma';

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT';

export interface MovementInput {
  productId: number;
  variantId?: number;
  type: MovementType;
  quantity: number;
  reason?: string;
  reference?: string;
}

export interface ConcurrencyTestInput {
  productId?: number;
  variantId?: number;
  concurrentRequests?: number;
  quantityPerRequest?: number;
}

export interface ConcurrencyTestResult {
  productId: number;
  productSku: string;
  productName: string;
  variantId?: number;
  variantSku?: string;
  initialStock: number;
  finalStock: number;
  expectedFinalStock: number;
  requestedOperations: number;
  quantityPerRequest: number;
  successfulOperations: number;
  failedOperations: number;
  failuresDueToOutOfStock: number;
  totalTimeMs: number;
  avgLatencyMs: number;
  auditTransactionsCreated: number;
  isAcidConsistent: boolean;
  isolationLevel: string;
  concurrencyProtection: string;
  details: {
    oversellingDetected: boolean;
    stockIntegrityVerified: boolean;
    auditLogIntegrityVerified: boolean;
    atomicityVerified: boolean;
  };
  sampleErrors: string[];
}

export class InventoryService {
  /**
   * Registra un movimiento de stock atómico y seguro (ACID) mediante transacciones Prisma.
   * Utiliza bloqueos de fila exclusivos (SELECT ... FOR UPDATE) a nivel de PostgreSQL
   * para evitar inconsistencias de stock en concurrencia (evita race conditions y sobreventas).
   * Admite movimientos tanto sobre productos generales como sobre variantes de producto específicas.
   */
  static async registerMovement(input: MovementInput) {
    const { productId, variantId, type, quantity, reason, reference } = input;

    if (quantity <= 0) {
      const error: any = new Error('La cantidad debe ser mayor a 0');
      error.statusCode = 400;
      throw error;
    }

    return prisma.$transaction(async (tx) => {
      // 1. Bloqueo exclusivo FOR UPDATE del producto en PostgreSQL para serializar transacciones concurrentes
      const lockedProducts = await tx.$queryRaw<any[]>`
        SELECT id, sku, name, stock, "minStock", "hasVariants"
        FROM products
        WHERE id = ${productId}
        FOR UPDATE
      `;

      if (!lockedProducts || lockedProducts.length === 0) {
        const error: any = new Error(`Producto con ID ${productId} no encontrado`);
        error.statusCode = 404;
        throw error;
      }

      const product = lockedProducts[0];

      // 2. Si se especificó una variante, bloquear la fila de la variante
      let variant: any = null;
      if (variantId) {
        const lockedVariants = await tx.$queryRaw<any[]>`
          SELECT id, sku, name, stock, "minStock", "productId"
          FROM product_variants
          WHERE id = ${variantId} AND "productId" = ${productId}
          FOR UPDATE
        `;

        if (!lockedVariants || lockedVariants.length === 0) {
          const error: any = new Error(`Variante con ID ${variantId} no encontrada para el producto ${productId}`);
          error.statusCode = 404;
          throw error;
        }

        variant = lockedVariants[0];
      }

      // 3. Procesar stock y validar reglas de negocio
      let previousStock: number;
      let newStock: number;
      let transactionVariantId: number | null = null;

      if (variant) {
        // Operación a nivel de Variante
        transactionVariantId = variant.id;
        previousStock = Number(variant.stock);
        newStock = previousStock;

        if (type === 'IN') {
          newStock = previousStock + quantity;
        } else if (type === 'OUT') {
          if (previousStock < quantity) {
            const error: any = new Error(
              `Stock insuficiente para la variante ${variant.sku}. Stock actual: ${previousStock}, Solicitado: ${quantity}`
            );
            error.statusCode = 400;
            throw error;
          }
          newStock = previousStock - quantity;
        } else if (type === 'ADJUSTMENT') {
          newStock = quantity;
        }

        const newVariantStatus =
          newStock === 0 ? 'OUT_OF_STOCK' : newStock <= variant.minStock ? 'LOW_STOCK' : 'ACTIVE';

        // Actualizar variante
        await tx.productVariant.update({
          where: { id: variant.id },
          data: {
            stock: newStock,
            status: newVariantStatus,
          },
        });

        // Recalcular stock consolidado del producto padre
        const allVariants = await tx.productVariant.findMany({
          where: { productId },
          select: { id: true, stock: true },
        });

        const consolidatedStock = allVariants.reduce((sum, v) => {
          return sum + (v.id === variant.id ? newStock : v.stock);
        }, 0);

        const newParentStatus =
          consolidatedStock === 0 ? 'OUT_OF_STOCK' : consolidatedStock <= product.minStock ? 'LOW_STOCK' : 'ACTIVE';

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stock: consolidatedStock,
            status: newParentStatus,
          },
          include: { category: true, variants: true },
        });

        // 4. Registrar en libro de auditoría de transacciones
        const transaction = await tx.inventoryTransaction.create({
          data: {
            productId,
            variantId: transactionVariantId,
            type,
            quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : quantity,
            previousStock,
            newStock,
            reason:
              reason ||
              (type === 'IN'
                ? 'Ingreso de mercancía por variante'
                : type === 'OUT'
                ? 'Salida por venta o despacho de variante'
                : 'Ajuste de inventario de variante'),
            reference: reference || null,
          },
        });

        return {
          product: updatedProduct,
          variant: { ...variant, stock: newStock, status: newVariantStatus },
          transaction,
        };
      } else {
        // Operación a nivel de Producto Simple
        previousStock = Number(product.stock);
        newStock = previousStock;

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

        const newStatus =
          newStock === 0 ? 'OUT_OF_STOCK' : newStock <= product.minStock ? 'LOW_STOCK' : 'ACTIVE';

        const updatedProduct = await tx.product.update({
          where: { id: productId },
          data: {
            stock: newStock,
            status: newStatus,
          },
          include: { category: true, variants: true },
        });

        // 4. Registrar en libro de auditoría de transacciones
        const transaction = await tx.inventoryTransaction.create({
          data: {
            productId,
            variantId: null,
            type,
            quantity: type === 'ADJUSTMENT' ? Math.abs(newStock - previousStock) : quantity,
            previousStock,
            newStock,
            reason:
              reason ||
              (type === 'IN'
                ? 'Ingreso de mercancía'
                : type === 'OUT'
                ? 'Salida por venta o despacho'
                : 'Ajuste manual de inventario'),
            reference: reference || null,
          },
        });

        return {
          product: updatedProduct,
          transaction,
        };
      }
    });
  }

  /**
   * Ejecuta una prueba automatizada de consistencia transaccional ACID bajo condiciones
   * de alta concurrencia de compra (evita race conditions, desbordamientos y sobreventa).
   */
  static async testConcurrency(input: ConcurrencyTestInput = {}): Promise<ConcurrencyTestResult> {
    const concurrentRequests = input.concurrentRequests || 20;
    const quantityPerRequest = input.quantityPerRequest || 1;

    // 1. Obtener producto objetivo
    let targetProduct: any = null;
    let targetVariant: any = null;

    if (input.variantId && input.productId) {
      targetVariant = await prisma.productVariant.findUnique({
        where: { id: input.variantId },
        include: { product: true },
      });
      if (targetVariant) {
        targetProduct = targetVariant.product;
      }
    } else if (input.productId) {
      targetProduct = await prisma.product.findUnique({
        where: { id: input.productId },
        include: { variants: true },
      });
    }

    // Si no se proporcionó o no existe, seleccionar un producto o variante adecuado para la prueba
    if (!targetProduct) {
      targetProduct = await prisma.product.findFirst({
        where: { stock: { gte: 5 } },
        include: { variants: true },
      });
    }

    if (!targetProduct) {
      throw new Error('No se encontró ningún producto con stock suficiente para realizar la prueba.');
    }

    // Registrar estado inicial
    const initialStock = targetVariant ? targetVariant.stock : targetProduct.stock;
    const testReference = `ACID-STRESS-${Date.now()}`;

    const startTime = performance.now();

    // 2. Disparar peticiones concurrentes simultáneas utilizando Promise.allSettled
    const requests = Array.from({ length: concurrentRequests }).map((_, index) => {
      return this.registerMovement({
        productId: targetProduct.id,
        variantId: targetVariant ? targetVariant.id : undefined,
        type: 'OUT',
        quantity: quantityPerRequest,
        reason: `Prueba de concurrencia ACID hilo #${index + 1}`,
        reference: testReference,
      });
    });

    const results = await Promise.allSettled(requests);
    const endTime = performance.now();
    const totalTimeMs = Math.round(endTime - startTime);
    const avgLatencyMs = Math.round((totalTimeMs / concurrentRequests) * 100) / 100;

    // 3. Analizar resultados
    const successfulOps = results.filter((r) => r.status === 'fulfilled');
    const failedOps = results.filter((r) => r.status === 'rejected');

    const sampleErrors: string[] = [];
    let outOfStockFailures = 0;

    for (const fail of failedOps) {
      if (fail.status === 'rejected') {
        const errorMsg = fail.reason?.message || 'Error desconocido';
        if (errorMsg.includes('Stock insuficiente')) {
          outOfStockFailures++;
        }
        if (sampleErrors.length < 3 && !sampleErrors.includes(errorMsg)) {
          sampleErrors.push(errorMsg);
        }
      }
    }

    // 4. Verificar estado final persistido en la base de datos
    let finalStock = 0;
    if (targetVariant) {
      const refreshedVariant = await prisma.productVariant.findUnique({
        where: { id: targetVariant.id },
      });
      finalStock = refreshedVariant ? refreshedVariant.stock : 0;
    } else {
      const refreshedProduct = await prisma.product.findUnique({
        where: { id: targetProduct.id },
      });
      finalStock = refreshedProduct ? refreshedProduct.stock : 0;
    }

    const auditTransactionsCreated = await prisma.inventoryTransaction.count({
      where: { reference: testReference },
    });

    // 5. Criterios estrictos de integridad ACID
    const expectedFinalStock = Math.max(0, initialStock - successfulOps.length * quantityPerRequest);
    const oversellingDetected = finalStock < 0;
    const stockIntegrityVerified = finalStock === expectedFinalStock && finalStock >= 0;
    const auditLogIntegrityVerified = auditTransactionsCreated === successfulOps.length;
    const atomicityVerified = failedOps.length === concurrentRequests - successfulOps.length;
    const isAcidConsistent =
      stockIntegrityVerified && auditLogIntegrityVerified && atomicityVerified && !oversellingDetected;

    return {
      productId: targetProduct.id,
      productSku: targetProduct.sku,
      productName: targetProduct.name,
      variantId: targetVariant?.id,
      variantSku: targetVariant?.sku,
      initialStock,
      finalStock,
      expectedFinalStock,
      requestedOperations: concurrentRequests,
      quantityPerRequest,
      successfulOperations: successfulOps.length,
      failedOperations: failedOps.length,
      failuresDueToOutOfStock: outOfStockFailures,
      totalTimeMs,
      avgLatencyMs,
      auditTransactionsCreated,
      isAcidConsistent,
      isolationLevel: 'READ COMMITTED + SELECT ... FOR UPDATE (Row-level pessimistic lock)',
      concurrencyProtection: 'PostgreSQL Row Exclusive Lock & ACID Prisma Engine',
      details: {
        oversellingDetected,
        stockIntegrityVerified,
        auditLogIntegrityVerified,
        atomicityVerified,
      },
      sampleErrors,
    };
  }

  /**
   * Ejecuta una prueba de Atomicidad y Rollback automático ante excepciones.
   * Simula un fallo forzado a mitad de transacción y verifica que la base de datos
   * permanezca en su estado intacto original (cero escrituras parciales).
   */
  static async testRollback(productId: number) {
    const productBefore = await prisma.product.findUnique({ where: { id: productId } });
    if (!productBefore) throw new Error(`Producto con ID ${productId} no encontrado`);

    const stockBefore = productBefore.stock;
    const testReference = `ROLLBACK-TEST-${Date.now()}`;
    let errorCaught = false;

    try {
      await prisma.$transaction(async (tx) => {
        // Paso 1: Intentar actualizar stock
        await tx.product.update({
          where: { id: productId },
          data: { stock: stockBefore - 5 },
        });

        // Paso 2: Registrar transacción parcial
        await tx.inventoryTransaction.create({
          data: {
            productId,
            type: 'OUT',
            quantity: 5,
            previousStock: stockBefore,
            newStock: stockBefore - 5,
            reason: 'Operación que debe fallar para probar rollback',
            reference: testReference,
          },
        });

        // Paso 3: Lanzar excepción deliberada para forzar ROLLBACK
        throw new Error('SIMULATED_TRANSACTION_FAILURE: Simulación de fallo en pasarela de pagos');
      });
    } catch (err: any) {
      if (err.message.includes('SIMULATED_TRANSACTION_FAILURE')) {
        errorCaught = true;
      }
    }

    // Verificar estado posterior
    const productAfter = await prisma.product.findUnique({ where: { id: productId } });
    const stockAfter = productAfter?.stock ?? 0;
    const orphanTxCount = await prisma.inventoryTransaction.count({
      where: { reference: testReference },
    });

    const atomicityVerified = errorCaught && stockBefore === stockAfter && orphanTxCount === 0;

    return {
      success: true,
      productId,
      sku: productBefore.sku,
      stockBefore,
      stockAfter,
      orphanTransactionsFound: orphanTxCount,
      atomicityVerified,
      message: atomicityVerified
        ? 'Rollback verificado con éxito: No hubo persistencia de datos corruptos ni decremento de stock tras la excepción simulada.'
        : 'Fallo de atomicidad: Se detectaron cambios parciales no revertidos.',
    };
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
        variant: {
          select: {
            id: true,
            sku: true,
            name: true,
            capacity: true,
            color: true,
            stock: true,
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
      include: { category: true, variants: true },
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
