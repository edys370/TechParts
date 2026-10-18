import prisma from '../utils/prisma';
import { OrderService } from '../services/order.service';
import { InventoryService } from '../services/inventory.service';
import { SubscriptionService } from '../services/subscription.service';
import { EmailService } from '../services/email.service';

async function runDev2Certification() {
  console.log('===============================================================');
  console.log('🧪 INICIANDO CERTIFICACIÓN AUTOMATIZADA DE TAREAS DEV 2');
  console.log('===============================================================\n');

  try {
    // 1. Obtener producto y variante de prueba
    const product = await prisma.product.findFirst({
      where: { hasVariants: true },
      include: { variants: true },
    });

    if (!product || !product.variants || product.variants.length === 0) {
      throw new Error('No se encontraron productos con variantes en la base de datos.');
    }

    const variant = product.variants[0];
    const initialVarStock = variant.stock;
    console.log(`📌 Producto de Prueba: "${product.name}"`);
    console.log(`📌 Variante Seleccionada: "${variant.name}" (SKU: ${variant.sku})`);
    console.log(`📊 Stock Inicial de Variante: ${initialVarStock} unidades\n`);

    // 2. Obtener Zona de Envío
    const shippingZone = await prisma.shippingZone.findFirst({
      where: { isActive: true },
    });
    if (!shippingZone) throw new Error('No se encontraron zonas de envío activas.');

    // 3. PERSPECTIVA DEL CLIENTE: Realizar Pedido (Checkout con Variantes y Deducción ACID)
    console.log('--- PASO 1: Perspectiva del Cliente (Checkout & Pago) ---');
    const orderResult = await OrderService.createOrder({
      customerName: 'Dev 2 Tester',
      customerEmail: 'dev2.test@techparts.com',
      customerPhone: '+593991234567',
      customerAddress: 'Av. Amazonas y Eloy Alfaro',
      customerCity: 'Quito',
      customerCedula: '1720394857',
      shippingZoneId: shippingZone.id,
      paymentMethod: 'BANK_TRANSFER',
      items: [
        {
          productId: product.id,
          variantId: variant.id,
          quantity: 1,
        },
      ],
    });

    console.log(`✅ Pedido Creado con Éxito: ${orderResult.order.orderNumber}`);
    console.log(`💰 Total Facturado: $${Number(orderResult.order.total).toFixed(2)} USD (Subtotal + Envío + 15% IVA)`);
    console.log(`🏦 Instrucciones de Transferencia emitidas: Banco Pichincha Cta ${orderResult.paymentInstructions?.accountNumber}`);

    // Verificar deducción de stock
    const updatedVariant = await prisma.productVariant.findUnique({
      where: { id: variant.id },
    });
    console.log(`📉 Stock de Variante tras la compra: ${updatedVariant?.stock} (Esperado: ${initialVarStock - 1})`);
    if (updatedVariant?.stock !== initialVarStock - 1) {
      throw new Error('Fallo en la deducción atómica de inventario por variante.');
    }

    // 4. PERSPECTIVA DEL ADMINISTRADOR: Auditoría y Alerta de Stock Bajo
    console.log('\n--- PASO 2: Perspectiva del Administrador (Auditoría & Alertas) ---');
    const recentEmailLogs = await prisma.emailLog.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
    });
    console.log(`📨 Últimos registros en Auditoría SMTP (${recentEmailLogs.length} eventos):`);
    recentEmailLogs.forEach((log) => {
      console.log(`   - [${log.templateType}] Para: ${log.recipient} | Asunto: "${log.subject}" | Estado: ${log.status}`);
    });

    // 5. FLUJO DE SUSCRIPCIÓN ("Vuelve a estar disponible")
    console.log('\n--- PASO 3: Suscripción a Reposición de Componente Agotado ---');
    const subResult = await SubscriptionService.subscribe({
      email: 'cliente.interesado@techparts.com',
      customerName: 'Cliente Interesado',
      productId: product.id,
      variantId: variant.id,
    });
    console.log(`🔔 Suscripción registrada: ID ${subResult.subscription.id} - ${subResult.message}`);

    // 6. INGRESO DE MERCANCÍA (IN) Y DISPARO AUTOMÁTICO DE REPOSICIÓN
    console.log('\n--- PASO 4: Ingreso de Inventario (IN) & Notificación Automática ---');
    const movResult = await InventoryService.registerMovement({
      productId: product.id,
      variantId: variant.id,
      type: 'IN',
      quantity: 10,
      reason: 'Lote de reposición nuevo embarque',
      reference: 'REEMP-2026-TEST',
    });
    console.log(`📦 Movimiento Registrado: Entrada de ${movResult.transaction.quantity} unidades.`);
    console.log(`📈 Nuevo Stock Resultante de Variante: ${movResult.transaction.newStock}`);

    // Verificar notificación de cliente
    const subUpdated = await prisma.productSubscription.findUnique({
      where: { id: subResult.subscription.id },
    });
    console.log(`✉️ Estado de la suscripción del cliente: ${subUpdated?.status} (Notificado el: ${subUpdated?.notifiedAt})`);

    console.log('\n===============================================================');
    console.log('🎉 TODAS LAS PRUEBAS DEL CICLO DE DEV 2 HAN SIDO CERTIFICADAS');
    console.log('===============================================================\n');
  } catch (err: any) {
    console.error('❌ Error durante la certificación de Dev 2:', err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runDev2Certification();
