import { Injectable } from '@nestjs/common';
import { SeriesModule, type Prisma } from '@prisma/client';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSeriesDto } from './dto/create-series.dto';
import { UpdateSeriesDto } from './dto/update-series.dto';

@Injectable()
export class SeriesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createSeriesDto: CreateSeriesDto,
    companyId: number,
    userId: number,
  ) {
    try {
      const series = await this.prisma.series.create({
        data: {
          description: createSeriesDto.description,
          format: createSeriesDto.format,
          consecutive: createSeriesDto.consecutive ?? 1,
          module: createSeriesDto.module,
          isActive: createSeriesDto.isActive ?? true,
          companyId,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'series',
        'Series',
        series.id,
      );

      return {
        message: 'series.success.created',
        data: series,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('series.errors.module_already_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number) {
    return this.prisma.series.findMany({
      where: { companyId },
      select: this.selectBase(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, companyId: number) {
    const series = await this.prisma.series.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });
    if (!series) {
      throw I18nException.notFound('series.errors.not_found');
    }
    return series;
  }

  async update(
    id: number,
    updateSeriesDto: UpdateSeriesDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(id, companyId);
    try {
      const series = await this.prisma.series.update({
        where: { id },
        data: updateSeriesDto,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'series',
        'Series',
        series.id,
      );

      return {
        message: 'series.success.updated',
        data: series,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('series.errors.module_already_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    await this.prisma.series.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'series',
      'Series',
      id,
    );

    return { message: 'series.success.deleted' };
  }

  async findActiveByModule(companyId: number, module: SeriesModule) {
    return this.prisma.series.findFirst({
      where: { companyId, module, isActive: true },
      select: this.selectBase(),
    });
  }

  async consumeConsecutive(
    tx: Prisma.TransactionClient,
    seriesId: number,
  ): Promise<{ previousConsecutive: number; format: string }> {
    const updated = await tx.series.update({
      where: { id: seriesId },
      data: { consecutive: { increment: 1 } },
      select: { consecutive: true, format: true },
    });
    return {
      previousConsecutive: updated.consecutive - 1,
      format: updated.format,
    };
  }

  formatNumber(format: string, consecutive: number): string {
    const match = format.match(/\{(0+)\}/);
    if (!match) {
      return `${format}${consecutive}`;
    }
    const padding = match[1].length;
    const padded = String(consecutive).padStart(padding, '0');
    return format.replace(match[0], padded);
  }

  private selectBase() {
    return {
      id: true,
      description: true,
      format: true,
      consecutive: true,
      module: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
