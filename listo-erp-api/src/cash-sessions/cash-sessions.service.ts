import { Injectable } from '@nestjs/common';
import { AuditAction, CashSessionStatus, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CloseCashSessionDto } from './dto/close-cash-session.dto';
import { OpenCashSessionDto } from './dto/open-cash-session.dto';

interface CashSessionFilters {
  status?: string;
  branchId?: number;
  tillId?: number;
}

@Injectable()
export class CashSessionsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async open(dto: OpenCashSessionDto, companyId: number, userId: number) {
    const till = await this.prisma.till.findFirst({
      where: {
        id: dto.tillId,
        companyId,
        isActive: true,
        branch: { companyId, isActive: true },
      },
      select: {
        id: true,
        tillCode: true,
        tillName: true,
        branchId: true,
        branch: { select: { id: true, name: true, branchCode: true } },
      },
    });

    if (!till) {
      throw I18nException.badRequest('cash_sessions.errors.till_not_found');
    }

    try {
      const session = await this.prisma.cashSession.create({
        data: {
          companyId,
          branchId: till.branchId,
          tillId: till.id,
          openedByUserId: userId,
          openingAmount: new Prisma.Decimal(dto.openingAmount),
          openingNote: dto.openingNote?.trim() || undefined,
        },
        select: this.selectBase(),
      });

      await this.auditService.log({
        userId,
        companyId,
        action: AuditAction.CREATE,
        section: 'cash-sessions',
        description: `Apertura de caja ${till.tillCode} (sesión ID: ${session.id})`,
      });

      return { message: 'cash_sessions.success.opened', data: session };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('cash_sessions.errors.already_open');
      }
      throw e;
    }
  }

  async close(
    id: number,
    dto: CloseCashSessionDto,
    companyId: number,
    userId: number,
  ) {
    const current = await this.prisma.cashSession.findFirst({
      where: { id, companyId },
      select: {
        id: true,
        status: true,
        openingAmount: true,
        till: { select: { tillCode: true } },
      },
    });

    if (!current) {
      throw I18nException.notFound('cash_sessions.errors.not_found');
    }

    if (current.status !== CashSessionStatus.OPEN) {
      throw I18nException.badRequest('cash_sessions.errors.not_open');
    }

    const expectedClosingAmount = current.openingAmount;
    const declaredClosingAmount = new Prisma.Decimal(dto.declaredClosingAmount);
    const differenceAmount = declaredClosingAmount.minus(expectedClosingAmount);

    const session = await this.prisma.cashSession.update({
      where: { id },
      data: {
        status: CashSessionStatus.CLOSED,
        closedByUserId: userId,
        closedAt: new Date(),
        expectedClosingAmount,
        declaredClosingAmount,
        differenceAmount,
        closingNote: dto.closingNote?.trim() || undefined,
      },
      select: this.selectBase(),
    });

    await this.auditService.log({
      userId,
      companyId,
      action: AuditAction.UPDATE,
      section: 'cash-sessions',
      description: `Cierre de caja ${current.till.tillCode} (sesión ID: ${session.id})`,
    });

    return { message: 'cash_sessions.success.closed', data: session };
  }

  async findCurrent(companyId: number, userId: number) {
    return this.prisma.cashSession.findFirst({
      where: {
        companyId,
        openedByUserId: userId,
        status: CashSessionStatus.OPEN,
      },
      select: this.selectBase(),
      orderBy: { openedAt: 'desc' },
    });
  }

  async findAll(companyId: number, filters: CashSessionFilters) {
    const where: Prisma.CashSessionWhereInput = { companyId };

    if (
      filters.status === CashSessionStatus.OPEN ||
      filters.status === CashSessionStatus.CLOSED
    ) {
      where.status = filters.status;
    }
    if (filters.branchId != null) where.branchId = filters.branchId;
    if (filters.tillId != null) where.tillId = filters.tillId;

    return this.prisma.cashSession.findMany({
      where,
      select: this.selectBase(),
      orderBy: { openedAt: 'desc' },
    });
  }

  async findOne(id: number, companyId: number) {
    const session = await this.prisma.cashSession.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });

    if (!session) {
      throw I18nException.notFound('cash_sessions.errors.not_found');
    }

    return session;
  }

  private selectBase() {
    return {
      id: true,
      companyId: true,
      branchId: true,
      tillId: true,
      openedByUserId: true,
      closedByUserId: true,
      status: true,
      openedAt: true,
      closedAt: true,
      openingAmount: true,
      expectedClosingAmount: true,
      declaredClosingAmount: true,
      differenceAmount: true,
      openingNote: true,
      closingNote: true,
      branch: { select: { id: true, name: true, branchCode: true } },
      till: { select: { id: true, tillCode: true, tillName: true } },
      openedByUser: { select: { id: true, name: true, email: true } },
      closedByUser: { select: { id: true, name: true, email: true } },
      createdAt: true,
      updatedAt: true,
    };
  }
}
