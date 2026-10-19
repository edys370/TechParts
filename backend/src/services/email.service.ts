import nodemailer, { Transporter } from 'nodemailer';
import { config } from '../config';

export interface OrderItem {
  name: string;
  sku: string;
  variantName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderInvoiceData {
  orderNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  shippingAddress: string;
  shippingCity: string;
  shippingZone: string;
  shippingCost: number;
  paymentMethod: 'TRANSFERENCIA_BANCARIA' | 'CONTRA_ENTREGA' | 'PASARELA_SANDBOX';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderDate?: string;
}

export class EmailService {
  private static transporter: Transporter | null = null;

  /**
   * Inicializa el transporter de Nodemailer con configuración SMTP segura.
   * Prohíbe expresamente el uso de mail() o sockets desprotegidos.
   * Si no se configuran credenciales en desarrollo, aprovisiona un inbox de pruebas seguro (Ethereal).
   */
  private static async getTransporter(): Promise<Transporter> {
    if (!this.transporter) {
      const hasAuth = !!config.smtp.user && !!config.smtp.pass;

      if (!hasAuth && config.nodeEnv !== 'production') {
        try {
          console.log('ℹ️ Credenciales SMTP no detectadas en .env. Aprovisionando servidor de prueba Ethereal...');
          const testAccount = await nodemailer.createTestAccount();
          this.transporter = nodemailer.createTransport({
            host: testAccount.smtp.host,
            port: testAccount.smtp.port,
            secure: testAccount.smtp.secure,
            auth: {
              user: testAccount.user,
              pass: testAccount.pass,
            },
          });
        } catch (e) {
          this.transporter = nodemailer.createTransport({
            host: config.smtp.host,
            port: config.smtp.port,
            secure: config.smtp.secure,
          });
        }
      } else {
        this.transporter = nodemailer.createTransport({
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          auth: hasAuth
            ? {
                user: config.smtp.user,
                pass: config.smtp.pass,
              }
            : undefined,
          tls: {
            rejectUnauthorized: config.nodeEnv === 'production',
          },
        });
      }
    }

    return this.transporter;
  }

  /**
   * Verifica la conectividad y handshake con el servidor SMTP.
   */
  static async verifyConnection(): Promise<{ success: boolean; message: string; host: string; port: number }> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      return {
        success: true,
        message: 'Servidor SMTP conectado y autenticado exitosamente',
        host: config.smtp.host,
        port: config.smtp.port,
      };
    } catch (error: any) {
      console.error('❌ Error al conectar con el servidor SMTP:', error.message);
      return {
        success: false,
        message: `Fallo de conexión SMTP: ${error.message}`,
        host: config.smtp.host,
        port: config.smtp.port,
      };
    }
  }

  /**
   * Genera el encabezado HTML común con la identidad visual de TechParts (Google Stitch & Deep Blue).
   */
  private static getHeaderHtml(title: string, subtitle?: string): string {
    return `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; color: #0f172a; }
          .container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); }
          .header { background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
          .brand-badge { display: inline-block; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
          .content { padding: 32px 24px; }
          .footer { background: #f1f5f9; padding: 24px; text-align: center; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; }
          .table { width: 100%; border-collapse: collapse; margin-top: 16px; margin-bottom: 16px; }
          .table th { background: #f8fafc; padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; color: #475569; text-transform: uppercase; border-bottom: 2px solid #e2e8f0; }
          .table td { padding: 12px; border-bottom: 1px solid #f1f5f9; font-size: 13px; }
          .badge-status { display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 600; }
          .badge-success { background: #ecfdf5; color: #047857; border: 1px solid #a7f3d0; }
          .badge-warning { background: #fffbeb; color: #b45309; border: 1px solid #fde68a; }
          .badge-info { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
          .summary-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-top: 20px; }
          .summary-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 13px; }
          .summary-total { display: flex; justify-content: space-between; margin-top: 12px; padding-top: 12px; border-top: 2px dashed #cbd5e1; font-size: 16px; font-weight: 800; color: #0f172a; }
          .btn-wa { display: inline-block; background: #10b981; color: #ffffff !important; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="brand-badge">TechParts Hardware & Store</div>
            <h1>${title}</h1>
            ${subtitle ? `<p>${subtitle}</p>` : ''}
          </div>
          <div class="content">
    `;
  }

  /**
   * Genera el pie de página HTML común con enlaces de WhatsApp y políticas.
   */
  private static getFooterHtml(): string {
    return `
          </div>
          <div class="footer">
            <p style="margin: 0 0 8px 0; font-weight: 600; color: #334155;">TechParts - Tienda de Componentes de PC y Accesorios</p>
            <p style="margin: 0 0 8px 0;">Asesoría técnica previa y compatibilidad por WhatsApp: +593 99 999 9999</p>
            <p style="margin: 0; color: #94a3b8;">Horario de Atención: Lunes a Viernes 08:30 - 18:00 | Sábados 09:00 - 13:00</p>
            <p style="margin: 8px 0 0 0; font-size: 10px; color: #cbd5e1;">Este es un correo transaccional generado automáticamente bajo protocolo SMTP seguro. No respondas a esta dirección.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  /**
   * Envía la Factura Digital Transaccional al Cliente por compra confirmada.
   */
  static async sendOrderInvoice(data: OrderInvoiceData): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const transporter = await this.getTransporter();
    const dateFormatted = data.orderDate || new Date().toLocaleString('es-ES', { dateStyle: 'long', timeStyle: 'short' });

    const paymentLabels = {
      TRANSFERENCIA_BANCARIA: 'Transferencia Bancaria Directa',
      CONTRA_ENTREGA: 'Pago Contra Entrega (Efectivo / Tarjeta al recibir)',
      PASARELA_SANDBOX: 'Pasarela Digital en Modo Pruebas',
    };

    let itemsHtml = '';
    data.items.forEach((item) => {
      itemsHtml += `
        <tr>
          <td>
            <strong>${item.name}</strong><br/>
            <span style="font-size: 11px; color: #64748b;">SKU: ${item.sku} ${item.variantName ? `• Var: ${item.variantName}` : ''}</span>
          </td>
          <td style="text-align: center;">${item.quantity}</td>
          <td style="text-align: right;">$${item.unitPrice.toFixed(2)}</td>
          <td style="text-align: right; font-weight: 600;">$${item.totalPrice.toFixed(2)}</td>
        </tr>
      `;
    });

    const htmlBody = `
      ${this.getHeaderHtml('Factura Digital de Pedido', `Orden #${data.orderNumber} • ${dateFormatted}`)}
      
      <p style="font-size: 14px;">Hola <strong>${data.customerName}</strong>,</p>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        ¡Gracias por tu compra en <strong>TechParts</strong>! Hemos recibido tu orden y tu factura digital ha sido generada exitosamente. A continuación tienes el detalle de los componentes adquiridos:
      </p>

      <table class="table">
        <thead>
          <tr>
            <th>Producto / Componente</th>
            <th style="text-align: center;">Cant.</th>
            <th style="text-align: right;">Precio</th>
            <th style="text-align: right;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>

      <div class="summary-card">
        <div class="summary-row">
          <span style="color: #64748b;">Subtotal componentes:</span>
          <span style="font-weight: 600;">$${data.subtotal.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span style="color: #64748b;">Envío (${data.shippingZone}):</span>
          <span style="font-weight: 600;">$${data.shippingCost.toFixed(2)}</span>
        </div>
        <div class="summary-row">
          <span style="color: #64748b;">Impuestos aplicados:</span>
          <span style="font-weight: 600;">$${data.tax.toFixed(2)}</span>
        </div>
        <div class="summary-total">
          <span>Total Pagado:</span>
          <span style="color: #2563eb;">$${data.total.toFixed(2)} USD</span>
        </div>
      </div>

      <div style="margin-top: 24px; padding: 16px; background: #eff6ff; border-radius: 12px; border: 1px solid #bfdbfe; font-size: 12px;">
        <h4 style="margin: 0 0 8px 0; color: #1e40af; font-size: 13px;">Información de Envío y Pago</h4>
        <p style="margin: 0 0 4px 0;"><strong>Destinatario:</strong> ${data.customerName} (${data.customerEmail})</p>
        <p style="margin: 0 0 4px 0;"><strong>Dirección:</strong> ${data.shippingAddress}, ${data.shippingCity}</p>
        <p style="margin: 0;"><strong>Método de Pago:</strong> <span class="badge-status badge-info">${paymentLabels[data.paymentMethod]}</span></p>
      </div>

      <div style="text-align: center; margin-top: 24px;">
        <p style="font-size: 12px; color: #64748b; margin-bottom: 4px;">¿Deseas verificar la compatibilidad de montaje o instalación?</p>
        <a href="https://wa.me/593999999999?text=${encodeURIComponent(`Hola TechParts, tengo una consulta técnica sobre mi orden #${data.orderNumber}`)}" target="_blank" class="btn-wa">
          Consultar Soporte Técnico por WhatsApp
        </a>
      </div>

      ${this.getFooterHtml()}
    `;

    const info = await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: data.customerEmail,
      subject: `📄 Factura Digital - Orden #${data.orderNumber} | TechParts`,
      html: htmlBody,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    if (previewUrl) {
      console.log(`📨 Vista previa del correo de factura (Mailtrap / Ethereal): ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Envía la Notificación de "Nuevo Pedido" al Administrador de la Tienda.
   */
  static async sendAdminNewOrderAlert(data: OrderInvoiceData): Promise<{ success: boolean; messageId?: string; previewUrl?: string }> {
    const transporter = await this.getTransporter();

    let itemsSummary = data.items.map((i) => `<li><strong>${i.name}</strong> (${i.sku}) x ${i.quantity} uds. - $${i.totalPrice.toFixed(2)}</li>`).join('');

    const htmlBody = `
      ${this.getHeaderHtml('🚨 Alerta: Nuevo Pedido Registrado', `Orden #${data.orderNumber} por $${data.total.toFixed(2)} USD`)}
      
      <p style="font-size: 14px;">Estimado <strong>Administrador de TechParts</strong>,</p>
      <p style="font-size: 13px; color: #475569;">
        Se ha completado una nueva transacción en la tienda. Revisa el stock disponible y prepara el paquete para despacho:
      </p>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; margin-bottom: 20px;">
        <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a;">Datos del Cliente</h4>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Cliente:</strong> ${data.customerName}</p>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Correo:</strong> ${data.customerEmail}</p>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Teléfono:</strong> ${data.customerPhone || 'No proporcionado'}</p>
        <p style="margin: 0 0 4px 0; font-size: 12px;"><strong>Destino:</strong> ${data.shippingAddress}, ${data.shippingCity} (${data.shippingZone})</p>
        <p style="margin: 0; font-size: 12px;"><strong>Método de Pago:</strong> ${data.paymentMethod}</p>
      </div>

      <h4 style="margin: 0 0 10px 0; font-size: 13px; color: #0f172a;">Artículos a Despachar:</h4>
      <ul style="font-size: 13px; color: #334155; padding-left: 20px; line-height: 1.6;">
        ${itemsSummary}
      </ul>

      <div style="margin-top: 24px; text-align: center;">
        <a href="http://localhost:5173" style="display: inline-block; background: #2563eb; color: #ffffff; padding: 12px 24px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 13px;">
          Abrir Panel de Control TechParts
        </a>
      </div>

      ${this.getFooterHtml()}
    `;

    const info = await transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: config.smtp.adminEmail,
      subject: `🚨 [Nuevo Pedido #${data.orderNumber}] $${data.total.toFixed(2)} - ${data.customerName}`,
      html: htmlBody,
    });

    const previewUrl = nodemailer.getTestMessageUrl(info) || undefined;
    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  }

  /**
   * Helper para alerta de stock bajo (disponible para Dev 2 en Fase 3).
   */
  static async sendLowStockAlert(productName: string, sku: string, currentStock: number, minStock: number) {
    const transporter = await this.getTransporter();

    const htmlBody = `
      ${this.getHeaderHtml('⚠️ Alerta Crítica: Stock Bajo', `Componente: ${sku}`)}
      <p style="font-size: 14px;">Atención Administrador,</p>
      <p style="font-size: 13px; color: #475569;">
        El stock del componente <strong>${productName}</strong> (SKU: <code>${sku}</code>) ha caído a 
        <strong style="color: #dc2626;">${currentStock} unidades</strong>, ubicándose por debajo del límite mínimo configurado de ${minStock} unidades.
      </p>
      <p style="font-size: 13px; color: #475569;">
        Por favor gestiona la orden de compra con el proveedor correspondiente para evitar quiebre de inventario.
      </p>
      ${this.getFooterHtml()}
    `;

    return transporter.sendMail({
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: config.smtp.adminEmail,
      subject: `⚠️ [Alerta Stock Bajo] ${sku} - Quedan ${currentStock} unidades`,
      html: htmlBody,
    });
  }
}
