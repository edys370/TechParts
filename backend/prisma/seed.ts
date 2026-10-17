import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

const prisma = new PrismaClient();

interface CsvRow {
  sku: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: string;
  costPrice: string;
  stock: string;
  minStock: string;
  description: string;
}

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}

async function loadCsv(filePath: string): Promise<CsvRow[]> {
  return new Promise((resolve, reject) => {
    const results: CsvRow[] = [];
    if (!fs.existsSync(filePath)) {
      return resolve([]);
    }
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

async function main() {
  console.log('🌱 Iniciando migración y seed de datos para TechParts...');

  // 1. Crear usuarios iniciales
  console.log('👤 Creando usuarios base...');
  await prisma.user.upsert({
    where: { email: 'admin@techparts.com' },
    update: {},
    create: {
      email: 'admin@techparts.com',
      name: 'Administrador Principal',
      role: 'ADMIN',
    },
  });

  await prisma.user.upsert({
    where: { email: 'operador@techparts.com' },
    update: {},
    create: {
      email: 'operador@techparts.com',
      name: 'Operador de Almacén',
      role: 'OPERATOR',
    },
  });

  // 2. Cargar inventario desde CSV
  const csvPath = path.resolve(__dirname, '../../data/initial_inventory.csv');
  const rows = await loadCsv(csvPath);

  if (rows.length === 0) {
    console.log('⚠️ No se encontró initial_inventory.csv o está vacío. Usando datos de respaldo...');
  } else {
    console.log(`📦 Encontradas ${rows.length} filas en CSV. Procesando categorías y productos...`);

    // Procesar categorías únicas
    const categoryMap = new Map<string, number>();

    for (const row of rows) {
      const categoryName = row.category.trim();
      if (!categoryMap.has(categoryName)) {
        const cat = await prisma.category.upsert({
          where: { name: categoryName },
          update: {},
          create: {
            name: categoryName,
            slug: slugify(categoryName),
            description: `Componentes y partes de la categoría ${categoryName}`,
          },
        });
        categoryMap.set(categoryName, cat.id);
      }
    }

    // Insertar productos y transacciones iniciales
    for (const row of rows) {
      const categoryId = categoryMap.get(row.category.trim())!;
      const stock = parseInt(row.stock, 10) || 0;
      const minStock = parseInt(row.minStock, 10) || 5;
      const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= minStock ? 'LOW_STOCK' : 'ACTIVE';

      const product = await prisma.product.upsert({
        where: { sku: row.sku.trim() },
        update: {
          name: row.name.trim(),
          brand: row.brand.trim(),
          model: row.model.trim(),
          price: parseFloat(row.price),
          costPrice: parseFloat(row.costPrice),
          stock,
          minStock,
          status,
          description: row.description?.trim(),
          categoryId,
        },
        create: {
          sku: row.sku.trim(),
          name: row.name.trim(),
          brand: row.brand.trim(),
          model: row.model.trim(),
          price: parseFloat(row.price),
          costPrice: parseFloat(row.costPrice),
          stock,
          minStock,
          status,
          description: row.description?.trim(),
          categoryId,
        },
      });

      // Crear transacción inicial de inventario si no existe ninguna
      const txCount = await prisma.inventoryTransaction.count({
        where: { productId: product.id },
      });

      if (txCount === 0 && stock > 0) {
        await prisma.inventoryTransaction.create({
          data: {
            productId: product.id,
            type: 'IN',
            quantity: stock,
            previousStock: 0,
            newStock: stock,
            reason: 'Carga inicial de inventario desde Google Sheets / CSV',
            reference: 'MIGRACION-INICIAL-001',
          },
        });
      }
    }
  }

  console.log('✅ Seed completado satisfactoriamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
