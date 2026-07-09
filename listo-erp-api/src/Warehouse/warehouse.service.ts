import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';
import { UpdateWarehouseDto } from './dto/update-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createWarehouseDto: CreateWarehouseDto,
    companyId: number,
    userId: number,
  ) {
    const code = createWarehouseDto.code.trim();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.warehouse.findUnique({
      where: {
        companyId_code: { companyId, code },
      },
    });
    if (existing) {
      throw I18nException.badRequest('common.errors.already_exists', {
        entity: 'warehouse',
      });
    }
    try {
      const warehouse = await this.prisma.warehouse.create({
        data: {
          name: createWarehouseDto.name,
          code,
          address: createWarehouseDto.address,
          isActive: createWarehouseDto.isActive ?? true,
          companyId,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'warehouses',
        'Almacén',
        warehouse.id,
      );

      return {
        message: 'warehouses.success.created',
        data: warehouse,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'warehouse',
        });
      }
      throw e;
    }
  }

  async findAll(companyId: number, includeBranches = false) {
    const warehouses = await this.prisma.warehouse.findMany({
      where: { companyId },
      select: {
        ...this.selectBase(),
        ...(includeBranches && {
          branches: {
            select: {
              id: true,
              branchId: true,
              warehouseId: true,
              createdAt: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  branchCode: true,
                },
              },
            },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return warehouses;
  }

  async findOne(id: number, companyId: number, includeBranches = false) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id, companyId },
      select: {
        ...this.selectBase(),
        ...(includeBranches && {
          branches: {
            select: {
              id: true,
              branchId: true,
              warehouseId: true,
              createdAt: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  branchCode: true,
                },
              },
            },
          },
        }),
      },
    });
    if (!warehouse) {
      throw I18nException.notFound('warehouses.errors.not_found');
    }
    return warehouse;
  }

  async update(
    id: number,
    updateWarehouseDto: UpdateWarehouseDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    const data: UpdateWarehouseDto = { ...updateWarehouseDto };
    if (updateWarehouseDto.code != null) {
      const code = updateWarehouseDto.code.trim();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.warehouse.findFirst({
        where: {
          companyId,
          code,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'warehouse',
        });
      }
      data.code = code;
    }
    try {
      const warehouse = await this.prisma.warehouse.update({
        where: { id },
        data,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'warehouses',
        'Almacén',
        warehouse.id,
      );

      return {
        message: 'warehouses.success.updated',
        data: warehouse,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('common.errors.already_exists', {
          entity: 'warehouse',
        });
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);

    // Verificar si tiene sucursales asignadas
    const branchesCount = await this.prisma.warehouseBranch.count({
      where: { warehouseId: id },
    });
    if (branchesCount > 0) {
      throw I18nException.badRequest('warehouses.errors.has_branches', {
        count: branchesCount,
      });
    }

    await this.prisma.warehouse.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'warehouses',
      'Almacén',
      id,
    );

    return { message: 'warehouses.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      name: true,
      code: true,
      address: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }

  async findBranchesByWarehouse(id: number, companyId: number) {
    await this.findOne(id, companyId);
    const branches = await this.prisma.warehouseBranch.findMany({
      where: { warehouseId: id },
      select: {
        id: true,
        branchId: true,
        warehouseId: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
            isActive: true,
          },
        },
      },
    });
    return branches;
  }
}
