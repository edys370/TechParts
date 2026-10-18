import prisma from '../utils/prisma';

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  brand?: string;
  status?: string;
  socket?: string;
  ramType?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  static async getAll(filters: ProductFilters = {}) {
    const { search, categoryId, brand, status, socket, ramType, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { model: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (categoryId) {
      where.categoryId = Number(categoryId);
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (status) {
      where.status = status;
    }

    if (socket) {
      where.socket = socket;
    }

    if (ramType) {
      where.ramType = ramType;
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: {
            select: { id: true, name: true, slug: true },
          },
          variants: {
            orderBy: { price: 'asc' },
          },
        },
        orderBy: { updatedAt: 'desc' },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      data: products,
    };
  }

  static async getById(id: number) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: {
          orderBy: { price: 'asc' },
        },
        transactions: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          include: {
            variant: true,
          },
        },
      },
    });
  }

  static async create(data: {
    sku: string;
    name: string;
    brand: string;
    model: string;
    price: number;
    costPrice: number;
    stock?: number;
    minStock?: number;
    description?: string;
    categoryId: number;
    hasVariants?: boolean;
    socket?: string;
    ramType?: string;
    wattage?: number;
    formFactor?: string;
    imageUrl?: string;
    variants?: Array<{
      sku: string;
      name: string;
      capacity?: string;
      color?: string;
      modelVariant?: string;
      price: number;
      costPrice: number;
      stock: number;
      minStock?: number;
    }>;
  }) {
    let stock = data.stock ?? 0;
    const minStock = data.minStock ?? 5;
    const hasVariants = data.hasVariants || (data.variants && data.variants.length > 0);

    if (hasVariants && data.variants && data.variants.length > 0) {
      stock = data.variants.reduce((acc, v) => acc + v.stock, 0);
    }

    const status = stock === 0 ? 'OUT_OF_STOCK' : stock <= minStock ? 'LOW_STOCK' : 'ACTIVE';

    return prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          sku: data.sku.toUpperCase().trim(),
          name: data.name.trim(),
          brand: data.brand.trim(),
          model: data.model.trim(),
          price: data.price,
          costPrice: data.costPrice,
          stock,
          minStock,
          status,
          hasVariants: !!hasVariants,
          socket: data.socket || null,
          ramType: data.ramType || null,
          wattage: data.wattage ? Number(data.wattage) : null,
          formFactor: data.formFactor || null,
          imageUrl: data.imageUrl || null,
          description: data.description,
          categoryId: data.categoryId,
        },
        include: { category: true },
      });

      if (hasVariants && data.variants) {
        for (const variant of data.variants) {
          const varStatus = variant.stock === 0 ? 'OUT_OF_STOCK' : variant.stock <= (variant.minStock ?? 3) ? 'LOW_STOCK' : 'ACTIVE';
          const createdVariant = await tx.productVariant.create({
            data: {
              productId: product.id,
              sku: variant.sku.toUpperCase().trim(),
              name: variant.name.trim(),
              capacity: variant.capacity,
              color: variant.color,
              modelVariant: variant.modelVariant,
              price: variant.price,
              costPrice: variant.costPrice,
              stock: variant.stock,
              minStock: variant.minStock ?? 3,
              status: varStatus,
            },
          });

          if (variant.stock > 0) {
            await tx.inventoryTransaction.create({
              data: {
                productId: product.id,
                variantId: createdVariant.id,
                type: 'IN',
                quantity: variant.stock,
                previousStock: 0,
                newStock: variant.stock,
                reason: `Stock inicial por creación de variante ${variant.name}`,
                reference: `ALTA-${createdVariant.sku}`,
              },
            });
          }
        }
      } else if (stock > 0) {
        await tx.inventoryTransaction.create({
          data: {
            productId: product.id,
            type: 'IN',
            quantity: stock,
            previousStock: 0,
            newStock: stock,
            reason: 'Stock inicial por creación de producto',
            reference: `ALTA-${product.sku}`,
          },
        });
      }

      return tx.product.findUnique({
        where: { id: product.id },
        include: { category: true, variants: true },
      });
    });
  }

  static async update(
    id: number,
    data: Partial<{
      sku: string;
      name: string;
      brand: string;
      model: string;
      price: number;
      costPrice: number;
      minStock: number;
      description: string;
      categoryId: number;
      status: string;
      socket: string;
      ramType: string;
      wattage: number;
      formFactor: string;
      imageUrl: string;
    }>
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true, variants: true },
    });
  }

  static async delete(id: number) {
    return prisma.product.delete({
      where: { id },
    });
  }
}
