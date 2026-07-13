import { AuditService } from '../audit/audit.service';
import { Injectable } from '@nestjs/common';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { CreateSupplierProductDto } from './dto/create-supplier-product.dto';
import { UpdateSupplierProductDto } from './dto/update-supplier-product.dto';
import { Prisma } from '@prisma/client';

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
    await this.ensureCurrency(dto.currencyId);
    try {
      const item = await this.prisma.$transaction(async (tx) => {
        if (dto.isPreferred)
          await tx.supplierProduct.updateMany({
            where: { productId: dto.productId, product: { companyId } },
            data: { isPreferred: false },
          });
        return tx.supplierProduct.create({
          data: {
            supplierId,
            productId: dto.productId,
            supplierSku: dto.supplierSku?.trim() || null,
            referenceCost:
              dto.referenceCost != null
                ? new Prisma.Decimal(dto.referenceCost)
                : null,
            currencyId: dto.currencyId ?? null,
            minimumQuantity:
              dto.minimumQuantity != null
                ? new Prisma.Decimal(dto.minimumQuantity)
                : null,
            leadTimeDays: dto.leadTimeDays ?? null,
            isPreferred: dto.isPreferred ?? false,
            isActive: dto.isActive ?? true,
          },
          select: this.selectSupplierProduct(),
        });
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
        data: this.serializeSupplierProduct(item),
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
    return items.map((item) => this.serializeSupplierProduct(item));
  }

  async updateProduct(
    supplierId: number,
    id: number,
    dto: UpdateSupplierProductDto,
    companyId: number,
    userId: number,
  ) {
    const current = await this.prisma.supplierProduct.findFirst({
      where: { id, supplierId, supplier: { companyId } },
      select: this.selectSupplierProduct(),
    });
    if (!current)
      throw I18nException.notFound('suppliers.errors.product_not_found');
    if (dto.productId != null && dto.productId !== current.productId)
      throw I18nException.badRequest('suppliers.errors.product_cannot_change');
    await this.ensureCurrency(dto.currencyId);
    const item = await this.prisma.$transaction(async (tx) => {
      if (dto.isPreferred)
        await tx.supplierProduct.updateMany({
          where: { productId: current.productId, product: { companyId } },
          data: { isPreferred: false },
        });
      return tx.supplierProduct.update({
        where: { id },
        data: this.supplierProductData(dto),
        select: this.selectSupplierProduct(),
      });
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'supplier-products',
      'Producto de proveedor',
      id,
    );
    return {
      message: 'suppliers.success.product_updated',
      data: this.serializeSupplierProduct(item),
    };
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
    if (!(await this.prisma.product.findFirst({ where: { id, companyId } })))
      throw I18nException.badRequest('suppliers.errors.product_not_found');
  }

  private async ensureCurrency(id?: number) {
    if (
      id != null &&
      !(await this.prisma.currency.findUnique({ where: { id } }))
    )
      throw I18nException.badRequest('suppliers.errors.currency_not_found');
  }

  private supplierProductData(
    dto: CreateSupplierProductDto | UpdateSupplierProductDto,
  ): Prisma.SupplierProductUncheckedUpdateInput {
    return {
      supplierSku: dto.supplierSku?.trim() || undefined,
      referenceCost:
        dto.referenceCost != null
          ? new Prisma.Decimal(dto.referenceCost)
          : undefined,
      currencyId: dto.currencyId,
      minimumQuantity:
        dto.minimumQuantity != null
          ? new Prisma.Decimal(dto.minimumQuantity)
          : undefined,
      leadTimeDays: dto.leadTimeDays,
      isPreferred: dto.isPreferred,
      isActive: dto.isActive,
    };
  }

  private selectSupplierProduct() {
    return {
      id: true,
      supplierId: true,
      productId: true,
      supplierSku: true,
      referenceCost: true,
      currencyId: true,
      minimumQuantity: true,
      leadTimeDays: true,
      isPreferred: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      product: { select: { id: true, sku: true, name: true } },
      currency: { select: { id: true, code: true, symbol: true } },
    };
  }

  private serializeSupplierProduct<
    T extends {
      referenceCost: Prisma.Decimal | null;
      minimumQuantity: Prisma.Decimal | null;
    },
  >(item: T) {
    return {
      ...item,
      referenceCost:
        item.referenceCost == null ? null : Number(item.referenceCost),
      minimumQuantity:
        item.minimumQuantity == null ? null : Number(item.minimumQuantity),
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
