import { Injectable } from '@nestjs/common';
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
