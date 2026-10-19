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

    // 3. Crear Variantes de Producto con control de inventario independiente
    console.log('🔀 Configurando variantes de producto con control de stock independiente...');
    const variantsData = [
      {
        productSku: 'SSD-SAM-990P-2TB',
        variants: [
          {
            sku: 'SSD-990P-1TB',
            name: 'Samsung 990 PRO 1TB NVMe M.2 PCIe 4.0',
            capacity: '1TB',
            color: 'Negro',
            modelVariant: 'Standard',
            price: 109.99,
            costPrice: 85.00,
            stock: 15,
            minStock: 3,
          },
          {
            sku: 'SSD-990P-2TB',
            name: 'Samsung 990 PRO 2TB NVMe M.2 PCIe 4.0',
            capacity: '2TB',
            color: 'Negro',
            modelVariant: 'Standard',
            price: 179.99,
            costPrice: 140.00,
            stock: 15,
            minStock: 3,
          },
        ],
      },
      {
        productSku: 'GPU-NV-4070S',
        variants: [
          {
            sku: 'GPU-4070S-STD-BLK',
            name: 'NVIDIA RTX 4070 Super 12GB Standard Edition Negro',
            capacity: '12GB',
            color: 'Negro',
            modelVariant: 'Standard Edition',
            price: 599.99,
            costPrice: 510.00,
            stock: 7,
            minStock: 2,
          },
          {
            sku: 'GPU-4070S-OC-WHT',
            name: 'NVIDIA RTX 4070 Super 12GB OC Edition Blanco',
            capacity: '12GB',
            color: 'Blanco',
            modelVariant: 'OC White Edition',
            price: 639.99,
            costPrice: 535.00,
            stock: 5,
            minStock: 2,
          },
        ],
      },
      {
        productSku: 'RAM-COR-32GB-RGB',
        variants: [
          {
            sku: 'RAM-COR-32G-BLK',
            name: 'Corsair Vengeance RGB 32GB (2x16GB) 6400MHz Negro',
            capacity: '32GB',
            color: 'Negro',
            modelVariant: 'RGB Dual Channel Black',
            price: 139.99,
            costPrice: 105.00,
            stock: 15,
            minStock: 4,
          },
          {
            sku: 'RAM-COR-32G-WHT',
            name: 'Corsair Vengeance RGB 32GB (2x16GB) 6400MHz Blanco',
            capacity: '32GB',
            color: 'Blanco',
            modelVariant: 'RGB Dual Channel White',
            price: 144.99,
            costPrice: 110.00,
            stock: 10,
            minStock: 3,
          },
        ],
      },
    ];

    for (const item of variantsData) {
      const parent = await prisma.product.findUnique({ where: { sku: item.productSku } });
      if (!parent) continue;

      let totalVariantStock = 0;

      for (const v of item.variants) {
        totalVariantStock += v.stock;
        const vStatus = v.stock === 0 ? 'OUT_OF_STOCK' : v.stock <= v.minStock ? 'LOW_STOCK' : 'ACTIVE';

        const createdVariant = await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: {
            name: v.name,
            capacity: v.capacity,
            color: v.color,
            modelVariant: v.modelVariant,
            price: v.price,
            costPrice: v.costPrice,
            stock: v.stock,
            minStock: v.minStock,
            status: vStatus,
          },
          create: {
            productId: parent.id,
            sku: v.sku,
            name: v.name,
            capacity: v.capacity,
            color: v.color,
            modelVariant: v.modelVariant,
            price: v.price,
            costPrice: v.costPrice,
            stock: v.stock,
            minStock: v.minStock,
            status: vStatus,
          },
        });

        const vTxCount = await prisma.inventoryTransaction.count({
          where: { variantId: createdVariant.id },
        });

        if (vTxCount === 0 && v.stock > 0) {
          await prisma.inventoryTransaction.create({
            data: {
              productId: parent.id,
              variantId: createdVariant.id,
              type: 'IN',
              quantity: v.stock,
              previousStock: 0,
              newStock: v.stock,
              reason: 'Carga inicial de inventario de variante',
              reference: `VAR-INIT-${v.sku}`,
            },
          });
        }
      }

      // Actualizar producto padre con stock consolidado e indicador hasVariants
      await prisma.product.update({
        where: { id: parent.id },
        data: {
          hasVariants: true,
          stock: totalVariantStock,
          status: totalVariantStock === 0 ? 'OUT_OF_STOCK' : totalVariantStock <= parent.minStock ? 'LOW_STOCK' : 'ACTIVE',
        },
      });
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
