import prisma from '../utils/prisma';

export class CategoryService {
  static async getAll() {
    return prisma.category.findMany({
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getById(id: number) {
    return prisma.category.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  static async create(data: { name: string; slug?: string; description?: string }) {
    const slug = data.slug || data.name.toLowerCase().trim().replace(/\s+/g, '-');
    return prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
      },
    });
  }
}
