import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { TillPosAssociationType } from '@prisma/client';
import { CurrentUserPayload } from '../auth/decorators/current-user.decorator';
import { I18nException } from '../common/exceptions/i18n-exception';
import { customAlphabet } from 'nanoid';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTillDto } from './dto/create-till.dto';
import { UpdateTillDto } from './dto/update-till.dto';
import { GeneratePosCodeDto } from './dto/generate-pos-code.dto';

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

  private async ensurePaymentMethodsBelongToCompany(
    paymentMethodIds: number[],
    companyId: number,
  ) {
    const uniqueIds = [...new Set(paymentMethodIds)];
    const paymentMethods = await this.prisma.paymentMethod.findMany({
      where: { id: { in: uniqueIds }, companyId },
      select: { id: true },
    });
    if (paymentMethods.length !== uniqueIds.length) {
      throw I18nException.badRequest('tills.errors.payment_method_not_found');
    }
  }

  async associatePosAccess(
    id: number,
    dto: GeneratePosCodeDto,
    companyId: number,
    user: CurrentUserPayload,
    ip: string,
  ) {
    await this.findOne(id, companyId);
    const isIp = dto.type === TillPosAssociationType.IP;
    const till = await this.prisma.till.update({
      where: { id },
      data: {
        posAccessCodeHash: null,
        posAccessCodeType: null,
        posAssociationType: dto.type,
        posAssociatedIp: isIp ? ip : null,
        posAssociatedSessionId: isIp ? null : user.sessionId,
        posAssociationExpiresAt: isIp ? null : user.sessionExpiresAt,
      },
      select: this.selectBase(),
    });
    return { message: 'tills.success.pos_access_associated', data: till };
  }

  async findPosAccess(companyId: number, user: CurrentUserPayload, ip: string) {
    const till = await this.prisma.till.findFirst({
      where: {
        companyId,
        isActive: true,
        OR: [
          {
            posAssociationType: TillPosAssociationType.IP,
            posAssociatedIp: ip,
          },
          {
            posAssociationType: TillPosAssociationType.USER_SESSION,
            posAssociatedSessionId: user.sessionId,
            posAssociationExpiresAt: { gt: new Date() },
          },
        ],
      },
      select: this.selectBase(),
    });
    return till;
  }

  private selectBase() {
    return {
      id: true,
      tillCode: true,
      tillName: true,
      isActive: true,
      companyId: true,
      branchId: true,
      posAssociationType: true,
      paymentMethods: {
        select: { paymentMethod: { select: this.paymentMethodSelect() } },
      },
      branch: { select: { id: true, name: true, branchCode: true } },
      createdAt: true,
      updatedAt: true,
    };
  }

  private paymentMethodSelect() {
    return {
      id: true,
      name: true,
      code: true,
      image: true,
      requiresReference: true,
      isActive: true,
      companyId: true,
    };
  }

  async create(createTillDto: CreateTillDto, companyId: number) {
    await this.ensureBranchBelongsToCompany(createTillDto.branchId, companyId);
    const { paymentMethodIds = [], ...tillData } = createTillDto;
    await this.ensurePaymentMethodsBelongToCompany(paymentMethodIds, companyId);

    const rawTillCode = tillData.tillCode?.trim();
    if (tillData.tillCode != null && rawTillCode === '') {
      throw I18nException.badRequest('tills.errors.code_empty');
    }
    let tillCode = rawTillCode || undefined;

    if (tillCode) {
      const existing = await this.prisma.till.findUnique({
        where: {
          branchId_tillCode: {
            branchId: tillData.branchId,
            tillCode,
          },
        },
      });
      if (existing) {
        throw I18nException.badRequest('tills.errors.code_exists');
      }
    } else {
      tillCode = await this.generateUniqueTillCode(tillData.branchId);
    }

    try {
      const till = await this.prisma.till.create({
        data: {
          tillName: tillData.tillName,
          tillCode,
          branchId: tillData.branchId,
          companyId,
          isActive: tillData.isActive ?? true,
          paymentMethods: {
            create: paymentMethodIds.map((paymentMethodId) => ({
              paymentMethodId,
            })),
          },
        },
        select: {
          id: true,
          tillCode: true,
          tillName: true,
          isActive: true,
          companyId: true,
          branchId: true,
          paymentMethods: {
            select: { paymentMethod: { select: this.paymentMethodSelect() } },
          },
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
        posAssociationType: true,
        paymentMethods: {
          select: { paymentMethod: { select: this.paymentMethodSelect() } },
        },
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
        posAssociationType: true,
        paymentMethods: {
          select: { paymentMethod: { select: this.paymentMethodSelect() } },
        },
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
    const { paymentMethodIds, ...rawData } = updateTillDto;

    if (updateTillDto.branchId != null) {
      await this.ensureBranchBelongsToCompany(
        updateTillDto.branchId,
        companyId,
      );
    }

    if (paymentMethodIds !== undefined) {
      await this.ensurePaymentMethodsBelongToCompany(paymentMethodIds, companyId);
    }

    const data = {
      ...rawData,
      ...(paymentMethodIds !== undefined && {
        paymentMethods: {
          deleteMany: {},
          create: paymentMethodIds.map((paymentMethodId) => ({
            paymentMethodId,
          })),
        },
      }),
    };

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
          paymentMethods: {
            select: { paymentMethod: { select: this.paymentMethodSelect() } },
          },
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
