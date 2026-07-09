import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CountriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.country.findMany({
      where: { isActive: true },
      select: {
        id: true,
        code: true,
        name: true,
        taxDocumentTypes: true,
        isActive: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: number) {
    const country = await this.prisma.country.findUnique({
      where: { id },
      select: {
        id: true,
        code: true,
        name: true,
        taxDocumentTypes: true,
        isActive: true,
      },
    });

    if (!country) {
      throw I18nException.notFound('countries.errors.not_found');
    }

    return country;
  }

  async findByCode(code: string) {
    const country = await this.prisma.country.findUnique({
      where: { code },
      select: {
        id: true,
        code: true,
        name: true,
        taxDocumentTypes: true,
        isActive: true,
      },
    });

    if (!country) {
      throw I18nException.notFound('countries.errors.not_found');
    }

    return country;
  }
}
