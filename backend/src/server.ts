import app from './app';
import { config } from './config';
import prisma from './utils/prisma';

async function bootstrap() {
  try {
    // Verificar conexión preliminar a base de datos
    await prisma.$connect();
    console.log('✅ Conexión establecida con la base de datos PostgreSQL.');

    const server = app.listen(config.port, () => {
      console.log(`🚀 Servidor TechParts API escuchando en el puerto ${config.port}`);
      console.log(`📡 Healthcheck disponible en: http://localhost:${config.port}/api/health`);
    });

    // Cierre ordenado (graceful shutdown)
    const gracefulShutdown = async (signal: string) => {
      console.log(`🛑 Señal ${signal} recibida. Cerrando conexiones...`);
      server.close(async () => {
        await prisma.$disconnect();
        console.log('🔌 Conexión con PostgreSQL cerrada. Servidor apagado.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  } catch (error) {
    console.error('❌ Error fatal al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
