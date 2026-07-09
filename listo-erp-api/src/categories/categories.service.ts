import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async ensureSubdepartmentBelongsToCompany(
    subdepartmentId: number,
    companyId: number,
  ) {
    const subdepartment = await this.prisma.subdepartment.findFirst({
      where: { id: subdepartmentId, companyId },
    });
    if (!subdepartment) {
      throw I18nException.badRequest(
        'categories.errors.subdepartment_not_found',
      );
    }
    return subdepartment;
  }

  private async ensureCategoryBelongsToCompany(
    categoryId: number,
    companyId: number,
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!category) {
      throw I18nException.badRequest(
        'categories.errors.not_found_or_not_company',
      );
    }
    return category;
  }

  private async getHierarchyNames(companyId: number) {
    const config = await this.prisma.companyHierarchyConfig.findUnique({
      where: { companyId },
    });
    return {
      level1: config?.level1Name ?? 'Departamento',
      level2: config?.level2Name ?? 'Subdepartamento',
      level3: config?.level3Name ?? 'Categoría',
      level4: config?.level4Name ?? 'Subcategoría',
    };
  }

  async create(
    createCategoryDto: CreateCategoryDto,
    companyId: number,
    userId: number,
  ) {
    await this.ensureSubdepartmentBelongsToCompany(
      createCategoryDto.subdepartmentId,
      companyId,
    );
    const code = createCategoryDto.code.trim();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.category.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });
    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'category',
      });
    }
    try {
      const category = await this.prisma.category.create({
        data: {
          name: createCategoryDto.name,
          code,
          subdepartmentId: createCategoryDto.subdepartmentId,
          companyId,
          isActive: createCategoryDto.isActive ?? true,
        },
        select: this.selectWithSubdepartment(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'categories',
        'Categoría',
        category.id,
      );

      return {
        message: 'categories.success.created',
        data: category,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'category',
        });
      }
      throw e;
    }
  }

  async findAll(companyId: number, subdepartmentId?: number) {
    const where: { companyId: number; subdepartmentId?: number } = {
      companyId,
    };
    if (subdepartmentId != null) {
      where.subdepartmentId = subdepartmentId;
    }
    const [categories, names] = await Promise.all([
      this.prisma.category.findMany({
        where,
        select: this.selectWithSubdepartment(),
        orderBy: { createdAt: 'desc' },
      }),
      this.getHierarchyNames(companyId),
    ]);
    return {
      data: categories,
      meta: {
        entityName: names.level3,
        level: 3,
      },
    };
  }

  async findOne(id: number, companyId: number) {
    const [category, names] = await Promise.all([
      this.prisma.category.findFirst({
        where: { id, companyId },
        select: this.selectWithSubdepartment(),
      }),
      this.getHierarchyNames(companyId),
    ]);
    if (!category) {
      throw I18nException.notFound('categories.errors.not_found');
    }
    return {
      data: category,
      meta: {
        entityName: names.level3,
        level: 3,
      },
    };
  }

  async update(
    id: number,
    updateCategoryDto: UpdateCategoryDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    if (updateCategoryDto.subdepartmentId != null) {
      await this.ensureSubdepartmentBelongsToCompany(
        updateCategoryDto.subdepartmentId,
        companyId,
      );
    }
    const data: UpdateCategoryDto = { ...updateCategoryDto };
    if (updateCategoryDto.code != null) {
      const code = updateCategoryDto.code.trim();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.category.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'category',
        });
      }
      data.code = code;
    }
    try {
      const category = await this.prisma.category.update({
        where: { id },
        data,
        select: this.selectWithSubdepartment(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'categories',
        'Categoría',
        category.id,
      );

      return {
        message: 'categories.success.updated',
        data: category,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'category',
        });
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    const subcategoriesCount = await this.prisma.subcategory.count({
      where: { categoryId: id },
    });
    if (subcategoriesCount > 0) {
      throw I18nException.badRequest('categories.errors.has_subcategories', {
        count: subcategoriesCount,
      });
    }
    const productsCount = await this.prisma.product.count({
      where: { categoryId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('categories.errors.has_products', {
        count: productsCount,
      });
    }
    await this.prisma.category.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'categories',
      'Categoría',
      id,
    );

    return { message: 'categories.success.deleted' };
  }

  private selectWithSubdepartment() {
    return {
      id: true,
      name: true,
      code: true,
      isActive: true,
      subdepartmentId: true,
      companyId: true,
      subdepartment: {
        select: {
          id: true,
          name: true,
          code: true,
          departmentId: true,
          companyId: true,
          department: {
            select: {
              id: true,
              name: true,
              code: true,
              companyId: true,
            },
          },
        },
      },
      createdAt: true,
      updatedAt: true,
    };
  }

  async findSubcategoriesByCategory(id: number, companyId: number) {
    await this.ensureCategoryBelongsToCompany(id, companyId);
    const subcategories = await this.prisma.subcategory.findMany({
      where: { categoryId: id, companyId },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        categoryId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return subcategories;
  }
}
