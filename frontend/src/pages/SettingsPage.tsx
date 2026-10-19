import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { healthService, emailService } from '../api/apiClient';
import { Database, Server, Terminal, ShieldCheck, RefreshCw, Mail } from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados de prueba SMTP
  const [isVerifyingSmtp, setIsVerifyingSmtp] = useState(false);
  const [isSendingInvoice, setIsSendingInvoice] = useState(false);
  const [testEmail, setTestEmail] = useState('cliente.demo@techparts.com');
  const [smtpResult, setSmtpResult] = useState<{ success: boolean; message: string; previewUrl?: string } | null>(null);

  const fetchHealth = async () => {
    setIsLoading(true);
    try {
      const data = await healthService.check();
      setHealthData(data);
    } catch (err: any) {
      setHealthData({
        status: 'DEGRADED',
        error: err.message,
        database: { status: 'disconnected', latencyMs: 0 },
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, []);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900">Diagnóstico & Configuración del Sistema</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Estado de PostgreSQL, microservicio Node.js y orquestación con Docker Compose
        </p>
      </div>

      {/* Tarjeta de Estado en Vivo */}
      <Card
        title="Salud de los Servicios"
        subtitle="Verificación de conectividad en tiempo real"
        action={
          <Button variant="outline" size="sm" onClick={fetchHealth} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Probar Conexión
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Microservicio Backend (Express)</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge variant={healthData?.status === 'OK' ? 'success' : 'danger'} size="sm">
                  {healthData?.status === 'OK' ? 'Activo & Saludable' : 'Inaccesible'}
                </Badge>
                <span className="text-[11px] text-slate-500">
                  Uptime: {healthData?.uptime ? `${Math.round(healthData.uptime)}s` : 'N/A'}
                </span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 text-emerald-700 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800">Base de Datos PostgreSQL (Docker)</p>
              <div className="mt-1 flex items-center gap-2">
                <Badge
                  variant={healthData?.database?.status === 'healthy' ? 'success' : 'danger'}
                  size="sm"
                >
                  {healthData?.database?.status === 'healthy' ? 'Conectado (ACID)' : 'Desconectado'}
                </Badge>
                {healthData?.database?.latencyMs !== undefined && (
                  <span className="text-[11px] text-slate-500">
                    Latencia: {healthData.database.latencyMs} ms
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Tarjeta de Diagnóstico SMTP y Envío de Factura de Prueba */}
      <Card
        title="Servicio de Correos Transaccionales (SMTP)"
        subtitle="Verificación de servidor SMTP (Mailtrap / Brevo) y prueba de factura digital"
      >
        <div className="space-y-4 text-xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <p className="font-semibold text-slate-800">Prueba de Conexión SMTP</p>
              <p className="text-slate-500 mt-0.5">Verifica autenticación y puerto (puerto 2525 / 587)</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                setIsVerifyingSmtp(true);
                setSmtpResult(null);
                try {
                  const res = await emailService.verify();
                  setSmtpResult({ success: res.success, message: res.message });
                } catch (err: any) {
                  setSmtpResult({ success: false, message: err?.response?.data?.message || err.message });
                } finally {
                  setIsVerifyingSmtp(false);
                }
              }}
              isLoading={isVerifyingSmtp}
            >
              Verificar Conexión SMTP
            </Button>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <div>
              <p className="font-semibold text-slate-800">Enviar Factura de Demostración</p>
              <p className="text-slate-500 mt-0.5">Dispara una factura con componentes y formato oficial de TechParts</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="email"
                placeholder="correo.destino@ejemplo.com"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Button
                variant="primary"
                size="sm"
                onClick={async () => {
                  if (!testEmail) return;
                  setIsSendingInvoice(true);
                  setSmtpResult(null);
                  try {
                    const res = await emailService.sendTestInvoice(testEmail);
                    setSmtpResult({
                      success: true,
                      message: res.message || 'Factura enviada exitosamente',
                      previewUrl: res.previewUrl,
                    });
                  } catch (err: any) {
                    setSmtpResult({ success: false, message: err?.response?.data?.message || err.message });
                  } finally {
                    setIsSendingInvoice(false);
                  }
                }}
                isLoading={isSendingInvoice}
              >
                Enviar Factura Demo
              </Button>
            </div>
          </div>

          {smtpResult && (
            <div
              className={`p-3 rounded-xl border text-xs ${
                smtpResult.success
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <p className="font-medium">{smtpResult.message}</p>
              {smtpResult.previewUrl && (
                <p className="mt-1">
                  <a
                    href={smtpResult.previewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline text-blue-600 font-semibold"
                  >
                    Abrir vista previa del correo en navegador ↗
                  </a>
                </p>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Guía de Comandos Rápidos */}
      <Card
        title="Comandos Útiles de la Plataforma"
        subtitle="Ejecución desde la raíz del proyecto /techparts"
      >
        <div className="space-y-3 text-xs">
          <div className="p-3 bg-slate-900 text-slate-100 rounded-xl font-mono space-y-1.5">
            <p className="text-slate-400"># 1. Iniciar la base de datos PostgreSQL con Docker Compose:</p>
            <p className="text-emerald-400">npm run db:up</p>
            <p className="text-slate-400 pt-2"># 2. Aplicar migraciones y ejecutar seed inicial desde CSV:</p>
            <p className="text-emerald-400">npm run db:migrate && npm run db:seed</p>
            <p className="text-slate-400 pt-2"># 3. Iniciar el Backend (Node.js + Express):</p>
            <p className="text-emerald-400">npm run dev:backend</p>
            <p className="text-slate-400 pt-2"># 4. Iniciar el Frontend (React + Vite):</p>
            <p className="text-emerald-400">npm run dev:frontend</p>
          </div>
        </div>
      </Card>

      {/* Seguridad & Arquitectura */}
      <Card title="Garantías de Arquitectura & Seguridad">
        <div className="space-y-2.5 text-xs text-slate-600">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p>
              <strong>Transacciones ACID en Stock:</strong> Todas las operaciones de ingreso, salida o
              ajuste se ejecutan dentro de bloques <code className="text-blue-600 font-mono">prisma.$transaction</code> para asegurar consistencia estricta en concurrencia.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Terminal className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p>
              <strong>Tipado Estricto de Extremo a Extremo:</strong> Modelos en Prisma, esquemas de validación Zod en Express y TypeScript en React garantizan cero inconsistencias en datos de inventario.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
