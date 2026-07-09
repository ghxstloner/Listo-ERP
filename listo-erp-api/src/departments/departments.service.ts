import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { UpdateDepartmentDto } from './dto/update-department.dto';

@Injectable()
export class DepartmentsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createDepartmentDto: CreateDepartmentDto,
    companyId: number,
    userId: number,
  ) {
    const code = createDepartmentDto.code.trim();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.department.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
    });
    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'department',
      });
    }
    try {
      const department = await this.prisma.department.create({
        data: {
          name: createDepartmentDto.name,
          code,
          isActive: createDepartmentDto.isActive ?? true,
          companyId,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'departments',
        'Departamento',
        department.id,
      );

      return {
        message: 'departments.success.created',
        data: department,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'department',
        });
      }
      throw e;
    }
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

  async findAll(companyId: number, includeSubdepartments = false) {
    const [departments, names] = await Promise.all([
      this.prisma.department.findMany({
        where: { companyId },
        select: {
          ...this.selectBase(),
          ...(includeSubdepartments && {
            subdepartments: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          }),
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.getHierarchyNames(companyId),
    ]);
    return {
      data: departments,
      meta: {
        entityName: names.level1,
        level: 1,
      },
    };
  }

  async findOne(id: number, companyId: number, includeSubdepartments = false) {
    const [department, names] = await Promise.all([
      this.prisma.department.findFirst({
        where: { id, companyId },
        select: {
          ...this.selectBase(),
          ...(includeSubdepartments && {
            subdepartments: {
              select: {
                id: true,
                name: true,
                code: true,
                isActive: true,
                departmentId: true,
                createdAt: true,
                updatedAt: true,
              },
            },
          }),
        },
      }),
      this.getHierarchyNames(companyId),
    ]);
    if (!department) {
      throw I18nException.notFound('departments.errors.not_found');
    }
    return {
      data: department,
      meta: {
        entityName: names.level1,
        level: 1,
      },
    };
  }

  async update(
    id: number,
    updateDepartmentDto: UpdateDepartmentDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    const data: UpdateDepartmentDto = { ...updateDepartmentDto };
    if (updateDepartmentDto.code != null) {
      const code = updateDepartmentDto.code.trim();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.department.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'department',
        });
      }
      data.code = code;
    }
    try {
      const department = await this.prisma.department.update({
        where: { id },
        data,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'departments',
        'Departamento',
        department.id,
      );

      return {
        message: 'departments.success.updated',
        data: department,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'department',
        });
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    const subdepartmentsCount = await this.prisma.subdepartment.count({
      where: { departmentId: id },
    });
    if (subdepartmentsCount > 0) {
      throw I18nException.badRequest('departments.errors.has_subdepartments', {
        count: subdepartmentsCount,
      });
    }
    const productsCount = await this.prisma.product.count({
      where: { departmentId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('departments.errors.has_products', {
        count: productsCount,
      });
    }
    await this.prisma.department.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'departments',
      'Departamento',
      id,
    );

    return { message: 'departments.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      name: true,
      code: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  async findSubdepartmentsByDepartment(id: number, companyId: number) {
    await this.findOne(id, companyId);
    const subdepartments = await this.prisma.subdepartment.findMany({
      where: { departmentId: id, companyId },
      select: {
        id: true,
        name: true,
        code: true,
        isActive: true,
        departmentId: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return subdepartments;
  }
}
