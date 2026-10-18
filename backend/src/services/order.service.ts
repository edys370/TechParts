import prisma from '../utils/prisma';
import { EmailService } from './email.service';

export interface CreateOrderItemInput {
  productId: number;
  variantId?: number;
  quantity: number;
}

export interface CreateOrderInput {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  customerCedula?: string;
  shippingZoneId: number;
  paymentMethod: 'BANK_TRANSFER' | 'CASH_ON_DELIVERY' | 'SANDBOX_CARD';
  notes?: string;
  items: CreateOrderItemInput[];
}

export class OrderService {
  /**
   * Información de cuentas bancarias institucionales para transferencias
   */
  static getBankTransferDetails() {
    return {
      bankName: 'Banco Pichincha',
      accountType: 'Cuenta Corriente',
      accountNumber: '2100845920',
      accountHolder: 'TechParts Ecuador S.A.S.',
      ruc: '1793204918001',
      emailNotice: 'pagos@techparts.com',
      whatsappNotice: '+593998765432',
      instructions: 'Realiza la transferencia por el monto exacto y envía el comprobante indicando tu número de pedido.',
    };
  }

  /**
   * Catálogo de métodos de pago soportados (Fase 2)
   */
  static getPaymentMethods() {
    return [
      {
        id: 'BANK_TRANSFER',
        name: 'Transferencia Bancaria Directa',
        description: 'Transfiere directamente desde tu banca virtual a nuestra cuenta Banco Pichincha o Produbanco.',
        icon: 'BuildingLibraryIcon',
        requiresVerification: true,
        bankDetails: this.getBankTransferDetails(),
      },
      {
        id: 'CASH_ON_DELIVERY',
        name: 'Pago Contra Entrega (Efectivo / Tarjeta)',
        description: 'Paga en efectivo o tarjeta con datáfono inalámbrico al momento de recibir tus componentes.',
        icon: 'BanknotesIcon',
        requiresVerification: false,
      },
      {
        id: 'SANDBOX_CARD',
        name: 'Pasarela Digital Sandbox (Tarjeta de Crédito / Débito)',
        description: 'Simulador de pago electrónico instantáneo con tarjeta de crédito en entorno de prueba.',
        icon: 'CreditCardIcon',
        requiresVerification: false,
      },
    ];
  }

  /**
   * Obtener zonas de despacho activas
   */
  static async getShippingZones() {
    return prisma.shippingZone.findMany({
      where: { isActive: true },
      orderBy: { cost: 'asc' },
    });
  }

  /**
   * Crear un nuevo pedido con validación transaccional ACID y descuento de inventario
   */
  static async createOrder(input: CreateOrderInput) {
    const {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      customerCity,
      customerCedula,
      shippingZoneId,
      paymentMethod,
      notes,
      items,
    } = input;

    if (!items || items.length === 0) {
      const error: any = new Error('El pedido debe contener al menos un producto');
      error.statusCode = 400;
      throw error;
    }

    const lowStockAlerts: Array<{
      productName: string;
      sku: string;
      variantName?: string | null;
      currentStock: number;
      minStock: number;
      productId: number;
      variantId?: number | null;
    }> = [];

    const result = await prisma.$transaction(async (tx) => {
      // 1. Validar Zona de Envío
      const shippingZone = await tx.shippingZone.findUnique({
        where: { id: shippingZoneId },
      });

      if (!shippingZone) {
        const error: any = new Error('La zona de envío seleccionada no es válida');
        error.statusCode = 404;
        throw error;
      }

      // 2. Validar existencias y procesar items
      let subtotal = 0;
      const processedItems: Array<{
        productId: number;
        variantId?: number | null;
        productName: string;
        variantName?: string | null;
        sku: string;
        unitPrice: number;
        quantity: number;
        total: number;
      }> = [];

      for (const item of items) {
        if (item.quantity <= 0) {
          const error: any = new Error('La cantidad de cada ítem debe ser mayor a 0');
          error.statusCode = 400;
          throw error;
        }

        const product = await tx.product.findUnique({
          where: { id: item.productId },
        });

        if (!product) {
          const error: any = new Error(`Producto con ID ${item.productId} no encontrado`);
          error.statusCode = 404;
          throw error;
        }

        if (item.variantId) {
          // Validar stock de la variante
          const variant = await tx.productVariant.findUnique({
            where: { id: item.variantId },
          });

          if (!variant || variant.productId !== item.productId) {
            const error: any = new Error(`Variante ${item.variantId} no pertenece al producto ${product.name}`);
            error.statusCode = 400;
            throw error;
          }

          if (variant.stock < item.quantity) {
            const error: any = new Error(
              `Stock insuficiente para la variante "${variant.name}" (${variant.sku}). Disponible: ${variant.stock}, Solicitado: ${item.quantity}`
            );
            error.statusCode = 400;
            throw error;
          }

          const unitPrice = Number(variant.price);
          const itemTotal = unitPrice * item.quantity;
          subtotal += itemTotal;

          // Descontar stock de la variante
          const newVarStock = variant.stock - item.quantity;
          const newVarStatus = newVarStock === 0 ? 'OUT_OF_STOCK' : newVarStock <= variant.minStock ? 'LOW_STOCK' : 'ACTIVE';

          if (newVarStock <= variant.minStock) {
            lowStockAlerts.push({
              productName: product.name,
              sku: variant.sku,
              variantName: variant.name,
              currentStock: newVarStock,
              minStock: variant.minStock,
              productId: product.id,
              variantId: variant.id,
            });
          }

          await tx.productVariant.update({
            where: { id: variant.id },
            data: {
              stock: newVarStock,
              status: newVarStatus,
            },
          });

          // Actualizar consolidado del producto padre
          const newProdStock = Math.max(0, product.stock - item.quantity);
          const newProdStatus = newProdStock === 0 ? 'OUT_OF_STOCK' : newProdStock <= product.minStock ? 'LOW_STOCK' : 'ACTIVE';

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: newProdStock,
              status: newProdStatus,
            },
          });

          processedItems.push({
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            unitPrice,
            quantity: item.quantity,
            total: itemTotal,
          });
        } else {
          // Producto simple
          if (product.stock < item.quantity) {
            const error: any = new Error(
              `Stock insuficiente para "${product.name}" (${product.sku}). Disponible: ${product.stock}, Solicitado: ${item.quantity}`
            );
            error.statusCode = 400;
            throw error;
          }

          const unitPrice = Number(product.price);
          const itemTotal = unitPrice * item.quantity;
          subtotal += itemTotal;

          const newProdStock = product.stock - item.quantity;
          const newProdStatus = newProdStock === 0 ? 'OUT_OF_STOCK' : newProdStock <= product.minStock ? 'LOW_STOCK' : 'ACTIVE';

          if (newProdStock <= product.minStock) {
            lowStockAlerts.push({
              productName: product.name,
              sku: product.sku,
              variantName: null,
              currentStock: newProdStock,
              minStock: product.minStock,
              productId: product.id,
              variantId: null,
            });
          }

          await tx.product.update({
            where: { id: product.id },
            data: {
              stock: newProdStock,
              status: newProdStatus,
            },
          });

          processedItems.push({
            productId: product.id,
            variantId: null,
            productName: product.name,
            variantName: null,
            sku: product.sku,
            unitPrice,
            quantity: item.quantity,
            total: itemTotal,
          });
        }
      }

      // 3. Calcular Tarifa de Envío e Impuestos
      let shippingCost = Number(shippingZone.cost);
      if (shippingZone.freeThreshold && subtotal >= Number(shippingZone.freeThreshold)) {
        shippingCost = 0.00; // Envío Gratis
      }

      const taxRate = 0.15; // 15% IVA
      const taxAmount = Math.round(subtotal * taxRate * 100) / 100;
      const total = Math.round((subtotal + shippingCost + taxAmount) * 100) / 100;

      // 4. Generar Código Único de Pedido
      const orderCount = await tx.order.count();
      const currentYear = new Date().getFullYear();
      const orderNumber = `TP-${currentYear}-${String(orderCount + 1).padStart(4, '0')}`;

      // 5. Crear el Pedido y sus Items
      const order = await tx.order.create({
        data: {
          orderNumber,
          customerName: customerName.trim(),
          customerEmail: customerEmail.trim().toLowerCase(),
          customerPhone: customerPhone.trim(),
          customerAddress: customerAddress.trim(),
          customerCity: customerCity.trim(),
          customerCedula: customerCedula?.trim() || null,
          shippingZoneId,
          paymentMethod,
          paymentStatus: paymentMethod === 'SANDBOX_CARD' ? 'PAID' : 'PENDING',
          orderStatus: 'PROCESSING',
          subtotal,
          shippingCost,
          taxRate,
          taxAmount,
          total,
          currency: 'USD',
          notes: notes?.trim() || null,
          items: {
            create: processedItems.map((item) => ({
              productId: item.productId,
              variantId: item.variantId,
              productName: item.productName,
              variantName: item.variantName,
              sku: item.sku,
              unitPrice: item.unitPrice,
              quantity: item.quantity,
              total: item.total,
            })),
          },
        },
        include: {
          shippingZone: true,
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true, imageUrl: true } },
              variant: { select: { id: true, name: true, sku: true, capacity: true, color: true } },
            },
          },
        },
      });

      // 6. Registrar Auditoría de Salidas de Inventario (ACID)
      for (const item of processedItems) {
        await tx.inventoryTransaction.create({
          data: {
            productId: item.productId,
            variantId: item.variantId || null,
            type: 'OUT',
            quantity: item.quantity,
            previousStock: 0, // Registrado con referencia
            newStock: 0,
            reason: `Venta web completada - Orden ${order.orderNumber}`,
            reference: `ORDEN-${order.orderNumber}`,
          },
        });
      }

      return {
        order,
        paymentInstructions: paymentMethod === 'BANK_TRANSFER' ? this.getBankTransferDetails() : null,
      };
    });

    // 7. Notificaciones transaccionales automáticas vía SMTP & Auditoría (Fase 3 - Dev 2)
    // a) Correo con Factura al cliente
    EmailService.sendOrderInvoiceEmail(result.order).catch((err) =>
      console.warn('⚠️ Error al enviar factura por correo:', err)
    );

    // b) Aviso de Nuevo Pedido al Administrador
    EmailService.sendAdminNewOrderEmail(result.order).catch((err) =>
      console.warn('⚠️ Error al enviar alerta de nuevo pedido al admin:', err)
    );

    // c) Alertas automáticas de stock bajo al Administrador si algún ítem cayó <= minStock
    for (const alertInfo of lowStockAlerts) {
      EmailService.sendLowStockAlertEmail(alertInfo).catch((err) =>
        console.warn('⚠️ Error al enviar alerta de stock bajo:', err)
      );
    }

    return result;
  }

  /**
   * Listar pedidos con paginación y filtros
   */
  static async getAllOrders(params: { search?: string; status?: string; page?: number; limit?: number } = {}) {
    const { search, status, page = 1, limit = 20 } = params;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { customerName: { contains: search, mode: 'insensitive' } },
        { customerEmail: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.orderStatus = status;
    }

    const [total, orders] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          shippingZone: true,
          items: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: orders,
    };
  }

  /**
   * Obtener detalle de pedido por ID o Número de Orden
   */
  static async getOrderById(idOrNumber: string | number) {
    const isId = !isNaN(Number(idOrNumber));
    const where = isId ? { id: Number(idOrNumber) } : { orderNumber: String(idOrNumber) };

    const order = await prisma.order.findUnique({
      where: where as any,
      include: {
        shippingZone: true,
        items: {
          include: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) return null;

    return {
      ...order,
      bankTransferDetails: order.paymentMethod === 'BANK_TRANSFER' ? this.getBankTransferDetails() : null,
    };
  }

  /**
   * Actualizar estado de orden (Admin)
   */
  static async updateOrderStatus(id: number, status: string, paymentStatus?: string) {
    const data: any = { orderStatus: status };
    if (paymentStatus) data.paymentStatus = paymentStatus;

    return prisma.order.update({
      where: { id },
      data,
      include: {
        shippingZone: true,
        items: true,
      },
    });
  }
}
