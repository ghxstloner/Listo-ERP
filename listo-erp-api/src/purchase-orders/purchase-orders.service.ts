import { Injectable } from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
  PurchaseOrderStatus,
} from '@prisma/client';
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
          where: { companyId, id: { in: productIds }, isActive: true },
          select: { id: true },
        }),
        this.prisma.supplierProduct.findMany({
          where: {
            supplierId: dto.supplierId,
            productId: { in: productIds },
            isActive: true,
          },
          select: { productId: true, supplierSku: true },
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

    const supplierSkus = new Map(
      catalog.map((item) => [item.productId, item.supplierSku]),
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
            supplierSku: supplierSkus.get(item.productId) || null,
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
      where: { companyId },
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

  async receive(id: number, companyId: number, userId: number) {
    const order = await this.prisma.$transaction(async (tx) => {
      const current = await tx.purchaseOrder.findFirst({
        where: { id, companyId },
        include: { items: true },
      });
      if (!current)
        throw I18nException.notFound('purchase_orders.errors.not_found');
      if (current.status !== PurchaseOrderStatus.PENDING)
        throw I18nException.badRequest('purchase_orders.errors.not_pending');

      for (const item of current.items) {
        const balance = await tx.inventoryBalance.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: current.warehouseId,
              productId: item.productId,
            },
          },
          create: {
            companyId,
            warehouseId: current.warehouseId,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: { quantity: { increment: item.quantity } },
          select: { quantity: true },
        });
        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: current.warehouseId,
            productId: item.productId,
            type: InventoryMovementType.PURCHASE_RECEIPT,
            quantity: item.quantity,
            unitCost: item.unitCost,
            balanceAfter: balance.quantity,
            purchaseOrderId: current.id,
            purchaseOrderItemId: item.id,
            createdByUserId: userId,
          },
        });
      }
      return tx.purchaseOrder.update({
        where: { id },
        data: {
          status: PurchaseOrderStatus.RECEIVED,
          receivedAt: new Date(),
          receivedByUserId: userId,
        },
        select: this.selectOrder(),
      });
    });
    await this.auditService.logUpdate(
      userId,
      companyId,
      'purchase-orders',
      'Recepción de orden de compra',
      id,
    );
    return {
      message: 'purchase_orders.success.received',
      data: this.serializeOrder(order),
    };
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
          supplierSku: true,
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
