import prisma from '../src/utils/prisma';
import { InventoryService } from '../src/services/inventory.service';

interface TestSummary {
  name: string;
  passed: boolean;
  timeMs: number;
  details: string;
}

const summaryResults: TestSummary[] = [];

function printHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  console.log(`🧪 ${title}`);
  console.log('='.repeat(70));
}

function printResult(name: string, passed: boolean, timeMs: number, details: string) {
  const icon = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${icon} [${timeMs}ms] ${name}`);
  console.log(`   └─ ${details}`);
  summaryResults.push({ name, passed, timeMs, details });
}

async function runTestSuite() {
  console.log('╔════════════════════════════════════════════════════════════════════╗');
  console.log('║       TECHPARTS - SUITE DE AUDITORÍA Y TESTING ACID (DEV 1)        ║');
  console.log('║       Consistencia, Aislamiento y Concurrencia en PostgreSQL       ║');
  console.log('╚════════════════════════════════════════════════════════════════════╝');

  // Verificar conexión a base de datos
  try {
    const [{ version }] = await prisma.$queryRaw<any[]>`SELECT version()`;
    console.log(`📦 Motor de Base de Datos: ${version.split(' on ')[0]}`);
    console.log(`🔒 Nivel de Aislamiento: READ COMMITTED con Bloqueo Exclusivo Pessimistic (FOR UPDATE)`);
  } catch (err: any) {
    console.error('❌ Error fatal de conexión a PostgreSQL:', err.message);
    process.exit(1);
  }

  // Preparar categoría de pruebas
  const testCategory = await prisma.category.upsert({
    where: { slug: 'pruebas-acid' },
    update: {},
    create: {
      name: 'Entorno de Pruebas ACID',
      slug: 'pruebas-acid',
      description: 'Categoría para validación de concurrencia y consistencia',
    },
  });

  // =========================================================================
  // TEST 1: Concurrencia Extrema en Producto Simple (Garantía Cero Sobreventas)
  // =========================================================================
  printHeader('TEST 1: Concurrencia Extrema en Producto Simple (Anti-Overselling)');
  {
    const start = performance.now();
    const INITIAL_STOCK = 10;
    const CONCURRENT_CLIENTS = 25;
    const QUANTITY_PER_CLIENT = 1;

    // Crear o reiniciar producto de prueba
    const testProduct = await prisma.product.upsert({
      where: { sku: 'TEST-ACID-PROD-01' },
      update: { stock: INITIAL_STOCK, status: 'ACTIVE' },
      create: {
        sku: 'TEST-ACID-PROD-01',
        name: 'Componente Benchmark Concurrencia ACID',
        brand: 'TechParts Bench',
        model: 'TP-BENCH-100',
        price: 199.99,
        costPrice: 150.00,
        stock: INITIAL_STOCK,
        minStock: 2,
        status: 'ACTIVE',
        categoryId: testCategory.id,
      },
    });

    const testRef = `ACID-T1-${Date.now()}`;

    // Disparar 25 compras simultáneas contra un stock de 10
    console.log(`🚀 Disparando ${CONCURRENT_CLIENTS} compras simultáneas concurrentes (Stock inicial: ${INITIAL_STOCK})...`);
    const requests = Array.from({ length: CONCURRENT_CLIENTS }).map((_, idx) =>
      InventoryService.registerMovement({
        productId: testProduct.id,
        type: 'OUT',
        quantity: QUANTITY_PER_CLIENT,
        reason: `Compra concurrente hilo #${idx + 1}`,
        reference: testRef,
      })
    );

    const outcomes = await Promise.allSettled(requests);
    const end = performance.now();
    const duration = Math.round(end - start);

    const successes = outcomes.filter((o) => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    const refreshed = await prisma.product.findUnique({ where: { id: testProduct.id } });
    const finalStock = refreshed?.stock ?? -1;
    const txRecords = await prisma.inventoryTransaction.count({ where: { reference: testRef } });

    const passed =
      successes.length === INITIAL_STOCK &&
      failures.length === CONCURRENT_CLIENTS - INITIAL_STOCK &&
      finalStock === 0 &&
      txRecords === INITIAL_STOCK;

    printResult(
      'Garantía Cero Sobreventas (Zero Overselling)',
      passed,
      duration,
      `Exitosas: ${successes.length}/${INITIAL_STOCK} | Rechazadas por falta de stock: ${failures.length}/${CONCURRENT_CLIENTS - INITIAL_STOCK} | Stock final: ${finalStock} (Nunca negativo) | Auditorías: ${txRecords}`
    );
  }

  // =========================================================================
  // TEST 2: Concurrencia en Variantes de Producto (Aislamiento de Variaciones)
  // =========================================================================
  printHeader('TEST 2: Concurrencia en Variantes de Producto (Stock Independiente)');
  {
    const start = performance.now();
    const VARIANT_STOCK = 5;
    const CONCURRENT_CLIENTS = 15;

    // Crear producto con variantes
    const varParent = await prisma.product.upsert({
      where: { sku: 'TEST-ACID-GPU-VAR' },
      update: { stock: 15, hasVariants: true },
      create: {
        sku: 'TEST-ACID-GPU-VAR',
        name: 'GPU Variable TechParts Super',
        brand: 'TechParts Bench',
        model: 'TP-GPU-VAR',
        price: 699.99,
        costPrice: 550.00,
        stock: 15,
        minStock: 2,
        hasVariants: true,
        categoryId: testCategory.id,
      },
    });

    const testVariant = await prisma.productVariant.upsert({
      where: { sku: 'TEST-VAR-12GB-OC' },
      update: { stock: VARIANT_STOCK, status: 'ACTIVE' },
      create: {
        productId: varParent.id,
        sku: 'TEST-VAR-12GB-OC',
        name: '12GB OC Edition Blanco',
        capacity: '12GB',
        color: 'Blanco',
        modelVariant: 'OC Edition',
        price: 729.99,
        costPrice: 580.00,
        stock: VARIANT_STOCK,
        minStock: 1,
        status: 'ACTIVE',
      },
    });

    const testRef = `ACID-T2-${Date.now()}`;
    console.log(`🚀 Disparando ${CONCURRENT_CLIENTS} salidas concurrentes sobre la variante ${testVariant.sku} (Stock: ${VARIANT_STOCK})...`);

    const requests = Array.from({ length: CONCURRENT_CLIENTS }).map((_, idx) =>
      InventoryService.registerMovement({
        productId: varParent.id,
        variantId: testVariant.id,
        type: 'OUT',
        quantity: 1,
        reason: `Venta concurrente de variante #${idx + 1}`,
        reference: testRef,
      })
    );

    const outcomes = await Promise.allSettled(requests);
    const duration = Math.round(performance.now() - start);

    const successes = outcomes.filter((o) => o.status === 'fulfilled');
    const failures = outcomes.filter((o) => o.status === 'rejected');

    const refreshedVar = await prisma.productVariant.findUnique({ where: { id: testVariant.id } });
    const finalVarStock = refreshedVar?.stock ?? -1;
    const txRecords = await prisma.inventoryTransaction.count({ where: { reference: testRef } });

    const passed =
      successes.length === VARIANT_STOCK &&
      failures.length === CONCURRENT_CLIENTS - VARIANT_STOCK &&
      finalVarStock === 0 &&
      txRecords === VARIANT_STOCK;

    printResult(
      'Aislamiento de Stock por Variación',
      passed,
      duration,
      `Exitosas: ${successes.length}/${VARIANT_STOCK} | Rechazos: ${failures.length} | Stock variante final: ${finalVarStock} | Auditorías: ${txRecords}`
    );
  }

  // =========================================================================
  // TEST 3: Atomicidad Transaccional & Rollback Ante Excepciones
  // =========================================================================
  printHeader('TEST 3: Atomicidad Transaccional & Rollback Ante Excepciones');
  {
    const start = performance.now();
    const targetProduct = await prisma.product.findFirst({ where: { stock: { gte: 5 } } });

    if (!targetProduct) {
      console.error('No se pudo ejecutar Test 3: Sin productos');
    } else {
      const rollbackResult = await InventoryService.testRollback(targetProduct.id);
      const duration = Math.round(performance.now() - start);

      printResult(
        'Atomicidad y Reversión Automática (Rollback)',
        rollbackResult.atomicityVerified,
        duration,
        `Stock antes: ${rollbackResult.stockBefore} | Stock después: ${rollbackResult.stockAfter} | Huérfanos: ${rollbackResult.orphanTransactionsFound} | ${rollbackResult.message}`
      );
    }
  }

  // =========================================================================
  // TEST 4: Concurrencia Mixta Simultánea (Entradas y Salidas en Paralelo)
  // =========================================================================
  printHeader('TEST 4: Concurrencia Mixta Simultánea (Entradas + Salidas Intercaladas)');
  {
    const start = performance.now();
    const INITIAL_STOCK = 20;
    const IN_OPERATIONS = 10; // +2 c/u = +20
    const OUT_OPERATIONS = 10; // -1 c/u = -10
    const EXPECTED_FINAL = INITIAL_STOCK + IN_OPERATIONS * 2 - OUT_OPERATIONS * 1; // 20 + 20 - 10 = 30

    const mixedProduct = await prisma.product.upsert({
      where: { sku: 'TEST-ACID-MIXED' },
      update: { stock: INITIAL_STOCK, status: 'ACTIVE' },
      create: {
        sku: 'TEST-ACID-MIXED',
        name: 'Item para Estrés de Operaciones Mixtas',
        brand: 'TechParts Bench',
        model: 'TP-MIXED-01',
        price: 89.99,
        costPrice: 60.00,
        stock: INITIAL_STOCK,
        minStock: 5,
        status: 'ACTIVE',
        categoryId: testCategory.id,
      },
    });

    const testRef = `ACID-T4-${Date.now()}`;
    const operations: Promise<any>[] = [];

    // Intercalar entradas y salidas simultáneas
    for (let i = 0; i < IN_OPERATIONS; i++) {
      operations.push(
        InventoryService.registerMovement({
          productId: mixedProduct.id,
          type: 'IN',
          quantity: 2,
          reason: `Ingreso concurrente #${i + 1}`,
          reference: testRef,
        })
      );
      operations.push(
        InventoryService.registerMovement({
          productId: mixedProduct.id,
          type: 'OUT',
          quantity: 1,
          reason: `Venta concurrente #${i + 1}`,
          reference: testRef,
        })
      );
    }

    await Promise.all(operations);
    const duration = Math.round(performance.now() - start);

    const refreshed = await prisma.product.findUnique({ where: { id: mixedProduct.id } });
    const finalStock = refreshed?.stock ?? -1;
    const txRecords = await prisma.inventoryTransaction.count({ where: { reference: testRef } });

    const passed = finalStock === EXPECTED_FINAL && txRecords === IN_OPERATIONS + OUT_OPERATIONS;

    printResult(
      'Consistencia en Operaciones Concurrentes Mixtas',
      passed,
      duration,
      `Inicial: ${INITIAL_STOCK} | Esperado: ${EXPECTED_FINAL} | Obtenido: ${finalStock} | Total Transacciones Auditadas: ${txRecords}/${IN_OPERATIONS + OUT_OPERATIONS}`
    );
  }

  // =========================================================================
  // REPORTE FINAL Y CERTIFICACIÓN ACID
  // =========================================================================
  console.log('\n' + '═'.repeat(70));
  console.log('📊 RESUMEN EJECUTIVO DE AUDITORÍA TRANSACCIONAL ACID');
  console.log('═'.repeat(70));

  const allPassed = summaryResults.every((s) => s.passed);
  const totalDuration = summaryResults.reduce((acc, s) => acc + s.timeMs, 0);

  summaryResults.forEach((s, idx) => {
    const status = s.passed ? '✅ APROBADO' : '❌ FALLIDO';
    console.log(`${idx + 1}. [${status}] ${s.name} (${s.timeMs}ms)`);
  });

  console.log('─'.repeat(70));
  console.log(`⏱️  Tiempo Total de Auditoría: ${totalDuration} ms`);
  console.log(`🏆 Dictamen de Integridad: ${allPassed ? 'CERTIFICADO ACID 100% CONFORME' : 'NO CONFORME'}`);
  console.log('═'.repeat(70) + '\n');

  await prisma.$disconnect();

  if (!allPassed) {
    process.exit(1);
  }
}

runTestSuite().catch((err) => {
  console.error('Error fatal durante la ejecución:', err);
  process.exit(1);
});
