import { Injectable, Logger } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { AuditService } from '../audit/audit.service';
import { PrismaService } from '../prisma/prisma.service';
import { removeUploadedFile } from '../upload/upload.config';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { UpdateHierarchyConfigDto } from './dto/update-hierarchy-config.dto';

const DEFAULT_PAYMENT_METHODS = [
  { name: 'Efectivo', code: 'CASH', requiresReference: false },
  { name: 'Tarjeta', code: 'CARD', requiresReference: true },
  { name: 'Transferencia', code: 'TRANSFER', requiresReference: true },
];

@Injectable()
export class CompaniesService {
  private readonly logger = new Logger(CompaniesService.name);

  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createCompanyDto: CreateCompanyDto, userId: number) {
    const result = await this.prisma.$transaction(async (tx) => {
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
          taxDocumentType: true,
          taxDocumentNumber: true,
          taxCheckDigit: true,
          fiscalName: true,
        },
      });

      const companyUser = await tx.companyUser.create({
        data: {
          userId,
          companyId: company.id,
        },
      });

      const permissions = await tx.permission.findMany({ select: { id: true } });
      const ownerRole = await tx.companyRole.create({
        data: {
          companyId: company.id,
          name: 'Administrador',
          description: 'Acceso inicial completo; puede reemplazarse por roles personalizados.',
          permissions: { create: permissions.map(({ id }) => ({ permissionId: id })) },
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

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    return company;
  }

  async update(id: number, updateCompanyDto: UpdateCompanyDto, userId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id },
    });

    if (!company) {
      throw I18nException.notFound('companies.errors.not_found');
    }

    if (updateCompanyDto.defaultCurrencyId != null) {
      const currency = await this.prisma.currency.findUnique({
        where: { id: updateCompanyDto.defaultCurrencyId },
      });
      if (!currency) {
        throw I18nException.badRequest('currencies.errors.not_found');
      }
    }

    const updatedCompany = await this.prisma.company.update({
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

    return {
      message: 'companies.success.updated',
      data: updatedCompany,
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
}
