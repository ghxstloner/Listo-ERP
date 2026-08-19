import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { ProductType } from '@prisma/client';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';

@Injectable()
export class SuppliersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(
    createSupplierDto: CreateSupplierDto,
    companyId: number,
    userId: number,
  ) {
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
    await this.auditService.logCreate(
      userId,
      companyId,
      'suppliers',
      'Proveedor',
      supplier.id,
    );
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
    userId: number,
  ) {
    await this.findOne(id, companyId);
    const supplier = await this.prisma.supplier.update({
      where: { id },
      data: updateSupplierDto,
      select: this.selectBase(),
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'suppliers',
      'Proveedor',
      supplier.id,
    );
    return {
      message: 'suppliers.success.updated',
      data: supplier,
    };
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    const productsCount = await this.prisma.supplierProduct.count({
      where: { supplierId: id },
    });
    if (productsCount > 0) {
      throw I18nException.badRequest('suppliers.errors.has_products', {
        count: productsCount,
      });
    }
    const ordersCount = await this.prisma.purchaseOrder.count({
      where: { supplierId: id },
    });
    if (ordersCount > 0) {
      throw I18nException.badRequest('suppliers.errors.has_purchase_orders', {
        count: ordersCount,
      });
    }
    await this.prisma.supplier.delete({ where: { id } });
    await this.auditService.logDelete(
      userId,
      companyId,
      'suppliers',
      'Proveedor',
      id,
    );
    return { message: 'suppliers.success.deleted' };
  }

  async addProduct(
    supplierId: number,
    dto: CreateSupplierProductDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(supplierId, companyId);
    await this.ensureProduct(dto.productId, companyId);
    try {
      const item = await this.prisma.supplierProduct.create({
        data: {
          supplierId,
          productId: dto.productId,
        },
        select: this.selectSupplierProduct(),
      });
      await this.auditService.logCreate(
        userId,
        companyId,
        'supplier-products',
        'Producto de proveedor',
        item.id,
      );
      return {
        message: 'suppliers.success.product_added',
        data: item,
      };
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002')
        throw I18nException.badRequest(
          'suppliers.errors.product_already_added',
        );
      throw error;
    }
  }

  async findProducts(supplierId: number, companyId: number) {
    await this.findOne(supplierId, companyId);
    const items = await this.prisma.supplierProduct.findMany({
      where: { supplierId },
      select: this.selectSupplierProduct(),
      orderBy: { createdAt: 'desc' },
    });
    return items;
  }

  async removeProduct(
    supplierId: number,
    id: number,
    companyId: number,
    userId: number,
  ) {
    const item = await this.prisma.supplierProduct.findFirst({
      where: { id, supplierId, supplier: { companyId } },
    });
    if (!item)
      throw I18nException.notFound('suppliers.errors.product_not_found');
    await this.prisma.supplierProduct.delete({ where: { id } });
    await this.auditService.logDelete(
      userId,
      companyId,
      'supplier-products',
      'Producto de proveedor',
      id,
    );
    return { message: 'suppliers.success.product_removed' };
  }

  private async ensureProduct(id: number, companyId: number) {
    if (
      !(await this.prisma.product.findFirst({
        where: { id, companyId, productType: ProductType.PRODUCT },
      }))
    )
      throw I18nException.badRequest('suppliers.errors.product_not_found');
  }

  private selectSupplierProduct() {
    return {
      id: true,
      supplierId: true,
      productId: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      product: { select: { id: true, sku: true, name: true } },
    };
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
