import { Injectable } from '@nestjs/common';
import { Prisma, ProductType, PurchaseOrderStatus } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseOrderDto } from './dto/create-purchase-order.dto';

@Injectable()
export class PurchaseOrdersService {
  constructor(
    private prisma: PrismaService,
    private auditService: AuditService,
  ) {}

  async create(dto: CreatePurchaseOrderDto, companyId: number, userId: number) {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length)
      throw I18nException.badRequest(
        'purchase_orders.errors.duplicate_product',
      );

    const [company, supplier, warehouse, products, catalog] = await Promise.all(
      [
        this.prisma.company.findFirst({
          where: { id: companyId },
          select: { defaultCurrencyId: true },
        }),
        this.prisma.supplier.findFirst({
          where: { id: dto.supplierId, companyId, isActive: true },
        }),
        this.prisma.warehouse.findFirst({
          where: { id: dto.warehouseId, companyId, isActive: true },
        }),
        this.prisma.product.findMany({
          where: {
            companyId,
            id: { in: productIds },
            isActive: true,
            productType: ProductType.PRODUCT,
          },
          select: { id: true },
        }),
        this.prisma.supplierProduct.findMany({
          where: {
            supplierId: dto.supplierId,
            productId: { in: productIds },
            isActive: true,
          },
          select: { productId: true },
        }),
      ],
    );
    if (!supplier)
      throw I18nException.badRequest(
        'purchase_orders.errors.supplier_not_found',
      );
    if (!warehouse)
      throw I18nException.badRequest(
        'purchase_orders.errors.warehouse_not_found',
      );
    if (!company?.defaultCurrencyId)
      throw I18nException.badRequest(
        'purchase_orders.errors.default_currency_required',
      );
    if (products.length !== productIds.length)
      throw I18nException.badRequest(
        'purchase_orders.errors.product_not_found',
      );
    if (catalog.length !== productIds.length)
      throw I18nException.badRequest(
        'purchase_orders.errors.product_not_supplied',
      );

    const order = await this.prisma.purchaseOrder.create({
      data: {
        companyId,
        supplierId: dto.supplierId,
        warehouseId: dto.warehouseId,
        currencyId: company.defaultCurrencyId,
        notes: dto.notes?.trim() || null,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
            unitCost: new Prisma.Decimal(item.unitCost),
          })),
        },
      },
      select: this.selectOrder(),
    });
    await this.auditService.logCreate(
      userId,
      companyId,
      'purchase-orders',
      'Orden de compra',
      order.id,
    );
    return {
      message: 'purchase_orders.success.created',
      data: this.serializeOrder(order),
    };
  }

  async findAll(companyId: number) {
    const orders = await this.prisma.purchaseOrder.findMany({
      where: { companyId, status: PurchaseOrderStatus.PENDING },
      select: this.selectOrder(),
      orderBy: { createdAt: 'desc' },
    });
    return orders.map((order) => this.serializeOrder(order));
  }

  async findOne(id: number, companyId: number) {
    const order = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      select: this.selectOrder(),
    });
    if (!order)
      throw I18nException.notFound('purchase_orders.errors.not_found');
    return this.serializeOrder(order);
  }

  async findProductOrders(
    companyId: number,
    productId: number,
    filters: {
      warehouseId?: number;
      supplierId?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: Prisma.PurchaseOrderWhereInput = {
      companyId,
      status: PurchaseOrderStatus.RECEIVED,
      items: { some: { productId } },
    };
    if (filters.warehouseId != null) where.warehouseId = filters.warehouseId;
    if (filters.supplierId != null) where.supplierId = filters.supplierId;
    if (filters.dateFrom || filters.dateTo) {
      where.receivedAt = {};
      if (filters.dateFrom) where.receivedAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.receivedAt.lte = endDate;
      }
    }

    const orders = await this.prisma.purchaseOrder.findMany({
      where,
      orderBy: [{ receivedAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        status: true,
        createdAt: true,
        receivedAt: true,
        supplier: { select: { id: true, name: true, taxId: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          where: { productId },
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitCost: true,
          },
        },
      },
    });

    return orders.flatMap((order) =>
      order.items.map((item) => ({
        id: order.id,
        itemId: item.id,
        status: order.status,
        createdAt: order.createdAt,
        receivedAt: order.receivedAt,
        supplier: order.supplier,
        warehouse: order.warehouse,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        total: Number(item.quantity.mul(item.unitCost)),
      })),
    );
  }

  receive(id: number, companyId: number, userId: number) {
    void id;
    void companyId;
    void userId;
    throw I18nException.badRequest('purchase_orders.errors.invoice_required');
  }

  async cancel(id: number, companyId: number, userId: number) {
    const current = await this.prisma.purchaseOrder.findFirst({
      where: { id, companyId },
      select: { id: true, status: true },
    });
    if (!current)
      throw I18nException.notFound('purchase_orders.errors.not_found');
    if (current.status !== PurchaseOrderStatus.PENDING)
      throw I18nException.badRequest('purchase_orders.errors.not_pending');
    const order = await this.prisma.purchaseOrder.update({
      where: { id },
      data: { status: PurchaseOrderStatus.CANCELLED },
      select: this.selectOrder(),
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'purchase-orders',
      'Cancelación de orden de compra',
      id,
    );
    return {
      message: 'purchase_orders.success.cancelled',
      data: this.serializeOrder(order),
    };
  }

  private selectOrder() {
    return {
      id: true,
      companyId: true,
      supplierId: true,
      warehouseId: true,
      currencyId: true,
      exchangeRate: true,
      status: true,
      notes: true,
      receivedAt: true,
      receivedByUserId: true,
      createdAt: true,
      updatedAt: true,
      supplier: { select: { id: true, name: true, taxId: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      currency: { select: { id: true, code: true, symbol: true } },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          unitCost: true,
          product: { select: { id: true, sku: true, name: true } },
        },
      },
    };
  }

  private serializeOrder<
    T extends {
      exchangeRate: Prisma.Decimal;
      items: Array<{ quantity: Prisma.Decimal; unitCost: Prisma.Decimal }>;
    },
  >(order: T) {
    return {
      ...order,
      exchangeRate: Number(order.exchangeRate),
      items: order.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
      })),
    };
  }
}
