import { Injectable } from '@nestjs/common';
import {
  InventoryMovementType,
  OrderStatus,
  Prisma,
  SeriesModule,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { SeriesService } from '../series/series.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private seriesService: SeriesService,
  ) {}

  async create(dto: CreateOrderDto, companyId: number, userId: number) {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw I18nException.badRequest('orders.errors.duplicate_product');
    }

    const order = await this.prisma.$transaction(async (tx) => {
      const [customer, branch, seller, products] = await Promise.all([
        tx.customer.findFirst({
          where: { id: dto.customerId, companyId, isActive: true },
          select: { id: true },
        }),
        dto.branchId
          ? tx.branch.findFirst({
              where: { id: dto.branchId, companyId, isActive: true },
              select: { id: true },
            })
          : Promise.resolve(null),
        dto.sellerId
          ? tx.seller.findFirst({
              where: { id: dto.sellerId, companyId, isActive: true },
              select: { id: true },
            })
          : Promise.resolve(null),
        tx.product.findMany({
          where: { id: { in: productIds }, companyId, isActive: true },
          select: {
            id: true,
            taxRate: true,
            costPrice: true,
            isExempt: true,
            prices: {
              where: {
                id: { in: dto.items.map((item) => item.productPriceId) },
                isActive: true,
              },
              select: { id: true, amount: true },
            },
          },
        }),
      ]);

      if (!customer)
        throw I18nException.badRequest('orders.errors.customer_not_found');
      if (dto.branchId && !branch)
        throw I18nException.badRequest('orders.errors.branch_not_found');
      if (dto.sellerId && !seller)
        throw I18nException.badRequest('orders.errors.seller_not_found');
      if (products.length !== productIds.length) {
        throw I18nException.badRequest('orders.errors.product_not_found');
      }

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const lineItems = dto.items.map((item) => {
        const product = productsById.get(item.productId);
        const productPrice = product.prices.find(
          (price) => price.id === item.productPriceId,
        );
        if (!productPrice) {
          throw I18nException.badRequest(
            'orders.errors.product_price_not_found',
          );
        }
        const quantity = new Prisma.Decimal(item.quantity);
        const taxRate = product.isExempt
          ? new Prisma.Decimal(0)
          : (product.taxRate ?? new Prisma.Decimal(0));
        const effectiveTaxRate = taxRate.greaterThan(1)
          ? taxRate.dividedBy(100)
          : taxRate;
        const baseAmount = productPrice.amount.mul(quantity);
        const taxAmount = baseAmount.mul(effectiveTaxRate);
        return {
          productId: item.productId,
          productPriceId: productPrice.id,
          quantity,
          unitPrice: productPrice.amount,
          taxRate,
          taxAmount,
          lineTotal: baseAmount.plus(taxAmount),
          unitCost: product.costPrice ?? new Prisma.Decimal(0),
        };
      });
      const subtotal = lineItems.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const taxAmount = lineItems.reduce(
        (sum, item) => sum.plus(item.taxAmount),
        new Prisma.Decimal(0),
      );
      const total = subtotal.plus(taxAmount);

      const activeSeries = await this.seriesService.findActiveByModule(
        companyId,
        SeriesModule.ORDERS,
      );
      if (!activeSeries) {
        throw I18nException.badRequest('orders.errors.no_active_series');
      }
      const { previousConsecutive, format } =
        await this.seriesService.consumeConsecutive(tx, activeSeries.id);
      const orderNumber = this.seriesService.formatNumber(
        format,
        previousConsecutive,
      );

      const order = await tx.order.create({
        data: {
          company: { connect: { id: companyId } },
          customer: { connect: { id: customer.id } },
          branch: branch ? { connect: { id: branch.id } } : undefined,
          seller: seller ? { connect: { id: seller.id } } : undefined,
          createdByUser: { connect: { id: userId } },
          series: { connect: { id: activeSeries.id } },
          notes: dto.notes,
          orderNumber,
          subtotal,
          taxAmount,
          total,
          items: {
            create: lineItems.map(({ unitCost: _, ...item }) => item),
          },
        },
        include: {
          items: true,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: order.id },
        select: this.selectOrder(),
      });
    });

    await this.audit.logCreate(userId, companyId, 'orders', 'Pedido', order.id);
    const serializedOrder = this.serializeOrder(order);
    return { message: 'orders.success.created', data: serializedOrder };
  }

  async findAll(
    companyId: number,
    filters: {
      status?: string;
      customerId?: number;
      branchIds?: number[];
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: Prisma.OrderWhereInput = { companyId };

    if (filters.status && filters.status !== 'all') {
      where.status = filters.status as OrderStatus;
    }

    if (filters.customerId) {
      where.customerId = filters.customerId;
    }

    if (filters.branchIds?.length) {
      where.branchId = { in: filters.branchIds };
    }

    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) {
        where.createdAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        total: true,
        customer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        items: {
          select: {
            id: true,
            quantity: true,
            productPriceId: true,
            unitPrice: true,
            product: { select: { id: true, name: true, sku: true } },
            productPrice: { select: { id: true, name: true, amount: true } },
          },
        },
      },
    });

    return orders.map((order) => ({
      ...order,
      total: Number(order.total),
      itemsCount: order.items.length,
      items: order.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        productPrice: item.productPrice
          ? { ...item.productPrice, amount: Number(item.productPrice.amount) }
          : null,
      })),
    }));
  }

  async findOne(id: number, companyId: number) {
    const order = await this.prisma.order.findFirst({
      where: { id, companyId },
      select: this.selectOrder(),
    });

    if (!order) {
      throw I18nException.notFound('orders.errors.order_not_found');
    }

    return this.serializeOrder(order);
  }

  async findProductOrders(
    companyId: number,
    productId: number,
    filters: {
      branchId?: number;
      status?: OrderStatus;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: Prisma.OrderWhereInput = {
      companyId,
      items: { some: { productId } },
    };
    if (filters.branchId != null) where.branchId = filters.branchId;
    if (filters.status && filters.status !== ('all' as OrderStatus)) {
      where.status = filters.status;
    }
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = endDate;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        orderNumber: true,
        status: true,
        createdAt: true,
        customer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
        branch: { select: { id: true, name: true } },
        items: {
          where: { productId },
          select: {
            id: true,
            quantity: true,
            unitPrice: true,
            lineTotal: true,
          },
        },
      },
    });

    return orders.flatMap((order) =>
      order.items.map((item) => ({
        id: order.id,
        itemId: item.id,
        orderNumber: order.orderNumber,
        status: order.status,
        createdAt: order.createdAt,
        customer: order.customer,
        seller: order.seller,
        branch: order.branch,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        total: Number(item.lineTotal),
      })),
    );
  }

  async update(
    id: number,
    dto: UpdateOrderDto,
    companyId: number,
    userId: number,
  ) {
    const order = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.order.findFirst({
        where: { id, companyId },
        include: { items: true },
      });

      if (!existing) {
        throw I18nException.notFound('orders.errors.order_not_found');
      }

      if (existing.status !== OrderStatus.PENDING) {
        throw I18nException.badRequest('orders.errors.order_not_editable');
      }

      if (dto.branchId) {
        const branch = await tx.branch.findFirst({
          where: { id: dto.branchId, companyId, isActive: true },
          select: { id: true },
        });
        if (!branch)
          throw I18nException.badRequest('orders.errors.branch_not_found');
      }

      if (dto.sellerId) {
        const seller = await tx.seller.findFirst({
          where: { id: dto.sellerId, companyId, isActive: true },
          select: { id: true },
        });
        if (!seller)
          throw I18nException.badRequest('orders.errors.seller_not_found');
      }

      const oldItemsByProduct = new Map(
        existing.items.map((item) => [item.productId, item]),
      );
      const newItemsMap = new Map(
        (dto.items ?? []).map((item) => [item.productId, item]),
      );

      const productsToRemove = existing.items.filter(
        (item) => !newItemsMap.has(item.productId),
      );
      const productsToAddOrUpdate = dto.items ?? [];

      const productIds = productsToAddOrUpdate.map((item) => item.productId);
      if (new Set(productIds).size !== productIds.length) {
        throw I18nException.badRequest('orders.errors.duplicate_product');
      }
      const products = await tx.product.findMany({
        where: { id: { in: productIds }, companyId, isActive: true },
        select: {
          id: true,
          taxRate: true,
          costPrice: true,
          isExempt: true,
          prices: {
            where: {
              id: {
                in: productsToAddOrUpdate.map((item) => item.productPriceId),
              },
              isActive: true,
            },
            select: { id: true, amount: true },
          },
        },
      });
      if (products.length !== productIds.length) {
        throw I18nException.badRequest('orders.errors.product_not_found');
      }
      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );

      const newLineItems = productsToAddOrUpdate.map((item) => {
        const product = productsById.get(item.productId);
        const productPrice = product.prices.find(
          (price) => price.id === item.productPriceId,
        );
        if (!productPrice) {
          throw I18nException.badRequest(
            'orders.errors.product_price_not_found',
          );
        }
        const quantity = new Prisma.Decimal(item.quantity);
        const taxRate = product.isExempt
          ? new Prisma.Decimal(0)
          : (product.taxRate ?? new Prisma.Decimal(0));
        const effectiveTaxRate = taxRate.greaterThan(1)
          ? taxRate.dividedBy(100)
          : taxRate;
        const baseAmount = productPrice.amount.mul(quantity);
        const taxAmount = baseAmount.mul(effectiveTaxRate);
        return {
          productId: item.productId,
          productPriceId: productPrice.id,
          quantity,
          unitPrice: productPrice.amount,
          taxRate,
          taxAmount,
          lineTotal: baseAmount.plus(taxAmount),
          unitCost: product.costPrice ?? new Prisma.Decimal(0),
        };
      });

      const subtotal = newLineItems.reduce(
        (sum, item) => sum.plus(item.unitPrice.mul(item.quantity)),
        new Prisma.Decimal(0),
      );
      const taxAmount = newLineItems.reduce(
        (sum, item) => sum.plus(item.taxAmount),
        new Prisma.Decimal(0),
      );
      const total = subtotal.plus(taxAmount);

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      const updatedOrder = await tx.order.update({
        where: { id },
        data: {
          customerId: dto.customerId ?? existing.customerId,
          branchId:
            dto.branchId !== undefined ? dto.branchId : existing.branchId,
          sellerId:
            dto.sellerId !== undefined ? dto.sellerId : existing.sellerId,
          notes: dto.notes !== undefined ? dto.notes : existing.notes,
          subtotal,
          taxAmount,
          total,
          items: {
            create: newLineItems.map(({ unitCost: _, ...item }) => item),
          },
        },
        include: { items: true },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: updatedOrder.id },
        select: this.selectOrder(),
      });
    });

    await this.audit.logUpdate(userId, companyId, 'orders', 'Pedido', id);
    return {
      message: 'orders.success.updated',
      data: this.serializeOrder(order),
    };
  }

  async cancel(id: number, companyId: number, userId: number) {
    await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findFirst({
        where: { id, companyId },
        include: { items: true },
      });

      if (!order) {
        throw I18nException.notFound('orders.errors.order_not_found');
      }

      if (order.status === OrderStatus.CANCELLED) {
        throw I18nException.badRequest('orders.errors.order_already_cancelled');
      }

      if (order.status === OrderStatus.PAID) {
        throw I18nException.badRequest('orders.errors.order_already_paid');
      }

      await tx.order.update({
        where: { id },
        data: { status: OrderStatus.CANCELLED },
      });
    });

    await this.audit.logUpdate(userId, companyId, 'orders', 'Pedido', id);
    return { message: 'orders.success.cancelled' };
  }

  private selectOrder() {
    return {
      id: true,
      companyId: true,
      branchId: true,
      customerId: true,
      sellerId: true,
      createdByUserId: true,
      status: true,
      notes: true,
      saleId: true,
      orderNumber: true,
      seriesId: true,
      subtotal: true,
      taxAmount: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true, taxId: true } },
      seller: { select: { id: true, code: true, name: true } },
      branch: { select: { id: true, name: true } },
      items: {
        select: {
          id: true,
          productId: true,
          productPriceId: true,
          quantity: true,
          unitPrice: true,
          taxRate: true,
          taxAmount: true,
          lineTotal: true,
          product: { select: { id: true, sku: true, name: true } },
          productPrice: { select: { id: true, name: true, amount: true } },
        },
      },
    };
  }

  private serializeOrder<
    T extends {
      subtotal: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      total: Prisma.Decimal;
      items: Array<{
        quantity: Prisma.Decimal;
        unitPrice: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
        productPrice?: { amount: Prisma.Decimal } | null;
      }>;
    },
  >(order: T) {
    return {
      ...order,
      subtotal: Number(order.subtotal),
      taxAmount: Number(order.taxAmount),
      total: Number(order.total),
      items: order.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
        productPrice: item.productPrice
          ? {
              ...item.productPrice,
              amount: Number(item.productPrice.amount),
            }
          : null,
      })),
    };
  }
}
