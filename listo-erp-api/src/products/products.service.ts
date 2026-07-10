import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  private async validateHierarchy(
    companyId: number,
    departmentId: number,
    subdepartmentId?: number,
    categoryId?: number,
    subcategoryId?: number,
  ) {
    const department = await this.prisma.department.findFirst({
      where: { id: departmentId, companyId },
    });
    if (!department) {
      throw I18nException.badRequest('products.errors.department_not_found');
    }
    if (subdepartmentId != null) {
      const sub = await this.prisma.subdepartment.findFirst({
        where: { id: subdepartmentId, departmentId },
      });
      if (!sub) {
        throw I18nException.badRequest(
          'products.errors.subdepartment_not_found',
        );
      }
    }
    if (categoryId != null) {
      const subId = subdepartmentId;
      if (subId == null) {
        throw I18nException.badRequest(
          'products.errors.subdepartment_required',
        );
      }
      const cat = await this.prisma.category.findFirst({
        where: { id: categoryId, subdepartmentId: subId },
      });
      if (!cat) {
        throw I18nException.badRequest('products.errors.category_not_found');
      }
    }
    if (subcategoryId != null) {
      const catId = categoryId;
      if (catId == null) {
        throw I18nException.badRequest('products.errors.category_required');
      }
      const subcat = await this.prisma.subcategory.findFirst({
        where: { id: subcategoryId, categoryId: catId },
      });
      if (!subcat) {
        throw I18nException.badRequest('products.errors.subcategory_not_found');
      }
    }
  }

  private async ensureSupplierBelongsToCompany(
    supplierId: number,
    companyId: number,
  ) {
    const supplier = await this.prisma.supplier.findFirst({
      where: { id: supplierId, companyId },
    });
    if (!supplier) {
      throw I18nException.badRequest('products.errors.supplier_not_found');
    }
  }

  async create(
    createProductDto: CreateProductDto,
    companyId: number,
    userId: number,
  ) {
    const sku = createProductDto.sku.trim();
    if (sku === '') {
      throw I18nException.badRequest('products.errors.sku_empty');
    }
    await this.validateHierarchy(
      companyId,
      createProductDto.departmentId,
      createProductDto.subdepartmentId,
      createProductDto.categoryId,
      createProductDto.subcategoryId,
    );
    if (createProductDto.supplierId != null) {
      await this.ensureSupplierBelongsToCompany(
        createProductDto.supplierId,
        companyId,
      );
    }
    const existing = await this.prisma.product.findUnique({
      where: { companyId_sku: { companyId, sku } },
    });
    if (existing) {
      throw I18nException.badRequest('products.errors.sku_exists');
    }
    try {
      const product = await this.prisma.product.create({
        data: {
          sku,
          name: createProductDto.name,
          description: createProductDto.description,
          salePrice: new Prisma.Decimal(createProductDto.salePrice),
          costPrice:
            createProductDto.costPrice != null
              ? new Prisma.Decimal(createProductDto.costPrice)
              : null,
          taxRate:
            createProductDto.taxRate != null
              ? new Prisma.Decimal(createProductDto.taxRate)
              : null,
          departmentId: createProductDto.departmentId,
          subdepartmentId: createProductDto.subdepartmentId ?? null,
          categoryId: createProductDto.categoryId ?? null,
          subcategoryId: createProductDto.subcategoryId ?? null,
          unit: createProductDto.unit ?? null,
          supplierId: createProductDto.supplierId ?? null,
          isActive: createProductDto.isActive ?? true,
          companyId,
        },
        select: this.selectWithRelations(),
      });

      await this.auditService.logCreate(
        userId,
        companyId,
        'products',
        'Producto',
        product.id,
      );

      return {
        message: 'products.success.created',
        data: this.serializeProduct(product),
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('products.errors.sku_exists');
      }
      throw e;
    }
  }

  async findAll(companyId: number, departmentId?: number) {
    const where: { companyId: number; departmentId?: number } = { companyId };
    if (departmentId != null) {
      where.departmentId = departmentId;
    }
    const products = await this.prisma.product.findMany({
      where,
      select: this.selectWithRelations(),
      orderBy: { createdAt: 'desc' },
    });
    return {
      data: products.map((p) => this.serializeProduct(p)),
      meta: {
        entityName: 'Producto',
      },
    };
  }

  async findOne(id: number, companyId: number) {
    const product = await this.prisma.product.findFirst({
      where: { id, companyId },
      select: this.selectWithRelations(),
    });
    if (!product) {
      throw I18nException.notFound('products.errors.not_found');
    }
    return this.serializeProduct(product);
  }

  async update(
    id: number,
    updateProductDto: UpdateProductDto,
    companyId: number,
    userId: number,
  ) {
    const current = await this.findOne(id, companyId);
    const departmentId = updateProductDto.departmentId ?? current.departmentId;
    const subdepartmentId =
      updateProductDto.subdepartmentId ?? current.subdepartmentId ?? undefined;
    const categoryId =
      updateProductDto.categoryId ?? current.categoryId ?? undefined;
    const subcategoryId =
      updateProductDto.subcategoryId ?? current.subcategoryId ?? undefined;
    await this.validateHierarchy(
      companyId,
      departmentId,
      subdepartmentId,
      categoryId,
      subcategoryId,
    );
    if (updateProductDto.supplierId != null) {
      await this.ensureSupplierBelongsToCompany(
        updateProductDto.supplierId,
        companyId,
      );
    }
    const data: Record<string, unknown> = { ...updateProductDto };
    if (updateProductDto.sku != null) {
      const sku = updateProductDto.sku.trim();
      if (sku === '') {
        throw I18nException.badRequest('products.errors.sku_empty');
      }
      const existing = await this.prisma.product.findFirst({
        where: { companyId, sku, id: { not: id } },
      });
      if (existing) {
        throw I18nException.badRequest('products.errors.sku_exists');
      }
      data.sku = sku;
    }
    if (updateProductDto.salePrice != null) {
      data.salePrice = new Prisma.Decimal(updateProductDto.salePrice);
    }
    if (updateProductDto.costPrice !== undefined) {
      data.costPrice =
        updateProductDto.costPrice != null
          ? new Prisma.Decimal(updateProductDto.costPrice)
          : null;
    }
    if (updateProductDto.taxRate !== undefined) {
      data.taxRate =
        updateProductDto.taxRate != null
          ? new Prisma.Decimal(updateProductDto.taxRate)
          : null;
    }
    try {
      const product = await this.prisma.product.update({
        where: { id },
        data,
        select: this.selectWithRelations(),
      });

      await this.auditService.logUpdate(
        userId,
        companyId,
        'products',
        'Producto',
        product.id,
      );

      return {
        message: 'products.success.updated',
        data: this.serializeProduct(product),
      };
    } catch (e) {
      if (isUniqueConstraintError(e)) {
        throw I18nException.badRequest('products.errors.sku_exists');
      }
      throw e;
    }
  }

  async remove(id: number, companyId: number, userId: number) {
    await this.findOne(id, companyId);
    await this.prisma.product.delete({ where: { id } });

    await this.auditService.logDelete(
      userId,
      companyId,
      'products',
      'Producto',
      id,
    );

    return { message: 'products.success.deleted' };
  }

  async updateImage(id: number, companyId: number, relativePath: string) {
    await this.findOne(id, companyId);
    const product = await this.prisma.product.update({
      where: { id },
      data: { image: relativePath },
      select: this.selectWithRelations(),
    });
    return this.serializeProduct(product);
  }

  private selectWithRelations() {
    return {
      id: true,
      sku: true,
      name: true,
      description: true,
      salePrice: true,
      costPrice: true,
      taxRate: true,
      unit: true,
      image: true,
      isActive: true,
      companyId: true,
      departmentId: true,
      subdepartmentId: true,
      categoryId: true,
      subcategoryId: true,
      supplierId: true,
      department: {
        select: { id: true, name: true, code: true },
      },
      subdepartment: {
        select: { id: true, name: true, code: true },
      },
      category: {
        select: { id: true, name: true, code: true },
      },
      subcategory: {
        select: { id: true, name: true, code: true },
      },
      supplier: {
        select: { id: true, name: true, taxId: true },
      },
      createdAt: true,
      updatedAt: true,
    };
  }

  private serializeProduct<
    T extends {
      salePrice: Prisma.Decimal;
      costPrice: Prisma.Decimal | null;
      taxRate: Prisma.Decimal | null;
    },
  >(
    product: T,
  ): Omit<T, 'salePrice' | 'costPrice' | 'taxRate'> & {
    salePrice: number;
    costPrice: number | null;
    taxRate: number | null;
  } {
    return {
      ...product,
      salePrice: Number(product.salePrice),
      costPrice: product.costPrice != null ? Number(product.costPrice) : null,
      taxRate: product.taxRate != null ? Number(product.taxRate) : null,
    };
  }
}
