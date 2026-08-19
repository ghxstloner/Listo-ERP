import { Injectable, Logger } from '@nestjs/common';
import { Prisma, ProductType } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { removeUploadedFile } from '../upload/upload.config';
import { CreateProductDto } from './dto/create-product.dto';
import { CreateProductPriceDto } from './dto/create-product-price.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

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
      if (subdepartmentId == null) {
        throw I18nException.badRequest(
          'products.errors.subdepartment_required',
        );
      }
      const category = await this.prisma.category.findFirst({
        where: { id: categoryId, subdepartmentId },
      });
      if (!category) {
        throw I18nException.badRequest('products.errors.category_not_found');
      }
    }
    if (subcategoryId != null) {
      if (categoryId == null) {
        throw I18nException.badRequest('products.errors.category_required');
      }
      const subcategory = await this.prisma.subcategory.findFirst({
        where: { id: subcategoryId, categoryId },
      });
      if (!subcategory) {
        throw I18nException.badRequest('products.errors.subcategory_not_found');
      }
    }
  }

  async create(
    createProductDto: CreateProductDto,
    companyId: number,
    userId: number,
  ) {
    const sku = createProductDto.sku.trim();
    const dianCode = this.normalizeDianCode(createProductDto.dianCode);
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
    const existing = await this.prisma.product.findUnique({
      where: { companyId_sku: { companyId, sku } },
    });
    if (existing) {
      throw I18nException.badRequest('products.errors.sku_exists');
    }
    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            sku,
            name: createProductDto.name,
            description: null,
            salePrice: new Prisma.Decimal(createProductDto.salePrice),
            costPrice:
              createProductDto.costPrice != null
                ? new Prisma.Decimal(createProductDto.costPrice)
                : null,
            isExempt: createProductDto.isExempt ?? false,
            taxRate:
              createProductDto.taxRate != null
                ? new Prisma.Decimal(createProductDto.taxRate)
                : null,
            productType: createProductDto.productType ?? ProductType.PRODUCT,
            departmentId: createProductDto.departmentId,
            subdepartmentId: createProductDto.subdepartmentId ?? null,
            categoryId: createProductDto.categoryId ?? null,
            subcategoryId: createProductDto.subcategoryId ?? null,
            unit: null,
            dianCode,
            isActive: createProductDto.isActive ?? true,
            companyId,
          },
        });
        const defaultPrice = await tx.productPrice.create({
          data: {
            productId: created.id,
            name: 'Precio base',
            amount: new Prisma.Decimal(createProductDto.salePrice),
          },
        });
        await tx.product.update({
          where: { id: created.id },
          data: { defaultPriceId: defaultPrice.id },
        });
        return tx.product.findUniqueOrThrow({
          where: { id: created.id },
          select: this.selectWithRelations(),
        });
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

  async findAll(
    companyId: number,
    filters: Pick<
      Prisma.ProductWhereInput,
      'departmentId'
      | 'subdepartmentId'
      | 'categoryId'
      | 'subcategoryId'
      | 'productType'
    > = {},
  ) {
    const where: Prisma.ProductWhereInput = { companyId, ...filters };
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
      updateProductDto.subdepartmentId === undefined
        ? (current.subdepartmentId ?? undefined)
        : (updateProductDto.subdepartmentId ?? undefined);
    const categoryId =
      updateProductDto.categoryId === undefined
        ? (current.categoryId ?? undefined)
        : (updateProductDto.categoryId ?? undefined);
    const subcategoryId =
      updateProductDto.subcategoryId === undefined
        ? (current.subcategoryId ?? undefined)
        : (updateProductDto.subcategoryId ?? undefined);
    await this.validateHierarchy(
      companyId,
      departmentId,
      subdepartmentId,
      categoryId,
      subcategoryId,
    );
    const { defaultPriceId: requestedDefaultPriceId, ...productDtoData } =
      updateProductDto;
    const data: Record<string, unknown> = { ...productDtoData };
    let selectedDefaultPrice: { id: number; amount: Prisma.Decimal } | null =
      null;
    if (
      requestedDefaultPriceId !== undefined &&
      requestedDefaultPriceId !== null
    ) {
      selectedDefaultPrice = await this.prisma.productPrice.findFirst({
        where: {
          id: requestedDefaultPriceId,
          productId: id,
          isActive: true,
          product: { companyId },
        },
        select: { id: true, amount: true },
      });
      if (!selectedDefaultPrice) {
        throw I18nException.badRequest(
          'products.errors.default_price_not_found',
        );
      }
      data.defaultPriceId = selectedDefaultPrice.id;
    } else if (requestedDefaultPriceId === null) {
      data.defaultPriceId = null;
    }
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
    if (updateProductDto.taxRate !== undefined) {
      data.taxRate =
        updateProductDto.taxRate != null
          ? new Prisma.Decimal(updateProductDto.taxRate)
          : null;
    }
    if (updateProductDto.costPrice !== undefined) {
      data.costPrice =
        updateProductDto.costPrice != null
          ? new Prisma.Decimal(updateProductDto.costPrice)
          : null;
    }
    if (updateProductDto.isExempt !== undefined) {
      data.isExempt = updateProductDto.isExempt;
    }
    if (updateProductDto.dianCode !== undefined) {
      data.dianCode = this.normalizeDianCode(updateProductDto.dianCode);
    }
    const targetDefaultPriceId =
      requestedDefaultPriceId !== undefined
        ? requestedDefaultPriceId
        : current.defaultPriceId;
    if (selectedDefaultPrice && updateProductDto.salePrice == null) {
      data.salePrice = selectedDefaultPrice.amount;
    }
    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.product.update({
          where: { id },
          data,
        });
        if (
          updateProductDto.salePrice != null &&
          targetDefaultPriceId != null
        ) {
          await tx.productPrice.updateMany({
            where: { id: targetDefaultPriceId, productId: id },
            data: { amount: new Prisma.Decimal(updateProductDto.salePrice) },
          });
        }
        return tx.product.findUniqueOrThrow({
          where: { id: updated.id },
          select: this.selectWithRelations(),
        });
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

  async findPrices(
    productId: number,
    companyId: number,
    includeInactive = false,
  ) {
    await this.findOne(productId, companyId);
    const prices = await this.prisma.productPrice.findMany({
      where: {
        productId,
        product: { companyId },
        ...(includeInactive ? {} : { isActive: true }),
      },
      orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
    });
    return {
      data: prices.map((price) => this.serializePrice(price)),
      meta: { entityName: 'Precio de producto' },
    };
  }

  async createPrice(
    productId: number,
    dto: CreateProductPriceDto,
    companyId: number,
    userId: number,
  ) {
    await this.findOne(productId, companyId);
    const name = this.getPriceName(dto.name, dto.label);
    const price = await this.prisma.productPrice.create({
      data: {
        productId,
        name,
        amount: new Prisma.Decimal(dto.amount),
        isActive: dto.isActive ?? true,
        sortOrder: dto.sortOrder ?? 0,
      },
    });
    await this.auditService.logCreate(
      userId,
      companyId,
      'product-prices',
      'Precio de producto',
      price.id,
    );
    return {
      message: 'products.success.price_created',
      data: this.serializePrice(price),
    };
  }

  async updatePrice(
    productId: number,
    priceId: number,
    dto: UpdateProductPriceDto,
    companyId: number,
    userId: number,
  ) {
    const current = await this.prisma.productPrice.findFirst({
      where: { id: priceId, productId, product: { companyId } },
      include: { product: { select: { defaultPriceId: true } } },
    });
    if (!current) {
      throw I18nException.notFound('products.errors.price_not_found');
    }
    if (dto.isActive === false && current.product.defaultPriceId === priceId) {
      throw I18nException.badRequest('products.errors.default_price_inactive');
    }
    const data: Prisma.ProductPriceUpdateInput = {};
    if (dto.name !== undefined || dto.label !== undefined) {
      data.name = this.getPriceName(dto.name, dto.label, current.name);
    }
    if (dto.amount !== undefined) {
      data.amount = new Prisma.Decimal(dto.amount);
    }
    if (dto.isActive !== undefined) data.isActive = dto.isActive;
    if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
    const price = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.productPrice.update({
        where: { id: priceId },
        data,
      });
      if (
        current.product.defaultPriceId === priceId &&
        dto.amount !== undefined
      ) {
        await tx.product.update({
          where: { id: productId },
          data: { salePrice: new Prisma.Decimal(dto.amount) },
        });
      }
      return updated;
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'product-prices',
      'Precio de producto',
      priceId,
    );
    return {
      message: 'products.success.price_updated',
      data: this.serializePrice(price),
    };
  }

  async setDefaultPrice(
    productId: number,
    priceId: number,
    companyId: number,
    userId: number,
  ) {
    const price = await this.prisma.productPrice.findFirst({
      where: {
        id: priceId,
        productId,
        isActive: true,
        product: { companyId },
      },
      select: { id: true, amount: true },
    });
    if (!price) {
      throw I18nException.badRequest('products.errors.default_price_not_found');
    }
    const product = await this.prisma.product.update({
      where: { id: productId },
      data: { defaultPriceId: price.id, salePrice: price.amount },
      select: this.selectWithRelations(),
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'products',
      'Producto',
      productId,
    );
    return {
      message: 'products.success.default_price_updated',
      data: this.serializeProduct(product),
    };
  }

  async removePrice(
    productId: number,
    priceId: number,
    companyId: number,
    userId: number,
  ) {
    const price = await this.prisma.productPrice.findFirst({
      where: { id: priceId, productId, product: { companyId } },
      select: { id: true, product: { select: { defaultPriceId: true } } },
    });
    if (!price) {
      throw I18nException.notFound('products.errors.price_not_found');
    }
    if (price.product.defaultPriceId === priceId) {
      throw I18nException.badRequest('products.errors.default_price_required');
    }
    await this.prisma.productPrice.delete({ where: { id: priceId } });
    await this.auditService.logDelete(
      userId,
      companyId,
      'product-prices',
      'Precio de producto',
      priceId,
    );
    return { message: 'products.success.price_deleted' };
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
    const currentProduct = await this.findOne(id, companyId);
    const product = await this.prisma.product.update({
      where: { id },
      data: { image: relativePath },
      select: this.selectWithRelations(),
    });
    if (currentProduct.image && currentProduct.image !== relativePath) {
      try {
        await removeUploadedFile('products', currentProduct.image);
      } catch (error) {
        this.logger.warn(
          `No se pudo eliminar la imagen anterior del producto ${id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return this.serializeProduct(product);
  }

  private selectWithRelations() {
    return {
      id: true,
      sku: true,
      name: true,
      description: true,
      salePrice: true,
      defaultPriceId: true,
      costPrice: true,
      taxRate: true,
      isExempt: true,
      productType: true,
      unit: true,
      dianCode: true,
      image: true,
      isActive: true,
      companyId: true,
      departmentId: true,
      subdepartmentId: true,
      categoryId: true,
      subcategoryId: true,
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
      prices: {
        where: { isActive: true },
        orderBy: [{ sortOrder: 'asc' as const }, { id: 'asc' as const }],
        select: {
          id: true,
          productId: true,
          name: true,
          amount: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      defaultPrice: {
        select: {
          id: true,
          productId: true,
          name: true,
          amount: true,
          isActive: true,
          sortOrder: true,
          createdAt: true,
          updatedAt: true,
        },
      },
      createdAt: true,
      updatedAt: true,
    };
  }

  private serializeProduct<
    T extends {
      salePrice: Prisma.Decimal;
      defaultPriceId: number | null;
      costPrice: Prisma.Decimal | null;
      taxRate: Prisma.Decimal | null;
      prices?: Array<{ amount: Prisma.Decimal }>;
      defaultPrice?: { amount: Prisma.Decimal } | null;
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
      prices: product.prices?.map((price) => this.serializePrice(price)),
      defaultPrice: product.defaultPrice
        ? this.serializePrice(product.defaultPrice)
        : null,
    };
  }

  private serializePrice<T extends { amount: Prisma.Decimal }>(price: T) {
    return { ...price, amount: Number(price.amount) };
  }

  private getPriceName(name?: string, label?: string, current?: string) {
    const value = (name ?? label ?? current ?? '').trim();
    if (!value) {
      throw I18nException.badRequest('products.errors.price_name_required');
    }
    return value;
  }

  private normalizeDianCode(dianCode: string | null | undefined) {
    const normalized = dianCode?.trim().toUpperCase();
    return normalized || 'ZZ';
  }
}
