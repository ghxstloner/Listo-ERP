import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExchangeRateDto } from './dto/create-exchange-rate.dto';
import { UpdateExchangeRateDto } from './dto/update-exchange-rate.dto';

@Injectable()
export class ExchangeRatesService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async ensureCurrencyExists(currencyId: number) {
    const currency = await this.prisma.currency.findUnique({
      where: { id: currencyId },
    });
    if (!currency) {
      throw I18nException.badRequest(
        'exchange_rates.errors.currency_not_found',
        {
          id: currencyId,
        },
      );
    }
    return currency;
  }

  async create(
    createExchangeRateDto: CreateExchangeRateDto,
    companyId: number,
    userId: number,
  ) {
    await this.ensureCurrencyExists(createExchangeRateDto.fromCurrencyId);
    await this.ensureCurrencyExists(createExchangeRateDto.toCurrencyId);
    if (
      createExchangeRateDto.fromCurrencyId ===
      createExchangeRateDto.toCurrencyId
    ) {
      throw I18nException.badRequest('exchange_rates.errors.same_currency');
    }
    const date = new Date(createExchangeRateDto.date);
    if (isNaN(date.getTime())) {
      throw I18nException.badRequest('exchange_rates.errors.invalid_date');
    }
    const existing = await this.prisma.exchangeRate.findUnique({
      where: {
        companyId_fromCurrencyId_toCurrencyId_date: {
          companyId,
          fromCurrencyId: createExchangeRateDto.fromCurrencyId,
          toCurrencyId: createExchangeRateDto.toCurrencyId,
          date,
        },
      },
    });
    if (existing) {
      throw I18nException.badRequest('exchange_rates.errors.already_exists');
    }
    try {
      const exchangeRate = await this.prisma.exchangeRate.create({
        data: {
          companyId,
          fromCurrencyId: createExchangeRateDto.fromCurrencyId,
          toCurrencyId: createExchangeRateDto.toCurrencyId,
          date,
          rate: new Prisma.Decimal(createExchangeRateDto.rate),
        },
        select: this.selectWithCurrencies(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'exchange-rates',
        'Tipo de Cambio',
        exchangeRate.id,
      );

      return {
        message: 'exchange_rates.success.created',
        data: this.serialize(exchangeRate),
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('exchange_rates.errors.already_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number, date?: string) {
    const where: { companyId: number; date?: Date } = { companyId };
    if (date != null && date !== '') {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        where.date = d;
      }
    }
    const rates = await this.prisma.exchangeRate.findMany({
      where,
      select: this.selectWithCurrencies(),
      orderBy: [{ date: 'desc' }, { createdAt: 'desc' }],
    });
    return rates.map((r) => this.serialize(r));
  }

  async findOne(id: number, companyId: number) {
    const rate = await this.prisma.exchangeRate.findFirst({
      where: { id, companyId },
      select: this.selectWithCurrencies(),
    });
    if (!rate) {
      throw I18nException.notFound('exchange_rates.errors.not_found');
    }
    return this.serialize(rate);
  }

  async update(
    id: number,
    updateExchangeRateDto: UpdateExchangeRateDto,
    companyId: number,
    userId: number,
  ) {
    const current = await this.findOne(id, companyId);
    if (updateExchangeRateDto.fromCurrencyId != null) {
      await this.ensureCurrencyExists(updateExchangeRateDto.fromCurrencyId);
    }
    if (updateExchangeRateDto.toCurrencyId != null) {
      await this.ensureCurrencyExists(updateExchangeRateDto.toCurrencyId);
    }
    const fromId =
      updateExchangeRateDto.fromCurrencyId ?? current.fromCurrencyId;
    const toId = updateExchangeRateDto.toCurrencyId ?? current.toCurrencyId;
    if (fromId === toId) {
      throw I18nException.badRequest('exchange_rates.errors.same_currency');
    }
    const data: Record<string, unknown> = { ...updateExchangeRateDto };
    if (updateExchangeRateDto.date != null) {
      const date = new Date(updateExchangeRateDto.date);
      if (isNaN(date.getTime())) {
        throw I18nException.badRequest('exchange_rates.errors.invalid_date');
      }
      data.date = date;
    }
    if (updateExchangeRateDto.rate != null) {
      data.rate = new Prisma.Decimal(updateExchangeRateDto.rate);
    }
    try {
      const rate = await this.prisma.exchangeRate.update({
        where: { id },
        data,
        select: this.selectWithCurrencies(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'exchange-rates',
        'Tipo de Cambio',
        rate.id,
      );

      return {
        message: 'exchange_rates.success.updated',
        data: this.serialize(rate),
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('exchange_rates.errors.already_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    await this.prisma.exchangeRate.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'exchange-rates',
      'Tipo de Cambio',
      id,
    );

    return { message: 'exchange_rates.success.deleted' };
  }

  private selectWithCurrencies() {
    return {
      id: true,
      companyId: true,
      fromCurrencyId: true,
      toCurrencyId: true,
      date: true,
      rate: true,
      fromCurrency: {
        select: { id: true, code: true, name: true, symbol: true },
      },
      toCurrency: {
        select: { id: true, code: true, name: true, symbol: true },
      },
      createdAt: true,
      updatedAt: true,
    };
  }

  private serialize<T extends { rate: Prisma.Decimal }>(
    rate: T,
  ): Omit<T, 'rate'> & { rate: number } {
    return { ...rate, rate: Number(rate.rate) };
  }
}
