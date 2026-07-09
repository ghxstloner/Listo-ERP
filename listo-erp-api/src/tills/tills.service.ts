import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { customAlphabet } from 'nanoid';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTillDto } from './dto/create-till.dto';
import { UpdateTillDto } from './dto/update-till.dto';

@Injectable()
export class TillsService {
  private readonly generateTillCode = customAlphabet(
    'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    6,
  );

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async generateUniqueTillCode(branchId: number): Promise<string> {
    let code: string = '';

    while (true) {
      code = this.generateTillCode();
      const existing = await this.prisma.till.findUnique({
        where: {
          branchId_tillCode: {
            branchId,
            tillCode: code,
          },
        },
      });
      if (!existing) {
        break;
      }
    }

    return code;
  }

  private async ensureBranchBelongsToCompany(
    branchId: number,
    companyId: number,
  ) {
    const branch = await this.prisma.branch.findFirst({
      where: { id: branchId, companyId },
    });
    if (!branch) {
      throw I18nException.badRequest('tills.errors.branch_not_found');
    }
    return branch;
  }

  async create(createTillDto: CreateTillDto, companyId: number) {
    await this.ensureBranchBelongsToCompany(createTillDto.branchId, companyId);

    const rawTillCode = createTillDto.tillCode?.trim();
    if (createTillDto.tillCode != null && rawTillCode === '') {
      throw I18nException.badRequest('tills.errors.code_empty');
    }
    let tillCode = rawTillCode || undefined;

    if (tillCode) {
      const existing = await this.prisma.till.findUnique({
        where: {
          branchId_tillCode: {
            branchId: createTillDto.branchId,
            tillCode,
          },
        },
      });
      if (existing) {
        throw I18nException.badRequest('tills.errors.code_exists');
      }
    } else {
      tillCode = await this.generateUniqueTillCode(createTillDto.branchId);
    }

    try {
      const till = await this.prisma.till.create({
        data: {
          tillName: createTillDto.tillName,
          tillCode,
          branchId: createTillDto.branchId,
          companyId,
          isActive: createTillDto.isActive ?? true,
        },
        select: {
          id: true,
          tillCode: true,
          tillName: true,
          isActive: true,
          companyId: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
              branchCode: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        message: 'tills.success.created',
        data: till,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('tills.errors.code_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number, branchId?: number) {
    const where: { companyId: number; branchId?: number } = { companyId };
    if (branchId != null) {
      where.branchId = branchId;
    }

    const tills = await this.prisma.till.findMany({
      where,
      select: {
        id: true,
        tillCode: true,
        tillName: true,
        isActive: true,
        companyId: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    return tills;
  }

  async findAllByBranch(companyId: number, branchId: number) {
    await this.ensureBranchBelongsToCompany(branchId, companyId);
    return this.findAll(companyId, branchId);
  }

  async findOne(id: number, companyId: number) {
    const till = await this.prisma.till.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        tillCode: true,
        tillName: true,
        isActive: true,
        companyId: true,
        branchId: true,
        branch: {
          select: {
            id: true,
            name: true,
            branchCode: true,
            address: true,
            phone: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!till) {
      throw I18nException.notFound('tills.errors.not_found');
    }

    return till;
  }

  async update(id: number, updateTillDto: UpdateTillDto, companyId: number) {
    const current = await this.findOne(id, companyId);

    if (updateTillDto.branchId != null) {
      await this.ensureBranchBelongsToCompany(
        updateTillDto.branchId,
        companyId,
      );
    }

    const data: UpdateTillDto = { ...updateTillDto };

    if (updateTillDto.tillCode != null) {
      const tillCode = updateTillDto.tillCode.trim();
      if (tillCode === '') {
        throw I18nException.badRequest('tills.errors.code_empty');
      }
      const branchId = updateTillDto.branchId ?? current.branchId;
      const existing = await this.prisma.till.findFirst({
        where: {
          branchId,
          tillCode,
          id: { not: id },
        },
      });
      if (existing) {
        throw I18nException.badRequest('tills.errors.code_exists');
      }
      data.tillCode = tillCode;
    }

    try {
      const till = await this.prisma.till.update({
        where: { id },
        data,
        select: {
          id: true,
          tillCode: true,
          tillName: true,
          isActive: true,
          companyId: true,
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
              branchCode: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      });
      return {
        message: 'tills.success.updated',
        data: till,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('tills.errors.code_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);

    await this.prisma.till.delete({
      where: { id },
    });
    return { message: 'tills.success.deleted' };
  }
}
