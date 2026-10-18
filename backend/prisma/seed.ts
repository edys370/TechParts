import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

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

async function main() {
  console.log('🌱 Iniciando migración y seed de datos para TechParts (Fase 1 y Fase 2)...');

  // 1. Limpieza de tablas existentes en orden inverso
  console.log('🧹 Limpiando tablas previas...');
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.shippingZone.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.productVariant.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();

  // 2. Crear usuarios base
  console.log('👤 Creando usuarios base...');
  await prisma.user.createMany({
    data: [
      {
        email: 'admin@techparts.com',
        name: 'Administrador Principal TechParts',
        role: 'ADMIN',
      },
      {
        email: 'operador@techparts.com',
        name: 'Operador de Almacén y Logística',
        role: 'OPERATOR',
      },
    ],
  });

  // 3. Crear Categorías
  console.log('📂 Creando categorías...');
  const categoriesData = [
    { name: 'Procesadores', description: 'CPUs de alto rendimiento Intel Core y AMD Ryzen con sockets modernos.' },
    { name: 'Placas Base', description: 'Motherboards para gaming y productividad con soporte DDR4/DDR5 y PCIe 5.0.' },
    { name: 'Tarjetas Gráficas', description: 'GPUs NVIDIA GeForce RTX y AMD Radeon RX para gaming y diseño.' },
    { name: 'Memorias RAM', description: 'Módulos DDR4 y DDR5 de alta velocidad con disipador e iluminación RGB.' },
    { name: 'Almacenamiento SSD', description: 'Unidades de estado sólido M.2 NVMe PCIe 4.0/5.0 de ultra velocidad.' },
    { name: 'Fuentes de Poder', description: 'Fuentes PSU certificadas 80 Plus Bronze y Gold con diseño modular.' },
  ];

  const categoryMap = new Map<string, number>();
  for (const cat of categoriesData) {
    const created = await prisma.category.create({
      data: {
        name: cat.name,
        slug: slugify(cat.name),
        description: cat.description,
      },
    });
    categoryMap.set(cat.name, created.id);
  }

  // 4. Crear Zonas de Envío (Fase 2)
  console.log('🚚 Configurando zonas geográficas de despacho...');
  const shippingZones = [
    {
      name: 'Zona Local (Pichincha / Quito Metropolitano)',
      code: 'LOCAL_UIO',
      description: 'Despacho express motorizado directo en Quito y valles.',
      cost: 3.50,
      freeThreshold: 500.00,
      estimatedDays: '24 horas laborales',
    },
    {
      name: 'Zona Regional / Costa (Guayas, Manabí, Azuay)',
      code: 'REGIONAL_COSTA',
      description: 'Envío terrestre asegurado mediante Servientrega o courier nacional.',
      cost: 5.50,
      freeThreshold: 500.00,
      estimatedDays: '24 a 48 horas laborales',
    },
    {
      name: 'Zona Nacional (Otras Provincias y Galápagos)',
      code: 'NACIONAL_REST',
      description: 'Cobertura nacional completa a todas las provincias del Ecuador.',
      cost: 8.50,
      freeThreshold: 500.00,
      estimatedDays: '48 a 72 horas laborales',
    },
  ];

  const zoneMap = new Map<string, number>();
  for (const zone of shippingZones) {
    const created = await prisma.shippingZone.create({
      data: zone,
    });
    zoneMap.set(zone.code, created.id);
  }

  // 5. Crear Productos con y sin Variantes (Control de Inventario Independiente)
  console.log('📦 Creando productos con variantes de hardware y especificaciones técnicas...');

  const productsData = [
    // 1. AMD Ryzen 7 7800X3D (CPU)
    {
      sku: 'CPU-AMD-7800X3D',
      name: 'AMD Ryzen 7 7800X3D 8-Core 16-Thread',
      category: 'Procesadores',
      brand: 'AMD',
      model: 'Ryzen 7 7800X3D',
      price: 449.99,
      costPrice: 380.00,
      stock: 24,
      minStock: 5,
      hasVariants: false,
      socket: 'AM5',
      ramType: 'DDR5',
      wattage: 120,
      formFactor: 'Socket AM5',
      description: 'Procesador gaming definitivo con tecnología 3D V-Cache y arquitectura Zen 4. TDP 120W.',
      imageUrl: 'https://images.unsplash.com/photo-1591799264318-7e6ef8ddb7ea?w=600&auto=format&fit=crop&q=80',
    },
    // 2. Intel Core i7-14700K (CPU)
    {
      sku: 'CPU-INT-14700K',
      name: 'Intel Core i7-14700K 20-Core (8P+12E)',
      category: 'Procesadores',
      brand: 'Intel',
      model: 'Core i7-14700K',
      price: 409.99,
      costPrice: 340.00,
      stock: 18,
      minStock: 4,
      hasVariants: false,
      socket: 'LGA1700',
      ramType: 'DDR5',
      wattage: 253,
      formFactor: 'Socket LGA1700',
      description: 'Procesador de 14va generación con 20 núcleos hasta 5.6 GHz con Intel UHD Graphics 770.',
      imageUrl: 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=600&auto=format&fit=crop&q=80',
    },
    // 3. ASUS TUF Gaming B650-PLUS WiFi (Motherboard)
    {
      sku: 'MB-ASU-B650P',
      name: 'ASUS TUF Gaming B650-PLUS WiFi',
      category: 'Placas Base',
      brand: 'ASUS',
      model: 'TUF B650-PLUS',
      price: 219.99,
      costPrice: 175.00,
      stock: 12,
      minStock: 3,
      hasVariants: false,
      socket: 'AM5',
      ramType: 'DDR5',
      wattage: 60,
      formFactor: 'ATX',
      description: 'Placa base Socket AM5 con soporte DDR5, PCIe 5.0 M.2, WiFi 6 y disipación militar VRM.',
      imageUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop&q=80',
    },
    // 4. MSI PRO Z790-A MAX WiFi (Motherboard)
    {
      sku: 'MB-MSI-Z790P',
      name: 'MSI PRO Z790-A MAX WiFi DDR5',
      category: 'Placas Base',
      brand: 'MSI',
      model: 'PRO Z790-A MAX',
      price: 239.99,
      costPrice: 190.00,
      stock: 9,
      minStock: 2,
      hasVariants: false,
      socket: 'LGA1700',
      ramType: 'DDR5',
      wattage: 60,
      formFactor: 'ATX',
      description: 'Placa base ATX LGA 1700 compatible con procesadores Intel Core 12va a 14va generación, Wi-Fi 7 y DDR5.',
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    },
    // 5. NVIDIA GeForce RTX 4070 Super (GPU con Variantes)
    {
      sku: 'GPU-NV-4070S',
      name: 'ASUS Dual GeForce RTX 4070 Super 12GB',
      category: 'Tarjetas Gráficas',
      brand: 'ASUS / NVIDIA',
      model: 'RTX 4070 Super',
      price: 599.99,
      costPrice: 510.00,
      stock: 15,
      minStock: 3,
      hasVariants: true,
      socket: null,
      ramType: null,
      wattage: 220, // TDP GPU
      formFactor: 'PCIe 4.0 x16 (2.5 Slots)',
      description: 'Tarjeta gráfica de alto rendimiento con arquitectura Ada Lovelace y DLSS 3.5. Requiere fuente de al menos 650W.',
      imageUrl: 'https://images.unsplash.com/photo-1587202372634-32705e3bf49c?w=600&auto=format&fit=crop&q=80',
      variants: [
        {
          sku: 'GPU-NV-4070S-STD-BLK',
          name: 'Edición Estándar (Color Negro)',
          capacity: '12GB GDDR6X',
          color: 'Negro',
          modelVariant: 'Standard Dual Fan',
          price: 599.99,
          costPrice: 510.00,
          stock: 9,
          minStock: 2,
        },
        {
          sku: 'GPU-NV-4070S-OC-WHT',
          name: 'Edición OC White (Color Blanco)',
          capacity: '12GB GDDR6X',
          color: 'Blanco',
          modelVariant: 'OC White Edition',
          price: 639.99,
          costPrice: 535.00,
          stock: 6,
          minStock: 2,
        },
      ],
    },
    // 6. AMD Radeon RX 7800 XT (GPU)
    {
      sku: 'GPU-AMD-7800XT',
      name: 'Sapphire Pulse AMD Radeon RX 7800 XT 16GB',
      category: 'Tarjetas Gráficas',
      brand: 'Sapphire / AMD',
      model: 'RX 7800 XT',
      price: 499.99,
      costPrice: 420.00,
      stock: 14,
      minStock: 3,
      hasVariants: false,
      socket: null,
      ramType: null,
      wattage: 263, // TDP GPU
      formFactor: 'PCIe 4.0 x16 (2.5 Slots)',
      description: 'Tarjeta gráfica gaming con 16GB GDDR6 y arquitectura RDNA 3 para 1440p ultra fluido. Requiere PSU 700W+.',
      imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    },
    // 7. Samsung 990 PRO NVMe SSD (Almacenamiento con Variantes de Capacidad)
    {
      sku: 'SSD-SAM-990P',
      name: 'Samsung 990 PRO PCIe 4.0 NVMe M.2 SSD',
      category: 'Almacenamiento SSD',
      brand: 'Samsung',
      model: '990 PRO',
      price: 109.99,
      costPrice: 85.00,
      stock: 42,
      minStock: 8,
      hasVariants: true,
      socket: null,
      ramType: null,
      wattage: 8,
      formFactor: 'M.2 2280 NVMe',
      description: 'Unidad SSD PCIe Gen 4.0 con velocidades de lectura de hasta 7450 MB/s. Máxima durabilidad con disipador de níquel.',
      imageUrl: 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&auto=format&fit=crop&q=80',
      variants: [
        {
          sku: 'SSD-SAM-990P-1TB',
          name: 'Capacidad 1TB (Sin disipador)',
          capacity: '1TB',
          color: 'Negro',
          modelVariant: 'Standard 1TB',
          price: 109.99,
          costPrice: 85.00,
          stock: 22,
          minStock: 4,
        },
        {
          sku: 'SSD-SAM-990P-2TB',
          name: 'Capacidad 2TB (Con disipador térmico)',
          capacity: '2TB',
          color: 'Negro / Grafito',
          modelVariant: 'Heatsink Edition 2TB',
          price: 189.99,
          costPrice: 145.00,
          stock: 14,
          minStock: 3,
        },
        {
          sku: 'SSD-SAM-990P-4TB',
          name: 'Capacidad 4TB Pro Gamer',
          capacity: '4TB',
          color: 'Negro',
          modelVariant: 'Extreme 4TB',
          price: 339.99,
          costPrice: 270.00,
          stock: 6,
          minStock: 2,
        },
      ],
    },
    // 8. Kingston KC3000 SSD
    {
      sku: 'SSD-KNG-KC3000-1TB',
      name: 'Kingston KC3000 1TB PCIe 4.0 NVMe',
      category: 'Almacenamiento SSD',
      brand: 'Kingston',
      model: 'KC3000 1TB',
      price: 94.99,
      costPrice: 72.00,
      stock: 28,
      minStock: 5,
      hasVariants: false,
      socket: null,
      ramType: null,
      wattage: 7,
      formFactor: 'M.2 2280 NVMe',
      description: 'SSD NVMe M.2 de alto rendimiento con controlador Phison E18 y 7000 MB/s.',
      imageUrl: 'https://images.unsplash.com/photo-1544652478-6653e09f18a2?w=600&auto=format&fit=crop&q=80',
    },
    // 9. Corsair Vengeance DDR5 (RAM con Variantes de Color/RGB)
    {
      sku: 'RAM-COR-VEN-DDR5',
      name: 'Corsair Vengeance 32GB (2x16GB) DDR5 6000MHz',
      category: 'Memorias RAM',
      brand: 'Corsair',
      model: 'Vengeance DDR5',
      price: 119.99,
      costPrice: 90.00,
      stock: 35,
      minStock: 6,
      hasVariants: true,
      socket: null,
      ramType: 'DDR5',
      wattage: 15,
      formFactor: 'DIMM 288-pin',
      description: 'Kit de memoria dual channel DDR5 optimizado para perfiles Intel XMP 3.0 y AMD EXPO.',
      imageUrl: 'https://images.unsplash.com/photo-1562976540-1502c2145186?w=600&auto=format&fit=crop&q=80',
      variants: [
        {
          sku: 'RAM-COR-DDR5-BLK',
          name: '32GB Black Standard (Sin RGB)',
          capacity: '32GB (2x16GB)',
          color: 'Negro Matte',
          modelVariant: 'Low-Profile Black',
          price: 119.99,
          costPrice: 90.00,
          stock: 20,
          minStock: 4,
        },
        {
          sku: 'RAM-COR-DDR5-RGB-WHT',
          name: '32GB RGB White Edition (Iluminación iCUE)',
          capacity: '32GB (2x16GB)',
          color: 'Blanco RGB',
          modelVariant: 'RGB White Edition',
          price: 139.99,
          costPrice: 105.00,
          stock: 15,
          minStock: 3,
        },
      ],
    },
    // 10. Crucial Pro 32GB DDR5
    {
      sku: 'RAM-CRU-32GB-DDR5',
      name: 'Crucial Pro 32GB (2x16GB) DDR5 5600MHz',
      category: 'Memorias RAM',
      brand: 'Crucial',
      model: 'Pro DDR5-5600',
      price: 99.99,
      costPrice: 78.00,
      stock: 22,
      minStock: 5,
      hasVariants: false,
      socket: null,
      ramType: 'DDR5',
      wattage: 12,
      formFactor: 'DIMM 288-pin',
      description: 'Memoria RAM DDR5 plug-and-play con disipador de aluminio negro de bajo perfil.',
      imageUrl: 'https://images.unsplash.com/photo-1541029074913-89a19c5372a8?w=600&auto=format&fit=crop&q=80',
    },
    // 11. Corsair RM850x (Fuente de Poder)
    {
      sku: 'PSU-COR-RM850X',
      name: 'Corsair RM850x 850W 80 Plus Gold Modular',
      category: 'Fuentes de Poder',
      brand: 'Corsair',
      model: 'RM850x',
      price: 149.99,
      costPrice: 115.00,
      stock: 16,
      minStock: 4,
      hasVariants: false,
      socket: null,
      ramType: null,
      wattage: 850, // Potencia nominal de la fuente
      formFactor: 'ATX',
      description: 'Fuente de alimentación totalmente modular con condensadores japoneses 105°C y modo cero RPM.',
      imageUrl: 'https://images.unsplash.com/photo-1587202372775-e229f172b9d7?w=600&auto=format&fit=crop&q=80',
    },
    // 12. Seasonic Focus GX-750 (Fuente de Poder)
    {
      sku: 'PSU-SEA-GX750',
      name: 'Seasonic Focus GX-750 750W 80 Plus Gold',
      category: 'Fuentes de Poder',
      brand: 'Seasonic',
      model: 'Focus GX-750',
      price: 129.99,
      costPrice: 98.00,
      stock: 14,
      minStock: 3,
      hasVariants: false,
      socket: null,
      ramType: null,
      wattage: 750, // Potencia nominal
      formFactor: 'ATX',
      description: 'Fuente modular compacta de 750W con certificación 80 Plus Gold y ventilador FDB silencioso.',
      imageUrl: 'https://images.unsplash.com/photo-1555617778-02518510b9fa?w=600&auto=format&fit=crop&q=80',
    },
  ];

  for (const item of productsData) {
    const categoryId = categoryMap.get(item.category)!;

    // Calcular stock total si tiene variantes
    let totalStock = item.stock;
    if (item.variants && item.variants.length > 0) {
      totalStock = item.variants.reduce((acc, v) => acc + v.stock, 0);
    }

    const status = totalStock === 0 ? 'OUT_OF_STOCK' : totalStock <= item.minStock ? 'LOW_STOCK' : 'ACTIVE';

    const product = await prisma.product.create({
      data: {
        sku: item.sku,
        name: item.name,
        brand: item.brand,
        model: item.model,
        price: item.price,
        costPrice: item.costPrice,
        stock: totalStock,
        minStock: item.minStock,
        status,
        hasVariants: item.hasVariants,
        socket: item.socket,
        ramType: item.ramType,
        wattage: item.wattage,
        formFactor: item.formFactor,
        description: item.description,
        imageUrl: item.imageUrl,
        categoryId,
      },
    });

    // Si tiene variantes, crearlas con su stock independiente
    if (item.variants && item.variants.length > 0) {
      for (const variant of item.variants) {
        const varStatus = variant.stock === 0 ? 'OUT_OF_STOCK' : variant.stock <= variant.minStock ? 'LOW_STOCK' : 'ACTIVE';
        const createdVariant = await prisma.productVariant.create({
          data: {
            productId: product.id,
            sku: variant.sku,
            name: variant.name,
            capacity: variant.capacity,
            color: variant.color,
            modelVariant: variant.modelVariant,
            price: variant.price,
            costPrice: variant.costPrice,
            stock: variant.stock,
            minStock: variant.minStock,
            status: varStatus,
          },
        });

        // Registrar transacción de inventario inicial para la variante
        await prisma.inventoryTransaction.create({
          data: {
            productId: product.id,
            variantId: createdVariant.id,
            type: 'IN',
            quantity: variant.stock,
            previousStock: 0,
            newStock: variant.stock,
            reason: `Ingreso inicial por variación: ${variant.name}`,
            reference: 'SEED-INICIAL-VAR',
          },
        });
      }
    } else {
      // Producto simple: registrar transacción inicial
      await prisma.inventoryTransaction.create({
        data: {
          productId: product.id,
          type: 'IN',
          quantity: item.stock,
          previousStock: 0,
          newStock: item.stock,
          reason: 'Carga inicial de inventario general',
          reference: 'SEED-INICIAL-PROD',
        },
      });
    }
  }

  // 6. Crear Pedidos Iniciales de Ejemplo (Fase 2)
  console.log('🛒 Creando órdenes de compra de prueba (Fase 2)...');
  const uioZoneId = zoneMap.get('LOCAL_UIO')!;
  const costaZoneId = zoneMap.get('REGIONAL_COSTA')!;

  // Encontrar productos para el pedido de prueba
  const cpu = await prisma.product.findUnique({ where: { sku: 'CPU-AMD-7800X3D' } });
  const mb = await prisma.product.findUnique({ where: { sku: 'MB-ASU-B650P' } });
  const ssdVariant = await prisma.productVariant.findUnique({ where: { sku: 'SSD-SAM-990P-2TB' } });
  const ssdProduct = await prisma.product.findUnique({ where: { sku: 'SSD-SAM-990P' } });

  if (cpu && mb && ssdVariant && ssdProduct) {
    // Pedido 1: Transferencia Bancaria
    const subtotal1 = Number(cpu.price) + Number(mb.price);
    const shipping1 = 0.00; // Supera $500 -> Envío Gratis
    const tax1 = Math.round(subtotal1 * 0.15 * 100) / 100;
    const total1 = subtotal1 + shipping1 + tax1;

    const order1 = await prisma.order.create({
      data: {
        orderNumber: 'TP-2026-0001',
        customerName: 'Carlos Mendoza',
        customerEmail: 'carlos.mendoza@email.com',
        customerPhone: '+593998765432',
        customerAddress: 'Av. República de El Salvador y Moscú, Edificio Alianza Piso 4',
        customerCity: 'Quito, Pichincha',
        customerCedula: '1723456789',
        shippingZoneId: uioZoneId,
        paymentMethod: 'BANK_TRANSFER',
        paymentStatus: 'VERIFIED',
        orderStatus: 'CONFIRMED',
        subtotal: subtotal1,
        shippingCost: shipping1,
        taxRate: 0.15,
        taxAmount: tax1,
        total: total1,
        currency: 'USD',
        notes: 'Cliente adjuntó comprobante de transferencia Banco Pichincha.',
        items: {
          create: [
            {
              productId: cpu.id,
              productName: cpu.name,
              sku: cpu.sku,
              unitPrice: cpu.price,
              quantity: 1,
              total: cpu.price,
            },
            {
              productId: mb.id,
              productName: mb.name,
              sku: mb.sku,
              unitPrice: mb.price,
              quantity: 1,
              total: mb.price,
            },
          ],
        },
      },
    });

    // Pedido 2: Contra Entrega
    const subtotal2 = Number(ssdVariant.price);
    const shipping2 = 5.50; // Costa
    const tax2 = Math.round(subtotal2 * 0.15 * 100) / 100;
    const total2 = subtotal2 + shipping2 + tax2;

    await prisma.order.create({
      data: {
        orderNumber: 'TP-2026-0002',
        customerName: 'María Fernanda Gómez',
        customerEmail: 'maria.gomez@email.com',
        customerPhone: '+593987654321',
        customerAddress: 'Cdla. Kennedy Norte, Mz 102 Solar 15',
        customerCity: 'Guayaquil, Guayas',
        customerCedula: '0987654321',
        shippingZoneId: costaZoneId,
        paymentMethod: 'CASH_ON_DELIVERY',
        paymentStatus: 'PENDING',
        orderStatus: 'PROCESSING',
        subtotal: subtotal2,
        shippingCost: shipping2,
        taxRate: 0.15,
        taxAmount: tax2,
        total: total2,
        currency: 'USD',
        notes: 'Pago en efectivo acordado contra entrega al repartidor.',
        items: {
          create: [
            {
              productId: ssdProduct.id,
              variantId: ssdVariant.id,
              productName: ssdProduct.name,
              variantName: ssdVariant.name,
              sku: ssdVariant.sku,
              unitPrice: ssdVariant.price,
              quantity: 1,
              total: ssdVariant.price,
            },
          ],
        },
      },
    });

    console.log(`✅ Pedidos de prueba creados exitosamente: ${order1.orderNumber} y TP-2026-0002`);
  }

  console.log('🎉 Seed y migración completados con éxito para Fase 1 y Fase 2!');
}

main()
  .catch((e) => {
    console.error('❌ Error en el proceso de seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
