import { Injectable, Logger } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { removeUploadedFile } from '../upload/upload.config';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateHierarchyConfigDto } from './dto/update-hierarchy-config.dto';

const DEFAULT_PAYMENT_METHODS = [
  {
    name: 'Efectivo',
    code: 'CASH',
    dianCode: '10',
  },
  { name: 'Tarjeta', code: 'CARD' },
  { name: 'Transferencia', code: 'TRANSFER' },
];

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: number) {
    await this.validateTaxDocument(createCompanyDto);
    const result = await this.prisma.$transaction(async (tx) => {
      const defaultCurrency = await tx.currency.findUnique({
        where: { code: 'USD' },
        select: { id: true },
      });
      const company = await tx.company.create({
        data: {
          name: createCompanyDto.name,
          primaryColor: createCompanyDto.primaryColor,
          secondaryColor: createCompanyDto.secondaryColor,
          isActive: createCompanyDto.isActive ?? true,
          companyLogo: '',
          address: createCompanyDto.address,
          city: createCompanyDto.city,
          phone1: createCompanyDto.phone1,
          phone2: createCompanyDto.phone2,
          email1: createCompanyDto.email1,
          email2: createCompanyDto.email2,
          countryId: createCompanyDto.countryId,
          taxDocumentType: createCompanyDto.taxDocumentType,
          taxDocumentNumber: createCompanyDto.taxDocumentNumber,
          taxCheckDigit: createCompanyDto.taxCheckDigit,
          fiscalName: createCompanyDto.fiscalName,
          defaultCurrencyId: defaultCurrency?.id,
        },
        select: {
          id: true,
          name: true,
          primaryColor: true,
          secondaryColor: true,
          isActive: true,
          companyLogo: true,
          createdAt: true,
          updatedAt: true,
          address: true,
          city: true,
          phone1: true,
          phone2: true,
          email1: true,
          email2: true,
          countryId: true,
          defaultCustomerId: true,
          defaultSellerId: true,
          taxDocumentType: true,
          taxDocumentNumber: true,
          taxCheckDigit: true,
          fiscalName: true,
          defaultCurrencyId: true,
        },
      });

      const currencies = await tx.currency.findMany({
        select: { id: true, code: true, symbol: true },
      });
      await tx.companyCurrency.createMany({
        data: currencies.map((currency) => ({
          companyId: company.id,
          currencyId: currency.id,
          isActive: ['COP', 'USD', 'VES'].includes(currency.code),
          symbol: currency.symbol,
        })),
        skipDuplicates: true,
      });

      const companyUser = await tx.companyUser.create({
        data: {
          userId,
          companyId: company.id,
        },
      });

      const permissions = await tx.permission.findMany({
        select: { id: true },
      });
      const ownerRole = await tx.companyRole.create({
        data: {
          companyId: company.id,
          name: 'Administrador',
          description:
            'Acceso inicial completo; puede reemplazarse por roles personalizados.',
          permissions: {
            create: permissions.map(({ id }) => ({ permissionId: id })),
          },
        },
      });
      await tx.companyUserRole.create({
        data: { companyUserId: companyUser.id, roleId: ownerRole.id },
      });

      await tx.companyHierarchyConfig.create({
        data: {
          companyId: company.id,
          level1Name: 'Departamento',
          level2Name: 'Subdepartamento',
          level3Name: 'Categoría',
          level4Name: 'Subcategoría',
        },
      });

      await tx.paymentMethod.createMany({
        data: DEFAULT_PAYMENT_METHODS.map((paymentMethod) => ({
          ...paymentMethod,
          companyId: company.id,
          isActive: true,
        })),
        skipDuplicates: true,
      });

      return company;
    });

    await this.auditService.logCreate(
      userId,
      result.id,
      'companies',
      'Empresa',
      result.id,
    );

    return {
      message: 'companies.success.created',
      data: result,
    };
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        companyLogo: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        city: true,
        phone1: true,
        phone2: true,
        email1: true,
        email2: true,
        countryId: true,
        defaultCustomerId: true,
        defaultSellerId: true,
        defaultCurrencyId: true,
        taxDocumentType: true,
        taxDocumentNumber: true,
        taxCheckDigit: true,
        fiscalName: true,
         country: {
           select: {
             id: true,
             code: true,
             name: true,
             taxDocumentTypes: true,
           },
         },
          defaultCurrency: {
            select: {
              id: true,
              code: true,
              name: true,
              symbol: true,
              companySettings: {
                where: { companyId: id },
                select: {
                  symbol: true,
                  decimalPlaces: true,
                  decimalSeparator: true,
                  thousandsSeparator: true,
                  format: true,
                  rounding: true,
                },
              },
            },
          },
       },
     });

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    const { defaultCurrency, ...companyData } = company;
    const settings = defaultCurrency?.companySettings[0];

    return {
      ...companyData,
      defaultCurrency: defaultCurrency
        ? {
            id: defaultCurrency.id,
            code: defaultCurrency.code,
            name: defaultCurrency.name,
            symbol: settings?.symbol ?? defaultCurrency.symbol,
            decimalPlaces: settings?.decimalPlaces ?? 2,
            decimalSeparator: settings?.decimalSeparator ?? '.',
            thousandsSeparator: settings?.thousandsSeparator ?? ',',
            format: settings?.format ?? 'symbol_before',
            rounding: settings?.rounding ?? 'half_up',
          }
        : null,
    };
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto, userId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    await this.validateTaxDocument({
      countryId: updateCompanyDto.countryId ?? company.countryId ?? undefined,
      taxDocumentType:
        updateCompanyDto.taxDocumentType ??
        company.taxDocumentType ??
        undefined,
      taxDocumentNumber:
        updateCompanyDto.taxDocumentNumber ??
        company.taxDocumentNumber ??
        undefined,
      taxCheckDigit:
        updateCompanyDto.taxCheckDigit ?? company.taxCheckDigit ?? undefined,
    });

    const selectedCurrencyIds = [updateCompanyDto.defaultCurrencyId].filter(
      (value): value is number => value != null,
    );
    if (selectedCurrencyIds.length > 0) {
      const currencies = await this.prisma.currency.findMany({
        where: { id: { in: selectedCurrencyIds } },
        select: { id: true },
      });
      if (currencies.length !== new Set(selectedCurrencyIds).size) {
        throw I18nException.badRequest('currencies.errors.not_found');
      }
      const activeSettings = await this.prisma.companyCurrency.findMany({
        where: {
          companyId: id,
          currencyId: { in: selectedCurrencyIds },
          isActive: true,
        },
        select: { currencyId: true },
      });
      if (activeSettings.length !== new Set(selectedCurrencyIds).size) {
        throw I18nException.badRequest('currencies.errors.inactive');
      }
    }
    if (updateCompanyDto.defaultCustomerId != null) {
      const customer = await this.prisma.customer.findFirst({
        where: {
          id: updateCompanyDto.defaultCustomerId,
          companyId: id,
          isActive: true,
        },
        select: { id: true },
      });
      if (!customer) {
        throw I18nException.badRequest('customers.errors.not_found');
      }
    }
    if (updateCompanyDto.defaultSellerId != null) {
      const seller = await this.prisma.seller.findFirst({
        where: {
          id: updateCompanyDto.defaultSellerId,
          companyId: id,
          isActive: true,
        },
        select: { id: true },
      });
      if (!seller) {
        throw I18nException.badRequest('sellers.errors.not_found');
      }
    }

    await this.prisma.company.update({
      where: { id },
      data: updateCompanyDto,
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        city: true,
        phone1: true,
        phone2: true,
        email1: true,
        email2: true,
        countryId: true,
        defaultCustomerId: true,
        defaultSellerId: true,
        taxDocumentType: true,
        taxDocumentNumber: true,
        taxCheckDigit: true,
        fiscalName: true,
        defaultCurrencyId: true,
        country: {
          select: {
            id: true,
            code: true,
            name: true,
            taxDocumentTypes: true,
          },
        },
      },
    });

    await this.auditService.logUpdate(userId, id, 'companies', 'Empresa', id);

    const companyWithCurrency = await this.findOne(id);

    return {
      message: 'companies.success.updated',
      data: companyWithCurrency,
    };
  }

  async updateLogo(id: number, relativePath: string, userId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });
    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }
    const updated = await this.prisma.company.update({
      where: { id },
      data: { companyLogo: relativePath },
      select: {
        id: true,
        name: true,
        primaryColor: true,
        secondaryColor: true,
        isActive: true,
        companyLogo: true,
        createdAt: true,
        updatedAt: true,
        address: true,
        city: true,
        phone1: true,
        phone2: true,
        email1: true,
        email2: true,
        countryId: true,
        taxDocumentType: true,
        taxDocumentNumber: true,
        taxCheckDigit: true,
        fiscalName: true,
        country: {
          select: {
            id: true,
            code: true,
            name: true,
            taxDocumentTypes: true,
          },
        },
      },
    });

    if (company.companyLogo && company.companyLogo !== relativePath) {
      try {
        await removeUploadedFile('companies', company.companyLogo);
      } catch (error) {
        this.logger.warn(
          `No se pudo eliminar el logo anterior de la empresa ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }

    await this.auditService.logUpdate(userId, id, 'companies', 'Empresa', id);

    return updated;
  }

  async getHierarchyConfig(companyId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    const config = await this.prisma.companyHierarchyConfig.findUnique({
      where: { companyId },
    });

    if (!config) {
      return {
        companyId,
        level1Name: 'Departamento',
        level2Name: 'Subdepartamento',
        level3Name: 'Categoría',
        level4Name: 'Subcategoría',
      };
    }

    return config;
  }

  async updateHierarchyConfig(
    companyId: number,
    dto: UpdateHierarchyConfigDto,
    userId: number,
  ) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    const config = await this.prisma.companyHierarchyConfig.upsert({
      where: { companyId },
      create: {
        companyId,
        level1Name: dto.level1Name,
        level2Name: dto.level2Name,
        level3Name: dto.level3Name,
        level4Name: dto.level4Name,
      },
      update: {
        level1Name: dto.level1Name,
        level2Name: dto.level2Name,
        level3Name: dto.level3Name,
        level4Name: dto.level4Name,
      },
    });

    await this.auditService.logUpdate(
      userId,
      companyId,
      'companies',
      'Configuración de Jerarquía',
      companyId,
    );

    return {
      message: 'companies.success.hierarchy_config_updated',
      data: config,
    };
  }

  private async validateTaxDocument(input: {
    countryId?: number;
    taxDocumentType?: string;
    taxDocumentNumber?: string;
    taxCheckDigit?: string;
  }) {
    if (!input.taxDocumentType) return;
    if (!input.countryId) {
      throw I18nException.badRequest('companies.errors.tax_country_required');
    }

    const country = await this.prisma.country.findUnique({
      where: { id: input.countryId },
      select: { taxDocumentTypes: true },
    });
    const documentTypes = Array.isArray(country?.taxDocumentTypes)
      ? (country.taxDocumentTypes as Array<{
          code?: unknown;
          hasCheckDigit?: unknown;
        }>)
      : [];
    const documentType = documentTypes.find(
      (type) => type.code === input.taxDocumentType,
    );
    if (!documentType) {
      throw I18nException.badRequest(
        'companies.errors.invalid_tax_document_type',
      );
    }
    if (
      documentType.hasCheckDigit === true &&
      input.taxDocumentNumber?.trim() &&
      !input.taxCheckDigit?.trim()
    ) {
      throw I18nException.badRequest(
        'companies.errors.tax_check_digit_required',
      );
    }
  }
}
