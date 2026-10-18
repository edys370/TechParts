import dotenv from 'dotenv';
import path from 'path';

// Cargar variables desde backend/.env o la raíz si se ejecuta en monorepo
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  databaseUrl: process.env.DATABASE_URL || 'postgresql://techparts_admin:techparts_secret_2026@localhost:5432/techparts_db?schema=public',
  smtp: {
    host: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
    port: parseInt(process.env.SMTP_PORT || '2525', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    fromName: process.env.SMTP_FROM_NAME || 'TechParts Ecuador',
    fromEmail: process.env.SMTP_FROM_EMAIL || 'notificaciones@techparts.com',
    adminEmail: process.env.ADMIN_EMAIL || 'admin@techparts.com',
  },
};
