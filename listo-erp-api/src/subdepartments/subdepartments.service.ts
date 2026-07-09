import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSubdepartmentDto } from './dto/create-subdepartment.dto';
import { UpdateSubdepartmentDto } from './dto/update-subdepartment.dto';

@Injectable()
export class SubdepartmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async ensureDepartmentBelongsToCompany(
    departmentId: number,
    companyId: number,
  ) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, companyId },
    });
    if (!department) {
      throw I18nException.badRequest(
        'subdepartments.errors.department_not_found_or_not_company',
      );
    }
    return department;
  }

  private async ensureSubdepartmentBelongsToCompany(
    subdepartmentId: number,
    companyId: number,
  ) {
    const subdepartment = await this.prisma.subdepartment.findFirst({
      where: { id: subdepartmentId, companyId },
    });
    if (!subdepartment) {
      throw I18nException.badRequest(
        'subdepartments.errors.not_found_or_not_company',
      );
    }
    return subdepartment;
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
    createSubdepartmentDto: CreateSubdepartmentDto,
    companyId: number,
  ) {
    await this.ensureDepartmentBelongsToCompany(
      createSubdepartmentDto.departmentId,
      companyId,
    );
    const code = createSubdepartmentDto.code.trim();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.subdepartment.findUnique({
      where: {
        companyId_code: {
          companyId,
          code,
        },
      },
    });
    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'subdepartment',
      });
    }
    try {
      const subdepartment = await this.prisma.subdepartment.create({
        data: {
          name: createSubdepartmentDto.name,
          code,
          departmentId: createSubdepartmentDto.departmentId,
          companyId,
          isActive: createSubdepartmentDto.isActive ?? true,
        },
        select: this.selectWithDepartment(),
      });
      return {
        message: 'subdepartments.success.created',
        data: subdepartment,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subdepartment',
        });
      }
      throw e;
    }
  }

  async findAll(companyId: number, departmentId?: number) {
    const where: { companyId: number; departmentId?: number } = {
      companyId,
    };
    if (departmentId != null) {
      where.departmentId = departmentId;
    }
    const [subdepartments, names] = await Promise.all([
      this.prisma.subdepartment.findMany({
        where,
        select: this.selectWithDepartment(),
        orderBy: { createdAt: 'desc' },
      }),
      this.getHierarchyNames(companyId),
    ]);
    return {
      data: subdepartments,
      meta: {
        entityName: names.level2,
        level: 2,
      },
    };
  }

  async findOne(id: number, companyId: number) {
    const [subdepartment, names] = await Promise.all([
      this.prisma.subdepartment.findFirst({
        where: { id, companyId },
        select: this.selectWithDepartment(),
      }),
      this.getHierarchyNames(companyId),
    ]);
    if (!subdepartment) {
      throw I18nException.notFound('subdepartments.errors.not_found');
    }
    return {
      data: subdepartment,
      meta: {
        entityName: names.level2,
        level: 2,
      },
    };
  }

  async update(
    id: number,
    updateSubdepartmentDto: UpdateSubdepartmentDto,
    companyId: number,
  ) {
    await this.findOne(id, companyId);
    if (updateSubdepartmentDto.departmentId != null) {
      await this.ensureDepartmentBelongsToCompany(
        updateSubdepartmentDto.departmentId,
        companyId,
      );
    }
    const data: UpdateSubdepartmentDto = { ...updateSubdepartmentDto };
    if (updateSubdepartmentDto.code != null) {
      const code = updateSubdepartmentDto.code.trim();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.subdepartment.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subdepartment',
        });
      }
      data.code = code;
    }
    try {
      const subdepartment = await this.prisma.subdepartment.update({
        where: { id },
        data,
        select: this.selectWithDepartment(),
      });
      return {
        message: 'subdepartments.success.updated',
        data: subdepartment,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'subdepartment',
        });
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    const categoriesCount = await this.prisma.category.count({
      where: { subdepartmentId: id },
    });
    if (categoriesCount > 0) {
      throw I18nException.badRequest('subdepartments.errors.has_categories', {
        count: categoriesCount,
      });
    }
    const productsCount = await this.prisma.product.count({
      where: { subdepartmentId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('subdepartments.errors.has_products', {
        count: productsCount,
      });
    }
    await this.prisma.subdepartment.delete({ where: { id } });
    return { message: 'subdepartments.success.deleted' };
  }

  private selectWithDepartment() {
    return {
      id: true,
      name: true,
      code: true,
      isActive: true,
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
      createdAt: true,
      updatedAt: true,
    };
  }

  async findCategoriesBySubdepartment(id: number, companyId: number) {
    await this.ensureSubdepartmentBelongsToCompany(id, companyId);
    const categories = await this.prisma.category.findMany({
      where: { subdepartmentId: id, companyId },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        subdepartmentId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return categories;
  }
}
