import prisma from '../utils/prisma';

export interface ProductFilters {
  search?: string;
  categoryId?: number;
  brand?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class ProductService {
  static async getAll(filters: ProductFilters = {}) {
    const { search, categoryId, brand, status, page = 1, limit = 50 } = filters;
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
            orderBy: { id: 'asc' },
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
          orderBy: { id: 'asc' },
        },
        transactions: {
          take: 10,
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
  }) {
    const stock = data.stock ?? 0;
    const minStock = data.minStock ?? 5;
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
          description: data.description,
          categoryId: data.categoryId,
        },
        include: { category: true },
      });

      if (stock > 0) {
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

      return product;
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
    }>
  ) {
    return prisma.product.update({
      where: { id },
      data,
      include: { category: true },
    });
  }

  static async delete(id: number) {
    return prisma.product.delete({
      where: { id },
    });
  }
}
