import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseBranchDto } from './dto/create-warehouse-branch.dto';
import { UpdateWarehouseBranchDto } from './dto/update-warehouse-branch.dto';

@Injectable()
export class WarehouseBranchService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createWarehouseBranchDto: CreateWarehouseBranchDto,
    companyId: number,
    userId: number,
  ) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: {
        id: createWarehouseBranchDto.warehouseId,
        companyId,
      },
    });
    if (!warehouse) {
      throw I18nException.notFound('warehouses.errors.not_found');
    }

    const branch = await this.prisma.branch.findFirst({
      where: {
        id: createWarehouseBranchDto.branchId,
        companyId,
      },
    });
    if (!branch) {
      throw I18nException.notFound('branches.errors.not_found');
    }

    const existing = await this.prisma.warehouseBranch.findUnique({
      where: {
        warehouseId_branchId: {
          warehouseId: createWarehouseBranchDto.warehouseId,
          branchId: createWarehouseBranchDto.branchId,
        },
      },
    });
    if (existing) {
      throw I18nException.badRequest('warehouseBranches.errors.already_exists');
    }

    try {
      const warehouseBranch = await this.prisma.warehouseBranch.create({
        data: {
          warehouseId: createWarehouseBranchDto.warehouseId,
          branchId: createWarehouseBranchDto.branchId,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'warehouseBranches',
        'Warehouse-Branch Assignment',
        warehouseBranch.id,
      );

      return {
        message: 'warehouseBranches.success.created',
        data: warehouseBranch,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest(
          'warehouseBranches.errors.already_exists',
        );
      }
      throw e;
    }
  }

  async findAll(companyId: number) {
    const warehouseBranches = await this.prisma.warehouseBranch.findMany({
      where: {
        warehouse: { companyId },
      },
      select: {
        ...this.selectBase(),
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return warehouseBranches;
  }

  async findOne(id: number, companyId: number) {
    const warehouseBranch = await this.prisma.warehouseBranch.findFirst({
      where: {
        id,
        warehouse: { companyId },
      },
      select: {
        ...this.selectBase(),
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
          },
        },
      },
    });
    if (!warehouseBranch) {
      throw I18nException.notFound('warehouseBranches.errors.not_found');
    }
    return warehouseBranch;
  }

  async update(
    id: number,
    updateWarehouseBranchDto: UpdateWarehouseBranchDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);

    if (updateWarehouseBranchDto.warehouseId != null) {
      const warehouse = await this.prisma.warehouse.findFirst({
        where: {
          id: updateWarehouseBranchDto.warehouseId,
          companyId,
        },
      });
      if (!warehouse) {
        throw I18nException.notFound('warehouses.errors.not_found');
      }
    }

    if (updateWarehouseBranchDto.branchId != null) {
      const branch = await this.prisma.branch.findFirst({
        where: {
          id: updateWarehouseBranchDto.branchId,
          companyId,
        },
      });
      if (!branch) {
        throw I18nException.notFound('branches.errors.not_found');
      }
    }

    if (
      updateWarehouseBranchDto.warehouseId != null &&
      updateWarehouseBranchDto.branchId != null
    ) {
      const existing = await this.prisma.warehouseBranch.findFirst({
        where: {
          warehouseId: updateWarehouseBranchDto.warehouseId,
          branchId: updateWarehouseBranchDto.branchId,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest(
          'warehouseBranches.errors.already_exists',
        );
      }
    }

    try {
      const warehouseBranch = await this.prisma.warehouseBranch.update({
        where: { id },
        data: updateWarehouseBranchDto,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'warehouseBranches',
        'Warehouse-Branch Assignment',
        warehouseBranch.id,
      );

      return {
        message: 'warehouseBranches.success.updated',
        data: warehouseBranch,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest(
          'warehouseBranches.errors.already_exists',
        );
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);

    await this.prisma.warehouseBranch.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'warehouseBranches',
      'Warehouse-Branch Assignment',
      id,
    );

    return { message: 'warehouseBranches.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      warehouseId: true,
      branchId: true,
      createdAt: true,
    };
  }

  async findByBranch(branchId: number, companyId: number) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) {
      throw I18nException.notFound('branches.errors.not_found');
    }

    const warehouseBranches = await this.prisma.warehouseBranch.findMany({
      where: { branchId },
      select: {
        id: true,
        warehouseId: true,
        branchId: true,
        createdAt: true,
        warehouse: {
          select: {
            id: true,
            name: true,
            code: true,
            isActive: true,
          },
        },
      },
    });
    return warehouseBranches;
  }

  async findByWarehouse(warehouseId: number, companyId: number) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: warehouseId, companyId },
    });
    if (!warehouse) {
      throw I18nException.notFound('warehouses.errors.not_found');
    }

    const warehouseBranches = await this.prisma.warehouseBranch.findMany({
      where: { warehouseId },
      select: {
        id: true,
        warehouseId: true,
        branchId: true,
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
    return warehouseBranches;
  }
}
