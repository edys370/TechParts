import { Request, Response, NextFunction } from 'express';
import { EmailService } from '../services/email.service';
import { config } from '../config';

export class EmailController {
  static async getLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit, templateType } = req.query;
      const logs = await EmailService.getEmailLogs({
        limit: limit ? parseInt(limit as string, 10) : 50,
        templateType: templateType as string,
      });

      res.json({
        success: true,
        total: logs.length,
        smtpConfig: {
          host: config.smtp.host,
          port: config.smtp.port,
          secure: config.smtp.secure,
          fromName: config.smtp.fromName,
          fromEmail: config.smtp.fromEmail,
          adminEmail: config.smtp.adminEmail,
          configuredUser: config.smtp.user ? '***' + config.smtp.user.slice(-3) : '(none)',
        },
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  static async sendTest(req: Request, res: Response, next: NextFunction) {
    try {
      const { to = config.smtp.adminEmail } = req.body;
      const result = await EmailService.sendLowStockAlertEmail({
        productName: 'ASUS ROG Swift OLED PG27AQDM',
        sku: 'MON-ASUS-27OLED',
        variantName: '27 Pulgadas / 240Hz',
        currentStock: 2,
        minStock: 5,
        productId: 1,
        variantId: 1,
      });

      res.json({
        success: true,
        message: 'Prueba de envío SMTP ejecutada correctamente',
        result,
      });
    } catch (error) {
      next(error);
    }
  }
}
