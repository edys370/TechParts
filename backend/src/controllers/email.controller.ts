import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';

export class EmailController {
  /**
   * Verifica la conexión y apretón de manos con el servidor SMTP configurado.
   */
  static async verify(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await EmailService.verifyConnection();
      return res.status(result.success ? 200 : 503).json(result);
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Envía factura digital transaccional al cliente.
   */
  static async sendInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceData = req.body;
      const result = await EmailService.sendOrderInvoice(invoiceData);
      return res.status(200).json({
        ...result,
        message: `Factura digital enviada correctamente a ${invoiceData.customerEmail}`,
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Notifica un nuevo pedido al correo del administrador.
   */
  static async notifyAdmin(req: Request, res: Response, next: NextFunction) {
    try {
      const orderData = req.body;
      const result = await EmailService.sendAdminNewOrderAlert(orderData);
      return res.status(200).json({
        ...result,
        message: 'Alerta de nuevo pedido enviada al administrador de TechParts',
      });
    } catch (error) {
      return next(error);
    }
  }

  /**
   * Envía un correo de prueba de demostración con factura mockeada para verificar el servidor SMTP.
   */
  static async sendTestInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const recipient = (req.body.to || req.query.to || 'cliente.demo@techparts.com') as string;
      const result = await EmailService.sendOrderInvoice({
        orderNumber: `TP-${Math.floor(100000 + Math.random() * 900000)}`,
        customerName: 'Cliente Prueba TechParts',
        customerEmail: recipient,
        shippingAddress: 'Av. Amazonas y Naciones Unidas',
        shippingCity: 'Quito',
        shippingZone: 'Zona Urbana Express',
        shippingCost: 5.0,
        paymentMethod: 'TRANSFERENCIA_BANCARIA',
        items: [
          {
            name: 'AMD Ryzen 7 7800X3D 8-Core',
            sku: 'CPU-AMD-7800X3D',
            quantity: 1,
            unitPrice: 449.99,
            totalPrice: 449.99,
          },
          {
            name: 'Samsung 990 PRO NVMe M.2 SSD',
            sku: 'SSD-SAM-990P-2TB',
            variantName: '2TB / PCIe 4.0',
            quantity: 1,
            unitPrice: 179.99,
            totalPrice: 179.99,
          },
        ],
        subtotal: 629.98,
        tax: 75.6,
        total: 710.58,
      });

      return res.json({
        ...result,
        message: `Factura de prueba enviada exitosamente a ${recipient}`,
      });
    } catch (error) {
      return next(error);
    }
  }
}
