import prisma from '../utils/prisma';
import { EmailService } from './email.service';

export interface CreateSubscriptionInput {
  email: string;
  customerName?: string;
  productId: number;
  variantId?: number;
}

export class SubscriptionService {
  /**
   * Registra una nueva suscripción de cliente para aviso de reposición
   */
  static async subscribe(input: CreateSubscriptionInput) {
    const { email, customerName, productId, variantId } = input;
    const cleanEmail = email.trim().toLowerCase();

    // Validar existencia de producto
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      const error: any = new Error(`Producto con ID ${productId} no encontrado`);
      error.statusCode = 404;
      throw error;
    }

    if (variantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: variantId },
      });
      if (!variant || variant.productId !== productId) {
        const error: any = new Error(`Variante ${variantId} no pertenece al producto`);
        error.statusCode = 400;
        throw error;
      }
    }

    // Verificar si ya existe suscripción activa
    const existing = await prisma.productSubscription.findFirst({
      where: {
        email: cleanEmail,
        productId,
        variantId: variantId || null,
        status: 'PENDING',
      },
    });

    if (existing) {
      return {
        subscription: existing,
        message: 'Ya estás suscrito a las alertas de reposición para este componente.',
        alreadySubscribed: true,
      };
    }

    const subscription = await prisma.productSubscription.create({
      data: {
        email: cleanEmail,
        customerName: customerName?.trim() || null,
        productId,
        variantId: variantId || null,
        status: 'PENDING',
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });

    return {
      subscription,
      message: '¡Te avisaremos inmediatamente por correo cuando este componente vuelva a estar disponible!',
      alreadySubscribed: false,
    };
  }

  /**
   * Notifica automáticamente a todos los clientes suscritos cuando se produce un ingreso de inventario (Fase 3 - Dev 2)
   */
  static async notifyRestockedSubscribers(params: {
    productId: number;
    variantId?: number | null;
    newStock: number;
  }) {
    const { productId, variantId, newStock } = params;

    if (newStock <= 0) return { notifiedCount: 0 };

    const where: any = {
      productId,
      status: 'PENDING',
    };

    if (variantId) {
      where.OR = [{ variantId }, { variantId: null }];
    }

    const subscriptions = await prisma.productSubscription.findMany({
      where,
      include: {
        product: true,
        variant: true,
      },
    });

    if (subscriptions.length === 0) {
      return { notifiedCount: 0 };
    }

    let count = 0;
    for (const sub of subscriptions) {
      const targetName = sub.product.name;
      const targetVariantName = sub.variant?.name || null;
      const targetSku = sub.variant?.sku || sub.product.sku;
      const targetPrice = sub.variant ? Number(sub.variant.price) : Number(sub.product.price);

      await EmailService.sendRestockNotificationEmail({
        customerEmail: sub.email,
        customerName: sub.customerName,
        productName: targetName,
        variantName: targetVariantName,
        sku: targetSku,
        newStock,
        price: targetPrice,
        productId: sub.productId,
      });

      // Actualizar estado a NOTIFIED
      await prisma.productSubscription.update({
        where: { id: sub.id },
        data: {
          status: 'NOTIFIED',
          notifiedAt: new Date(),
        },
      });

      count++;
    }

    console.log(`📢 [NOTIFICACIÓN REPOSICIÓN] Se notificó exitosamente a ${count} clientes suscritos.`);
    return { notifiedCount: count };
  }

  /**
   * Listar suscripciones para consulta administrativa
   */
  static async getAllSubscriptions(params: { status?: string; limit?: number } = {}) {
    const { status, limit = 50 } = params;
    const where: any = {};
    if (status) where.status = status;

    return prisma.productSubscription.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        variant: { select: { id: true, name: true, sku: true } },
      },
    });
  }
}
