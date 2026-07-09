import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCurrencyDto } from './dto/create-currency.dto';
import { UpdateCurrencyDto } from './dto/update-currency.dto';

@Injectable()
export class CurrenciesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createCurrencyDto: CreateCurrencyDto, userId: number) {
    const code = createCurrencyDto.code.trim().toUpperCase();
    if (code === '') {
      throw I18nException.badRequest('common.errors.code_empty');
    }
    const existing = await this.prisma.currency.findUnique({
      where: { code },
    });
    if (existing) {
      throw I18nException.badRequest('currencies.errors.code_exists');
    }
    try {
      const currency = await this.prisma.currency.create({
        data: {
          code,
          name: createCurrencyDto.name,
          symbol: createCurrencyDto.symbol,
        },
        select: this.selectBase(),
      });

      await this.auditService.logCreate(
        userId,
        0,
        'currencies',
        'Moneda',
        currency.id,
      );

      return {
        message: 'currencies.success.created',
        data: currency,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('currencies.errors.code_exists');
      }
      throw e;
    }
  }

  async findAll() {
    const currencies = await this.prisma.currency.findMany({
      select: this.selectBase(),
      orderBy: { code: 'asc' },
    });
    return currencies;
  }

  async findOne(id: number) {
    const currency = await this.prisma.currency.findUnique({
      where: { id },
      select: this.selectBase(),
    });
    if (!currency) {
      throw I18nException.notFound('currencies.errors.not_found');
    }
    return currency;
  }

  async update(
    id: number,
    updateCurrencyDto: UpdateCurrencyDto,
    userId: number,
  ) {
    await this.findOne(id);
    const data: UpdateCurrencyDto = { ...updateCurrencyDto };
    if (updateCurrencyDto.code != null) {
      const code = updateCurrencyDto.code.trim().toUpperCase();
      if (code === '') {
        throw I18nException.badRequest('common.errors.code_empty');
      }
      const existing = await this.prisma.currency.findFirst({
        where: { code, id: { not: id } },
      });
      if (existing) {
        throw I18nException.badRequest('currencies.errors.code_exists');
      }
      data.code = code;
    }
    try {
      const currency = await this.prisma.currency.update({
        where: { id },
        data,
        select: this.selectBase(),
      });

      await this.auditService.logUpdate(
        userId,
        0,
        'currencies',
        'Moneda',
        currency.id,
      );

      return {
        message: 'currencies.success.updated',
        data: currency,
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('currencies.errors.code_exists');
      }
      throw e;
    }
  }

  async remove(id: number, userId: number) {
    await this.findOne(id);
    const companiesCount = await this.prisma.company.count({
      where: { defaultCurrencyId: id },
    });
    if (companiesCount > 0) {
      throw I18nException.badRequest('currencies.errors.used_by_companies', {
        count: companiesCount,
      });
    }
    const branchesCount = await this.prisma.branch.count({
      where: { currencyId: id },
    });
    if (branchesCount > 0) {
      throw I18nException.badRequest('currencies.errors.used_by_branches', {
        count: branchesCount,
      });
    }
    const ratesCount = await this.prisma.exchangeRate.count({
      where: { OR: [{ fromCurrencyId: id }, { toCurrencyId: id }] },
    });
    if (ratesCount > 0) {
      throw I18nException.badRequest('currencies.errors.has_exchange_rates', {
        count: ratesCount,
      });
    }
    await this.prisma.currency.delete({ where: { id } });

    await this.auditService.logDelete(userId, 0, 'currencies', 'Moneda', id);

    return { message: 'currencies.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      code: true,
      name: true,
      symbol: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
