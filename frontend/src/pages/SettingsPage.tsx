import React, { useState, useEffect } from 'react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { healthService, emailService, subscriptionService } from '../api/apiClient';
import { EmailLog, ProductSubscription } from '../types';
import {
  Database,
  Server,
  Terminal,
  ShieldCheck,
  RefreshCw,
  Mail,
  Send,
  Bell,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';

export const SettingsPage: React.FC = () => {
  const [healthData, setHealthData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Estados para SMTP y Auditoría (Fase 3 - Dev 2 & Dev 3)
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([]);
  const [smtpConfig, setSmtpConfig] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<ProductSubscription[]>([]);
  const [isSendingTestEmail, setIsSendingTestEmail] = useState(false);
  const [testEmailResult, setTestEmailResult] = useState<string | null>(null);

  const fetchHealthAndEmails = async () => {
    setIsLoading(true);
    try {
      const [hData, eData, sData] = await Promise.allSettled([
        healthService.check(),
        emailService.getLogs({ limit: 20 }),
        subscriptionService.getAll({ limit: 20 }),
      ]);

      if (hData.status === 'fulfilled') setHealthData(hData.value);
      if (eData.status === 'fulfilled') {
        setEmailLogs(eData.value.data || []);
        setSmtpConfig(eData.value.smtpConfig || null);
      }
      if (sData.status === 'fulfilled') {
        setSubscriptions(sData.value.data || []);
      }
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
    fetchHealthAndEmails();
  }, []);

  const handleSendTestEmail = async () => {
    setIsSendingTestEmail(true);
    setTestEmailResult(null);
    try {
      const res = await emailService.sendTest();
      setTestEmailResult(res.message || 'Prueba de correo SMTP ejecutada exitosamente.');
      await fetchHealthAndEmails();
    } catch (err: any) {
      setTestEmailResult(`Error al enviar: ${err?.response?.data?.message || err.message}`);
    } finally {
      setIsSendingTestEmail(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">
          Diagnóstico, Servidor SMTP & Auditoría de Notificaciones
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Monitoreo de PostgreSQL en Docker, servicio transaccional SMTP, alertas de stock bajo y avisos de reposición
        </p>
      </div>

      {/* Tarjeta de Estado en Vivo */}
      <Card
        title="Salud de los Servicios"
        subtitle="Verificación de conectividad en tiempo real"
        action={
          <Button variant="outline" size="sm" onClick={fetchHealthAndEmails} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Actualizar Diagnóstico
          </Button>
        }
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 mt-0.5">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Microservicio Backend (Express)</p>
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

          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 flex items-start gap-3">
            <div className="p-2.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 mt-0.5">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">Base de Datos PostgreSQL (Docker)</p>
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

      {/* Configuración del Servidor SMTP (Requerimiento Proyecto.md - Sección 3 & 5) */}
      <Card
        title="Configuración del Servidor SMTP (Transaccional)"
        subtitle="Entorno configurado vía .env (Credenciales y passwords enmascarados según directiva)"
        action={
          <Button
            variant="primary"
            size="sm"
            onClick={handleSendTestEmail}
            isLoading={isSendingTestEmail}
            className="bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5"
          >
            <Send className="w-3.5 h-3.5" /> Enviar Alerta de Prueba SMTP
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Servidor Host SMTP</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {smtpConfig?.host || 'sandbox.smtp.mailtrap.io'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Puerto / Cifrado</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                Puerto {smtpConfig?.port || '2525'} | {smtpConfig?.secure ? 'SSL/TLS' : 'STARTTLS'}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Usuario / Credencial</span>
              <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                {smtpConfig?.configuredUser || '***demo'} (Contraseña Oculta)
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Remitente Oficial</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {smtpConfig?.fromName || 'TechParts Ecuador'} &lt;{smtpConfig?.fromEmail || 'notificaciones@techparts.com'}&gt;
              </span>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 sm:col-span-2">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Correo del Administrador (Alertas de Stock)</span>
              <span className="font-semibold text-indigo-600 dark:text-indigo-400 font-mono">
                {smtpConfig?.adminEmail || 'admin@techparts.com'}
              </span>
            </div>
          </div>

          {testEmailResult && (
            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{testEmailResult}</span>
            </div>
          )}
        </div>
      </Card>

      {/* Auditoría de Correos Transaccionales (Fase 3 - DoD Criterio 3) */}
      <Card
        title="Historial de Auditoría de Correos Transaccionales"
        subtitle="Registro en base de datos de facturas, alertas de stock bajo y avisos de reposición"
      >
        {emailLogs.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            <Mail className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            No hay correos registrados en la auditoría todavía. Realiza una compra o haz clic en "Enviar Alerta de Prueba".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase text-[10px] font-bold">
                  <th className="py-2.5 px-3">Fecha</th>
                  <th className="py-2.5 px-3">Destinatario</th>
                  <th className="py-2.5 px-3">Plantilla / Tipo</th>
                  <th className="py-2.5 px-3">Asunto</th>
                  <th className="py-2.5 px-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {emailLogs.map((log) => {
                  let badgeVariant: 'success' | 'warning' | 'danger' | 'info' = 'info';
                  let typeLabel: string = log.templateType;

                  if (log.templateType === 'INVOICE') {
                    typeLabel = 'Factura Cliente';
                    badgeVariant = 'success';
                  } else if (log.templateType === 'LOW_STOCK_ALERT') {
                    typeLabel = 'Alerta Stock Bajo';
                    badgeVariant = 'warning';
                  } else if (log.templateType === 'RESTOCK_NOTIFICATION') {
                    typeLabel = 'Reposición Cliente';
                    badgeVariant = 'info';
                  } else if (log.templateType === 'NEW_ORDER_ADMIN') {
                    typeLabel = 'Nuevo Pedido Admin';
                    badgeVariant = 'info';
                  }

                  return (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 font-sans">
                      <td className="py-2.5 px-3 text-[11px] text-slate-500 whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString('es-EC')}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-800 dark:text-slate-200">
                        {log.recipient}
                      </td>
                      <td className="py-2.5 px-3">
                        <Badge variant={badgeVariant} size="sm">{typeLabel}</Badge>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 max-w-xs truncate">
                        {log.subject}
                      </td>
                      <td className="py-2.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                            log.status === 'SENT' || log.status === 'SIMULATED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          {log.status === 'SIMULATED' ? 'SIMULADO' : log.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Clientes Suscritos a "Vuelve a estar disponible" */}
      <Card
        title="Suscripciones de Clientes ('Vuelve a estar disponible')"
        subtitle="Clientes esperando reabastecimiento de componentes agotados"
      >
        {subscriptions.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-400">
            <Bell className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            No hay solicitudes de suscripción pendientes actualmente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase text-[10px] font-bold">
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3">Correo</th>
                  <th className="py-2 px-3">Componente / SKU</th>
                  <th className="py-2 px-3">Estado</th>
                  <th className="py-2 px-3">Fecha Registro</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {subscriptions.map((sub) => (
                  <tr key={sub.id}>
                    <td className="py-2 px-3 font-medium text-slate-800 dark:text-slate-200">
                      {sub.customerName || 'Cliente anónimo'}
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-mono">
                      {sub.email}
                    </td>
                    <td className="py-2 px-3">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {sub.product?.name}
                      </span>
                      {sub.variant && (
                        <span className="block text-[10px] text-indigo-500 font-mono">
                          Variante: {sub.variant.name} ({sub.variant.sku})
                        </span>
                      )}
                    </td>
                    <td className="py-2 px-3">
                      <Badge variant={sub.status === 'NOTIFIED' ? 'success' : 'warning'} size="sm">
                        {sub.status === 'NOTIFIED' ? 'Notificado' : 'En Espera'}
                      </Badge>
                    </td>
                    <td className="py-2 px-3 text-[11px] text-slate-400 whitespace-nowrap">
                      {new Date(sub.createdAt).toLocaleDateString('es-EC')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Seguridad & Arquitectura */}
      <Card title="Garantías de Arquitectura & Seguridad">
        <div className="space-y-2.5 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
            <p>
              <strong>Transacciones ACID en Stock:</strong> Todas las operaciones de ingreso, salida o
              ajuste se ejecutan dentro de bloques <code className="text-blue-600 dark:text-blue-400 font-mono">prisma.$transaction</code> para asegurar consistencia estricta en concurrencia.
            </p>
          </div>
          <div className="flex items-start gap-2">
            <Terminal className="w-4 h-4 text-blue-600 mt-0.5 shrink-0" />
            <p>
              <strong>Prohibición estricta de mail() inseguro:</strong> El envío transaccional opera a través de Nodemailer con protocolo seguro SMTP (puerto 2525 / 587 / 465) y auditoría persistente.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};
export default SettingsPage;
