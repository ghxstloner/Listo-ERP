import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async create(createCustomerDto: CreateCustomerDto, companyId: number) {
    const customer = await this.prisma.customer.create({
      data: {
        name: createCustomerDto.name,
        taxDocumentType: createCustomerDto.taxDocumentType,
        taxId: createCustomerDto.taxId,
        isFinalConsumer: createCustomerDto.isFinalConsumer ?? false,
        fiscalPersonType: createCustomerDto.fiscalPersonType,
        taxCheckDigit: createCustomerDto.taxCheckDigit,
        isActive: createCustomerDto.isActive ?? true,
        companyId,
      },
      select: this.selectBase(),
    });
    return {
      message: 'customers.success.created',
      data: customer,
    };
  }

  async findAll(companyId: number) {
    return this.prisma.customer.findMany({
      where: { companyId },
      select: this.selectBase(),
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, companyId: number) {
    const customer = await this.prisma.customer.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });
    if (!customer) {
      throw I18nException.notFound('customers.errors.not_found');
    }
    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    companyId: number,
  ) {
    await this.findOne(id, companyId);
    const customer = await this.prisma.customer.update({
      where: { id },
      data: updateCustomerDto,
      select: this.selectBase(),
    });
    return {
      message: 'customers.success.updated',
      data: customer,
    };
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    await this.prisma.customer.delete({ where: { id } });
    return { message: 'customers.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      name: true,
      taxDocumentType: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
      contactName: true,
      isFinalConsumer: true,
      fiscalPersonType: true,
      taxCheckDigit: true,
      rutResponsibilities: true,
      taxRegime: true,
      fiscalAddress: true,
      fiscalCountryCode: true,
      fiscalDepartmentCode: true,
      fiscalDepartment: true,
      fiscalCityCode: true,
      fiscalCity: true,
      fiscalTaxCodes: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
