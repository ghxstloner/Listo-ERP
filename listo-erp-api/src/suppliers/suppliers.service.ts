import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(createSupplierDto: CreateSupplierDto, companyId: number) {
    const supplier = await this.prisma.supplier.create({
      data: {
        name: createSupplierDto.name,
        taxId: createSupplierDto.taxId,
        address: createSupplierDto.address,
        phone: createSupplierDto.phone,
        email: createSupplierDto.email,
        contactName: createSupplierDto.contactName,
        isActive: createSupplierDto.isActive ?? true,
        companyId,
      },
      select: this.selectBase(),
    });
    return {
      message: 'suppliers.success.created',
      data: supplier,
    };
  }

  async findAll(companyId: number) {
    const suppliers = await this.prisma.supplier.findMany({
      where: { companyId },
      select: this.selectBase(),
      orderBy: { createdAt: 'desc' },
    });
    return suppliers;
  }

  async findOne(id: number, companyId: number) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id, companyId },
      select: this.selectBase(),
    });
    if (!supplier) {
      throw I18nException.notFound('suppliers.errors.not_found');
    }
    return supplier;
  }

  async update(
    id: number,
    updateSupplierDto: UpdateSupplierDto,
    companyId: number,
  ) {
    await this.findOne(id, companyId);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
      select: this.selectBase(),
    });
    return {
      message: 'suppliers.success.updated',
      data: supplier,
    };
  }

  async remove(id: number, companyId: number) {
    await this.findOne(id, companyId);
    const productsCount = await this.prisma.product.count({
      where: { supplierId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('suppliers.errors.has_products', {
        count: productsCount,
      });
    }
    await this.prisma.supplier.delete({ where: { id } });
    return { message: 'suppliers.success.deleted' };
  }

  private selectBase() {
    return {
      id: true,
      name: true,
      taxId: true,
      address: true,
      phone: true,
      email: true,
      contactName: true,
      isActive: true,
      companyId: true,
      createdAt: true,
      updatedAt: true,
    };
  }
}
