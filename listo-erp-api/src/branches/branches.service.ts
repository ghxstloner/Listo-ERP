import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { customAlphabet } from 'nanoid';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';

@Injectable()
export class BranchesService {
  private readonly generateBranchCode = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    6,
  );

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async generateUniqueBranchCode(companyId: number): Promise<string> {
    let code: string = '';

    while (true) {
      code = this.generateBranchCode();
      const existing = await this.prisma.branch.findUnique({
        where: {
          companyId_branchCode: {
            companyId,
            branchCode: code,
          },
        },
      });
      if (!existing) {
        break;
      }
    }

    return code;
  }

  async create(
    createBranchDto: CreateBranchDto,
    companyId: number,
    userId: number,
  ) {
    const rawCode = createBranchDto.branchCode?.trim();
    if (createBranchDto.branchCode != null && rawCode === '') {
      throw I18nException.badRequest('branches.errors.code_empty');
    }
    let branchCode: string | undefined = rawCode === '' ? undefined : rawCode;

    if (branchCode) {
      const existing = await this.prisma.branch.findUnique({
        where: {
          companyId_branchCode: {
            companyId,
            branchCode,
          },
        },
      });
      if (existing) {
        throw I18nException.badRequest('branches.errors.code_exists');
      }
    } else {
      branchCode = await this.generateUniqueBranchCode(companyId);
    }

    try {
      const branch = await this.prisma.branch.create({
        data: {
          name: createBranchDto.name,
          address: createBranchDto.address,
          phone: createBranchDto.phone,
          branchCode,
          isActive: createBranchDto.isActive ?? true,
          companyId,
        },
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          branchCode: true,
          isActive: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'branches',
        'Sucursal',
        branch.id,
      );

      return {
        message: 'branches.success.created',
        data: branch,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('branches.errors.code_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number, includeTills = false) {
    const branches = await this.prisma.branch.findMany({
      where: { companyId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        branchCode: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        ...(includeTills && {
          tills: {
            select: {
              id: true,
              tillCode: true,
              tillName: true,
              isActive: true,
              branchId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        }),
      },
      orderBy: { createdAt: 'desc' },
    });
    return branches;
  }

  async findOne(id: number, companyId: number, includeTills = false) {
    const branch = await this.prisma.branch.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
        branchCode: true,
        isActive: true,
        companyId: true,
        createdAt: true,
        updatedAt: true,
        ...(includeTills && {
          tills: {
            select: {
              id: true,
              tillCode: true,
              tillName: true,
              isActive: true,
              branchId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        }),
      },
    });

    if (!branch) {
      throw I18nException.notFound('branches.errors.not_found');
    }

    return branch;
  }

  async update(
    id: number,
    updateBranchDto: UpdateBranchDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);

    const data: UpdateBranchDto = { ...updateBranchDto };

    if (updateBranchDto.branchCode != null) {
      const branchCode = updateBranchDto.branchCode.trim();
      if (branchCode === '') {
        throw I18nException.badRequest('branches.errors.code_empty');
      }
      const existing = await this.prisma.branch.findFirst({
        where: {
          companyId,
          branchCode,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('branches.errors.code_exists');
      }
      data.branchCode = branchCode;
    }

    try {
      const branch = await this.prisma.branch.update({
        where: { id },
        data,
        select: {
          id: true,
          name: true,
          address: true,
          phone: true,
          branchCode: true,
          isActive: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'branches',
        'Sucursal',
        branch.id,
      );

      return {
        message: 'branches.success.updated',
        data: branch,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('branches.errors.code_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);

    const tillsCount = await this.prisma.till.count({
      where: { branchId: id },
    });
    if (tillsCount > 0) {
      throw I18nException.badRequest('branches.errors.has_tills', {
        count: tillsCount,
      });
    }

    await this.prisma.branch.delete({
      where: { id },
    });

    await this.auditService.logDelete(
      userId,
      companyId,
      'branches',
      'Sucursal',
      id,
    );

    return { message: 'branches.success.deleted' };
  }

  async findWarehousesByBranch(id: number, companyId: number) {
    await this.findOne(id, companyId);

    const warehouseBranches = await this.prisma.warehouseBranch.findMany({
      where: { branchId: id },
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
            address: true,
            isActive: true,
          },
        },
      },
    });

    return warehouseBranches;
  }
}
