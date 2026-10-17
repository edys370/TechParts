import { Request, Response } from 'express';
import prisma from '../utils/prisma';

export class HealthController {
  static async check(_req: Request, res: Response) {
    let dbStatus = 'disconnected';
    let dbLatencyMs = 0;

    try {
      const start = Date.now();
      await prisma.$queryRaw`SELECT 1`;
      dbLatencyMs = Date.now() - start;
      dbStatus = 'healthy';
    } catch (err: any) {
      dbStatus = `unhealthy: ${err.message}`;
    }

    const isHealthy = dbStatus === 'healthy';

    return res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? 'OK' : 'DEGRADED',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      service: 'TechParts API Microservice',
      environment: process.env.NODE_ENV || 'development',
      database: {
        engine: 'PostgreSQL',
        status: dbStatus,
        latencyMs: dbLatencyMs,
      },
    });
  }
}
