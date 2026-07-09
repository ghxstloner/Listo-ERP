import { Injectable } from '@nestjs/common';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';

@Injectable()
export class SubcategoriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async ensureCategoryBelongsToCompany(
    categoryId: number,
    companyId: number,
  ) {
    const category = await this.prisma.category.findFirst({
      where: { id: categoryId, companyId },
    });
    if (!category) {
      throw I18nException.badRequest('subcategories.errors.category_not_found');
    }
    return category;
  }

  private async ensureSubcategoryBelongsToCompany(
    subcategoryId: number,
    companyId: number,
  ) {
    const subcategory = await this.prisma.subcategory.findFirst({
      where: { id: subcategoryId, companyId },
    });
    if (!subcategory) {
      throw I18nException.badRequest(
        'subcategories.errors.not_found_or_not_company',
      );
    }
    return subcategory;
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
    createSubcategoryDto: CreateSubcategoryDto,
    companyId: number,
    userId: number,
  ) {
    await this.ensureCategoryBelongsToCompany(
      createSubcategoryDto.categoryId,
      companyId,
    );
    const code = createSubcategoryDto.code.trim();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.subcategory.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });
    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'subcategory',
      });
    }
    try {
      const subcategory = await this.prisma.subcategory.create({
        data: {
          name: createSubcategoryDto.name,
          code,
          categoryId: createSubcategoryDto.categoryId,
          companyId,
          isActive: createSubcategoryDto.isActive ?? true,
        },
        select: this.selectWithCategory(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'subcategories',
        'Subcategoría',
        subcategory.id,
      );

      return {
        message: 'subcategories.success.created',
        data: subcategory,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subcategory',
        });
      }
      throw e;
    }
  }

  async findAll(companyId: number, categoryId?: number) {
    const where: { companyId: number; categoryId?: number } = {
      companyId,
    };
    if (categoryId != null) {
      where.categoryId = categoryId;
    }
    const [subcategories, names] = await Promise.all([
      this.prisma.subcategory.findMany({
        where,
        select: this.selectWithCategory(),
        orderBy: { createdAt: 'desc' },
      }),
      this.getHierarchyNames(companyId),
    ]);
    return {
      data: subcategories,
      meta: {
        entityName: names.level4,
        level: 4,
      },
    };
  }

  async findOne(id: number, companyId: number) {
    const [subcategory, names] = await Promise.all([
      this.prisma.subcategory.findFirst({
        where: { id, companyId },
        select: this.selectWithCategory(),
      }),
      this.getHierarchyNames(companyId),
    ]);
    if (!subcategory) {
      throw I18nException.notFound('subcategories.errors.not_found');
    }
    return {
      data: subcategory,
      meta: {
        entityName: names.level4,
        level: 4,
      },
    };
  }

  async update(
    id: number,
    updateSubcategoryDto: UpdateSubcategoryDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    if (updateSubcategoryDto.categoryId != null) {
      await this.ensureCategoryBelongsToCompany(
        updateSubcategoryDto.categoryId,
        companyId,
      );
    }
    const data: UpdateSubcategoryDto = { ...updateSubcategoryDto };
    if (updateSubcategoryDto.code != null) {
      const code = updateSubcategoryDto.code.trim();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.subcategory.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subcategory',
        });
      }
      data.code = code;
    }
    try {
      const subcategory = await this.prisma.subcategory.update({
        where: { id },
        data,
        select: this.selectWithCategory(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'subcategories',
        'Subcategoría',
        subcategory.id,
      );

      return {
        message: 'subcategories.success.updated',
        data: subcategory,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subcategory',
        });
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    const productsCount = await this.prisma.product.count({
      where: { subcategoryId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('subcategories.errors.has_products', {
        count: productsCount,
      });
    }
    await this.prisma.subcategory.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'subcategories',
      'Subcategoría',
      id,
    );

    return { message: 'subcategories.success.deleted' };
  }

  private selectWithCategory() {
    return {
      id: true,
      name: true,
      code: true,
      isActive: true,
      categoryId: true,
      companyId: true,
      category: {
        select: {
          id: true,
          name: true,
          code: true,
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
        },
      },
      createdAt: true,
      updatedAt: true,
    };
  }
}
