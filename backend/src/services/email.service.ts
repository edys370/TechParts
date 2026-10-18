import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';
import prisma from '../utils/prisma';

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  simulated?: boolean;
  error?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Inicializa o devuelve el transportador de correo SMTP
   */
  private static getTransporter(): Transporter {
    if (!this.transporter) {
      this.transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.secure,
        auth: {
          user: config.smtp.user,
          pass: config.smtp.pass,
        },
        connectionTimeout: 5000,
        greetingTimeout: 5000,
      });
    }
    return this.transporter;
  }

  /**
   * Envía un correo con fallback tolerante a fallos y registro de auditoría en base de datos (ACID)
   */
  private static async sendAndLog(params: {
    to: string;
    subject: string;
    html: string;
    templateType: 'INVOICE' | 'NEW_ORDER_ADMIN' | 'LOW_STOCK_ALERT' | 'RESTOCK_NOTIFICATION' | 'TEST';
    metadata?: Record<string, any>;
  }): Promise<EmailSendResult> {
    const { to, subject, html, templateType, metadata } = params;
    const metadataStr = metadata ? JSON.stringify(metadata) : null;
    const from = `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`;

    // Si las credenciales son de prueba dummy o no hay credenciales, simular envío y registrar en BD
    const isDummyCredentials =
      !config.smtp.user ||
      config.smtp.user === 'techparts_demo' ||
      config.smtp.user === 'test_user';

    try {
      if (isDummyCredentials) {
        console.log(`📨 [SMTP SIMULADO] Enviar a: ${to} | Asunto: "${subject}" | Tipo: ${templateType}`);
        const fakeMessageId = `sim_${Date.now()}_${Math.random().toString(36).substring(7)}`;

        await prisma.emailLog.create({
          data: {
            recipient: to,
            subject,
            templateType,
            status: 'SIMULATED',
            messageId: fakeMessageId,
            metadata: metadataStr,
          },
        });

        return { success: true, messageId: fakeMessageId, simulated: true };
      }

      // Intentar envío real por SMTP
      const transporter = this.getTransporter();
      const info = await transporter.sendMail({
        from,
        to,
        subject,
        html,
      });

      console.log(`✅ [SMTP REAL] Correo enviado a ${to} (ID: ${info.messageId})`);

      await prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          templateType,
          status: 'SENT',
          messageId: info.messageId,
          metadata: metadataStr,
        },
      });

      return { success: true, messageId: info.messageId, simulated: false };
    } catch (err: any) {
      console.warn(`⚠️ [SMTP ERROR/FALLBACK] Falló envío a ${to}: ${err.message}. Guardando en auditoría...`);

      await prisma.emailLog.create({
        data: {
          recipient: to,
          subject,
          templateType,
          status: 'FAILED',
          error: err.message || 'Error desconocido al enviar correo',
          metadata: metadataStr,
        },
      });

      return { success: false, error: err.message };
    }
  }

  /**
   * 1. Correo Transaccional de Pedido Recibido y Factura Digital al Cliente
   */
  static async sendOrderInvoiceEmail(order: any): Promise<EmailSendResult> {
    const itemsHtml = (order.items || [])
      .map(
        (item: any) => `
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px; font-size: 13px; color: #1e293b;">
            <strong>${item.productName}</strong>
            ${item.variantName ? `<br/><span style="color: #64748b; font-size: 11px;">Variante: ${item.variantName}</span>` : ''}
            <br/><span style="color: #94a3b8; font-size: 10px;">SKU: ${item.sku}</span>
          </td>
          <td style="padding: 10px; font-size: 13px; text-align: center; color: #1e293b;">${item.quantity}</td>
          <td style="padding: 10px; font-size: 13px; text-align: right; color: #1e293b;">$${Number(item.unitPrice).toFixed(2)}</td>
          <td style="padding: 10px; font-size: 13px; text-align: right; font-weight: bold; color: #0f172a;">$${Number(item.total).toFixed(2)}</td>
        </tr>`
      )
      .join('');

    const bankDetailsHtml =
      order.paymentMethod === 'BANK_TRANSFER'
        ? `
      <div style="margin-top: 20px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 6px;">
        <h4 style="margin: 0 0 8px 0; color: #1e1b4b; font-size: 14px;">🏦 Datos para Transferencia Bancaria:</h4>
        <p style="margin: 3px 0; font-size: 12px; color: #334155;"><strong>Banco:</strong> Banco Pichincha (Cuenta Corriente)</p>
        <p style="margin: 3px 0; font-size: 12px; color: #334155;"><strong>Número:</strong> 2100845920</p>
        <p style="margin: 3px 0; font-size: 12px; color: #334155;"><strong>Titular:</strong> TechParts Ecuador S.A.S. (RUC: 1793204918001)</p>
        <p style="margin: 3px 0; font-size: 12px; color: #334155;"><strong>Referencia:</strong> Indicar ${order.orderNumber} en el comprobante.</p>
        <p style="margin: 6px 0 0 0; font-size: 11px; color: #64748b;">Envía tu comprobante a <a href="mailto:pagos@techparts.com">pagos@techparts.com</a> o por WhatsApp al +593998765432.</p>
      </div>`
        : '';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 650px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
        
        <!-- Cabecera Institucional TechParts -->
        <div style="background: linear-gradient(135deg, #1e1b4b 0%, #312e81 100%); padding: 28px; text-align: center; color: #ffffff;">
          <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; font-weight: 800;">⚡ TECHPARTS ECUADOR</h1>
          <p style="margin: 6px 0 0 0; font-size: 13px; color: #c7d2fe;">Factura Comercial y Comprobante de Compra Electrónico</p>
        </div>

        <div style="padding: 28px;">
          <div style="border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: baseline;">
              <div>
                <p style="margin: 0; font-size: 12px; color: #64748b;">NÚMERO DE FACTURA / ORDEN</p>
                <h2 style="margin: 2px 0 0 0; font-size: 20px; color: #4f46e5; font-family: monospace;">${order.orderNumber}</h2>
              </div>
              <div style="text-align: right;">
                <p style="margin: 0; font-size: 12px; color: #64748b;">FECHA DE EMISIÓN</p>
                <p style="margin: 2px 0 0 0; font-size: 13px; font-weight: 600; color: #334155;">${new Date(order.createdAt || Date.now()).toLocaleDateString('es-EC')}</p>
              </div>
            </div>
          </div>

          <!-- Datos del Cliente -->
          <div style="background-color: #f8fafc; border-radius: 8px; padding: 14px; margin-bottom: 20px; font-size: 12px; color: #334155;">
            <p style="margin: 0 0 6px 0;"><strong>Cliente:</strong> ${order.customerName}</p>
            ${order.customerCedula ? `<p style="margin: 0 0 6px 0;"><strong>C.I. / RUC:</strong> ${order.customerCedula}</p>` : ''}
            <p style="margin: 0 0 6px 0;"><strong>Dirección de Entrega:</strong> ${order.customerAddress}, ${order.customerCity}</p>
            <p style="margin: 0 0 6px 0;"><strong>Teléfono:</strong> ${order.customerPhone}</p>
            <p style="margin: 0;"><strong>Método de Pago:</strong> ${order.paymentMethod === 'BANK_TRANSFER' ? 'Transferencia Bancaria' : order.paymentMethod === 'CASH_ON_DELIVERY' ? 'Pago Contra Entrega' : 'Pasarela Sandbox'}</p>
          </div>

          <!-- Tabla de Productos -->
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f1f5f9; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px; color: #475569;">
                <th style="padding: 10px; text-align: left;">Componente / Pieza</th>
                <th style="padding: 10px; text-align: center;">Cant.</th>
                <th style="padding: 10px; text-align: right;">P. Unit</th>
                <th style="padding: 10px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <!-- Desglose de Totales e Impuestos -->
          <div style="float: right; width: 240px; margin-bottom: 20px;">
            <table style="width: 100%; font-size: 13px;">
              <tr>
                <td style="color: #64748b; padding: 4px 0;">Subtotal:</td>
                <td style="text-align: right; color: #1e293b; padding: 4px 0;">$${Number(order.subtotal).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 4px 0;">Tarifa de Envío:</td>
                <td style="text-align: right; color: #1e293b; padding: 4px 0;">$${Number(order.shippingCost).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="color: #64748b; padding: 4px 0;">IVA (15%):</td>
                <td style="text-align: right; color: #1e293b; padding: 4px 0;">$${Number(order.taxAmount).toFixed(2)}</td>
              </tr>
              <tr style="border-top: 2px solid #e2e8f0;">
                <td style="color: #0f172a; font-weight: bold; padding: 8px 0; font-size: 15px;">TOTAL:</td>
                <td style="text-align: right; color: #4f46e5; font-weight: bold; padding: 8px 0; font-size: 16px;">$${Number(order.total).toFixed(2)} USD</td>
              </tr>
            </table>
          </div>
          <div style="clear: both;"></div>

          ${bankDetailsHtml}

          <!-- Asistencia Técnica WhatsApp -->
          <div style="margin-top: 24px; padding: 14px; background: #ecfdf5; border-radius: 8px; border: 1px solid #a7f3d0; text-align: center;">
            <p style="margin: 0; font-size: 12px; color: #065f46;">
              ¿Tienes dudas sobre la instalación o compatibilidad de tus piezas?
              <br/>
              <strong>Contáctanos directamente vía WhatsApp:</strong> 
              <a href="https://wa.me/593998765432?text=Hola%20TechParts,%20consulto%20sobre%20mi%20pedido%20${order.orderNumber}" style="color: #059669; font-weight: bold; text-decoration: underline;">
                +593 99 876 5432
              </a>
              (Horario: Lun - Sáb 08:30 a 18:30)
            </p>
          </div>
        </div>

        <!-- Pie de Página Institucional -->
        <div style="background-color: #f8fafc; padding: 16px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
          TechParts Ecuador S.A.S. - Especialistas en Hardware y Componentes de Computación.<br/>
          Quito, Ecuador. Correo de Soporte: soporte@techparts.com
        </div>
      </div>
    </body>
    </html>`;

    return this.sendAndLog({
      to: order.customerEmail,
      subject: `Factura y Confirmación de Pedido #${order.orderNumber} - TechParts`,
      html,
      templateType: 'INVOICE',
      metadata: { orderId: order.id, orderNumber: order.orderNumber, total: order.total },
    });
  }

  /**
   * 2. Notificación de "Nuevo Pedido" para el Administrador
   */
  static async sendAdminNewOrderEmail(order: any): Promise<EmailSendResult> {
    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: sans-serif; background-color: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 8px; padding: 24px; border: 1px solid #e2e8f0;">
        <h2 style="color: #1e1b4b; margin-top: 0;">🛒 Nuevo Pedido Recibido en TechParts</h2>
        <p style="font-size: 14px; color: #475569;">Se ha generado una nueva orden de compra web:</p>
        
        <ul style="font-size: 13px; color: #334155; line-height: 1.6;">
          <li><strong>Número de Pedido:</strong> ${order.orderNumber}</li>
          <li><strong>Cliente:</strong> ${order.customerName} (${order.customerEmail})</li>
          <li><strong>Teléfono:</strong> ${order.customerPhone}</li>
          <li><strong>Ciudad / Dirección:</strong> ${order.customerCity} - ${order.customerAddress}</li>
          <li><strong>Método de Pago:</strong> ${order.paymentMethod}</li>
          <li><strong>Estado de Pago:</strong> ${order.paymentStatus}</li>
          <li><strong>Monto Total:</strong> $${Number(order.total).toFixed(2)} USD</li>
        </ul>

        <div style="margin-top: 20px; padding: 12px; background: #eef2ff; border-radius: 6px; font-size: 12px; color: #3730a3;">
          ⚠️ El inventario correspondiente por variantes ha sido debitado automáticamente de manera atómica (ACID).
        </div>
      </div>
    </body>
    </html>`;

    return this.sendAndLog({
      to: config.smtp.adminEmail,
      subject: `[ADMIN] Nuevo Pedido Web Recibido #${order.orderNumber} ($${Number(order.total).toFixed(2)})`,
      html,
      templateType: 'NEW_ORDER_ADMIN',
      metadata: { orderId: order.id, orderNumber: order.orderNumber },
    });
  }

  /**
   * 3. Alerta Automática de Stock Bajo para el Administrador (Fase 3 - Dev 2)
   */
  static async sendLowStockAlertEmail(itemInfo: {
    productName: string;
    sku: string;
    variantName?: string | null;
    currentStock: number;
    minStock: number;
    productId: number;
    variantId?: number | null;
  }): Promise<EmailSendResult> {
    const isOutOfStock = itemInfo.currentStock === 0;
    const severityColor = isOutOfStock ? '#dc2626' : '#d97706';
    const severityTitle = isOutOfStock ? 'PRODUCTO AGOTADO (STOCK CERO)' : 'ALERTA DE STOCK BAJO';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: sans-serif; background-color: #fef2f2; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 10px; padding: 24px; border-left: 6px solid ${severityColor}; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        <h2 style="color: ${severityColor}; margin-top: 0; font-size: 20px;">
          ⚠️ ${severityTitle} - TechParts Admin
        </h2>
        <p style="font-size: 14px; color: #475569;">
          Se ha detectado una reducción de existencias por debajo del umbral de seguridad para el siguiente ítem:
        </p>

        <table style="width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 13px;">
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Producto:</td>
            <td style="padding: 8px; color: #0f172a;">${itemInfo.productName}</td>
          </tr>
          ${
            itemInfo.variantName
              ? `
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Variante:</td>
            <td style="padding: 8px; color: #4338ca;"><strong>${itemInfo.variantName}</strong></td>
          </tr>`
              : ''
          }
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Código SKU:</td>
            <td style="padding: 8px; font-family: monospace; color: #334155;">${itemInfo.sku}</td>
          </tr>
          <tr style="border-bottom: 1px solid #f1f5f9;">
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Stock Disponible:</td>
            <td style="padding: 8px; font-weight: bold; color: ${severityColor}; font-size: 15px;">
              ${itemInfo.currentStock} unidades
            </td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold; color: #64748b;">Umbral Mínimo (minStock):</td>
            <td style="padding: 8px; color: #64748b;">${itemInfo.minStock} unidades</td>
          </tr>
        </table>

        <div style="padding: 12px; background-color: #fff7ed; border-radius: 6px; font-size: 12px; color: #9a3412;">
          💡 <strong>Acción Sugerida:</strong> Realizar orden de compra al proveedor y registrar el movimiento de entrada (IN) en el módulo de Inventario para reabastecer esta pieza.
        </div>
      </div>
    </body>
    </html>`;

    return this.sendAndLog({
      to: config.smtp.adminEmail,
      subject: `[STOCK ALERTA] ${itemInfo.productName} (${itemInfo.sku}) - Quedan ${itemInfo.currentStock}`,
      html,
      templateType: 'LOW_STOCK_ALERT',
      metadata: itemInfo,
    });
  }

  /**
   * 4. Notificación de Reposición ("Vuelve a estar disponible") a Clientes Suscritos (Fase 3 - Dev 2)
   */
  static async sendRestockNotificationEmail(params: {
    customerEmail: string;
    customerName?: string | null;
    productName: string;
    variantName?: string | null;
    sku: string;
    newStock: number;
    price: number;
    productId: number;
  }): Promise<EmailSendResult> {
    const greeting = params.customerName ? `Hola ${params.customerName},` : 'Estimado cliente,';

    const html = `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"/></head>
    <body style="font-family: sans-serif; background-color: #f0fdf4; padding: 24px;">
      <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 28px; border-top: 6px solid #16a34a; box-shadow: 0 4px 14px rgba(0,0,0,0.06);">
        <div style="text-align: center; margin-bottom: 20px;">
          <span style="background: #dcfce7; color: #15803d; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold;">
            🎉 ¡Buenas noticias de TechParts!
          </span>
          <h2 style="color: #14532d; margin: 12px 0 4px 0;">¡El producto que esperabas ya está disponible!</h2>
          <p style="font-size: 14px; color: #475569; margin: 0;">${greeting} Te avisamos que acabamos de reponer inventario.</p>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 20px 0;">
          <h3 style="margin: 0 0 8px 0; color: #0f172a; font-size: 16px;">${params.productName}</h3>
          ${params.variantName ? `<p style="margin: 0 0 6px 0; font-size: 13px; color: #4338ca;"><strong>Variante:</strong> ${params.variantName}</p>` : ''}
          <p style="margin: 0 0 6px 0; font-size: 12px; color: #64748b;">SKU: <span style="font-family: monospace;">${params.sku}</span></p>
          <p style="margin: 0 0 6px 0; font-size: 14px; color: #16a34a; font-weight: bold;">Precio: $${Number(params.price).toFixed(2)} USD</p>
          <p style="margin: 0; font-size: 12px; color: #64748b;">Unidades reingresadas: <strong>${params.newStock} disponibles</strong></p>
        </div>

        <div style="text-align: center; margin: 24px 0;">
          <a href="http://localhost:5173" style="display: inline-block; background: #16a34a; color: #ffffff; padding: 12px 28px; font-size: 14px; font-weight: bold; text-decoration: none; border-radius: 8px; box-shadow: 0 4px 10px rgba(22, 163, 74, 0.3);">
            Comprar Ahora en TechParts
          </a>
        </div>

        <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
          Recibes este aviso porque te suscribiste a la alerta de reposición en techparts.com.<br/>
          Si necesitas asesoría de compatibilidad para este componente, escríbenos a nuestro WhatsApp oficial: 
          <a href="https://wa.me/593998765432" style="color: #16a34a;">+593 99 876 5432</a>.
        </p>
      </div>
    </body>
    </html>`;

    return this.sendAndLog({
      to: params.customerEmail,
      subject: `¡Ya disponible! ${params.productName} ha vuelto a estar en stock - TechParts`,
      html,
      templateType: 'RESTOCK_NOTIFICATION',
      metadata: { sku: params.sku, productId: params.productId, customerEmail: params.customerEmail },
    });
  }

  /**
   * Obtener registros de auditoría de correos para transparencia y verificación
   */
  static async getEmailLogs(params: { limit?: number; templateType?: string } = {}) {
    const { limit = 50, templateType } = params;
    const where: any = {};
    if (templateType) where.templateType = templateType;

    return prisma.emailLog.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
