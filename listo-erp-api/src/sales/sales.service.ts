import { Injectable } from '@nestjs/common';
import {
  CashSessionStatus,
  InventoryMovementType,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { ElectronicInvoicingService } from '../electronic-invoicing/electronic-invoicing.service';
import { ElectronicInvoiceDispatcher } from '../electronic-invoicing/electronic-invoice-dispatcher.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSaleDto } from './dto/create-sale.dto';

const COLOMBIA_IDENTIFICATION_TYPES = new Set([
  '11',
  '12',
  '13',
  '21',
  '22',
  '31',
  '41',
  '42',
  '47',
  '48',
  '50',
  '91',
]);

@Injectable()
export class SalesService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private electronicInvoicing: ElectronicInvoicingService,
    private electronicInvoicingDispatcher: ElectronicInvoiceDispatcher,
  ) {}

  async create(dto: CreateSaleDto, companyId: number, userId: number) {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw I18nException.badRequest('sales.errors.duplicate_product');
    }

    const sale = await this.prisma.$transaction(async (tx) => {
      const [cashSession, customer, seller, paymentMethod, products, company] =
        await Promise.all([
          tx.cashSession.findFirst({
            where: {
              companyId,
              openedByUserId: userId,
              status: CashSessionStatus.OPEN,
              expiresAt: { gt: new Date() },
              deviceKey: dto.deviceKey,
            },
            select: { id: true, branchId: true, tillId: true },
            orderBy: { openedAt: 'desc' },
          }),
          tx.customer.findFirst({
            where: { id: dto.customerId, companyId, isActive: true },
            select: {
              id: true,
              isFinalConsumer: true,
              taxDocumentType: true,
              taxId: true,
              fiscalPersonType: true,
              taxCheckDigit: true,
            },
          }),
          tx.seller.findFirst({
            where: {
              id: dto.sellerId,
              companyId,
              isActive: true,
              sellerUsers: {
                some: { userId, companyId, user: { isActive: true } },
              },
            },
            select: { id: true },
          }),
          tx.paymentMethod.findFirst({
            where: { id: dto.paymentMethodId, companyId, isActive: true },
            select: { id: true, dianCode: true, requiresReference: true },
          }),
          tx.product.findMany({
            where: { id: { in: productIds }, companyId, isActive: true },
            select: {
              id: true,
              salePrice: true,
              taxRate: true,
              costPrice: true,
              dianCode: true,
            },
          }),
          tx.company.findUnique({
            where: { id: companyId },
            select: { country: { select: { code: true } } },
          }),
        ]);

      if (!cashSession)
        throw I18nException.badRequest('sales.errors.cash_session_required');
      if (!customer)
        throw I18nException.badRequest('sales.errors.customer_not_found');
      if (!seller)
        throw I18nException.badRequest('sales.errors.seller_not_found');
      if (!paymentMethod)
        throw I18nException.badRequest('sales.errors.payment_method_not_found');
      const tillPaymentMethod = await tx.tillPaymentMethod.findUnique({
        where: {
          tillId_paymentMethodId: {
            tillId: cashSession.tillId,
            paymentMethodId: paymentMethod.id,
          },
        },
        select: { tillId: true },
      });
      if (!tillPaymentMethod)
        throw I18nException.badRequest('sales.errors.payment_method_not_found');
      if (products.length !== productIds.length) {
        throw I18nException.badRequest('sales.errors.product_not_found');
      }
      const paymentReference = dto.paymentReference?.trim() || null;
      if (paymentMethod.requiresReference && !paymentReference) {
        throw I18nException.badRequest(
          'sales.errors.payment_reference_required',
        );
      }
      if (company?.country?.code === 'CO') {
        if (!paymentMethod.dianCode) {
          throw I18nException.badRequest(
            'sales.errors.payment_method_dian_code_required',
          );
        }
        if (products.some((product) => !product.dianCode)) {
          throw I18nException.badRequest(
            'sales.errors.product_dian_code_required',
          );
        }
        if (
          !customer.isFinalConsumer &&
          !this.hasColombiaFiscalData(customer)
        ) {
          throw I18nException.badRequest(
            'sales.errors.customer_fiscal_data_required',
          );
        }
      }

      const warehouseBranches = await tx.warehouseBranch.findMany({
        where: {
          branchId: cashSession.branchId,
          warehouse: { companyId, isActive: true },
        },
        select: { warehouseId: true },
        orderBy: { createdAt: 'asc' },
      });
      if (warehouseBranches.length === 0) {
        throw I18nException.badRequest('sales.errors.warehouse_not_found');
      }

      const productsById = new Map(
        products.map((product) => [product.id, product]),
      );
      const lineItems = dto.items.map((item) => {
        const product = productsById.get(item.productId)!;
        const quantity = new Prisma.Decimal(item.quantity);
        const taxRate = product.taxRate ?? new Prisma.Decimal(0);
        const effectiveTaxRate = taxRate.greaterThan(1)
          ? taxRate.dividedBy(100)
          : taxRate;
        const baseAmount = product.salePrice.mul(quantity);
        const taxAmount = baseAmount.mul(effectiveTaxRate);
        return {
          productId: item.productId,
          quantity,
          unitPrice: product.salePrice,
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

      const balances = await tx.inventoryBalance.findMany({
        where: {
          companyId,
          warehouseId: {
            in: warehouseBranches.map((item) => item.warehouseId),
          },
          productId: { in: productIds },
        },
        select: { warehouseId: true, productId: true, quantity: true },
      });
      const availableByProduct = new Map<number, Prisma.Decimal>();
      for (const balance of balances) {
        availableByProduct.set(
          balance.productId,
          (
            availableByProduct.get(balance.productId) ?? new Prisma.Decimal(0)
          ).plus(balance.quantity),
        );
      }
      if (
        lineItems.some((item) =>
          (
            availableByProduct.get(item.productId) ?? new Prisma.Decimal(0)
          ).lessThan(item.quantity),
        )
      ) {
        throw I18nException.badRequest('sales.errors.insufficient_stock');
      }

      const sale = await tx.sale.create({
        data: {
          companyId,
          branchId: cashSession.branchId,
          cashSessionId: cashSession.id,
          customerId: customer.id,
          sellerId: seller.id,
          paymentMethodId: paymentMethod.id,
          paymentReference,
          createdByUserId: userId,
          subtotal,
          taxAmount,
          total: subtotal.plus(taxAmount),
          items: {
            create: lineItems.map(({ unitCost: _, ...item }) => item),
          },
        },
        include: { items: true },
      });

      if (company?.country?.code === 'CO') {
        await this.electronicInvoicing.createPendingInvoice(
          tx,
          sale.id,
          companyId,
        );
      }

      const saleItemsByProduct = new Map(
        sale.items.map((item) => [item.productId, item]),
      );
      const balanceByWarehouseProduct = new Map(
        balances.map((balance) => [
          `${balance.warehouseId}:${balance.productId}`,
          balance.quantity,
        ]),
      );
      for (const item of lineItems) {
        let remaining = item.quantity;
        for (const { warehouseId } of warehouseBranches) {
          if (remaining.isZero()) break;
          const key = `${warehouseId}:${item.productId}`;
          const available =
            balanceByWarehouseProduct.get(key) ?? new Prisma.Decimal(0);
          if (available.isZero()) continue;
          const quantity = Prisma.Decimal.min(available, remaining);
          const updated = await tx.inventoryBalance.updateMany({
            where: {
              companyId,
              warehouseId,
              productId: item.productId,
              quantity: { gte: quantity },
            },
            data: { quantity: { decrement: quantity } },
          });
          if (updated.count !== 1)
            throw I18nException.badRequest('sales.errors.insufficient_stock');
          const balance = await tx.inventoryBalance.findUniqueOrThrow({
            where: {
              warehouseId_productId: { warehouseId, productId: item.productId },
            },
            select: { quantity: true },
          });
          await tx.inventoryMovement.create({
            data: {
              companyId,
              warehouseId,
              productId: item.productId,
              saleItemId: saleItemsByProduct.get(item.productId)!.id,
              type: InventoryMovementType.SALE,
              quantity: quantity.negated(),
              unitCost: item.unitCost,
              balanceAfter: balance.quantity,
              createdByUserId: userId,
            },
          });
          balanceByWarehouseProduct.set(key, available.minus(quantity));
          remaining = remaining.minus(quantity);
        }
      }

      return tx.sale.findUniqueOrThrow({
        where: { id: sale.id },
        select: this.selectSale(),
      });
    });

    await this.audit.logCreate(userId, companyId, 'sales', 'Venta', sale.id);
    const serializedSale = this.serializeSale(sale);
    if (sale.electronicInvoice) {
      try {
        await this.electronicInvoicingDispatcher.dispatchPendingInvoice(
          sale.electronicInvoice.id,
        );
      } catch {}
      const invoice = await this.electronicInvoicing.getInvoiceForSale(
        companyId,
        sale.id,
      );
      serializedSale.electronicInvoice = {
        id: invoice.id,
        status: invoice.status,
        consecutive: invoice.consecutive,
      };
    }
    return { message: 'sales.success.created', data: serializedSale };
  }

  private selectSale() {
    return {
      id: true,
      companyId: true,
      branchId: true,
      cashSessionId: true,
      customerId: true,
      sellerId: true,
      paymentMethodId: true,
      paymentReference: true,
      createdByUserId: true,
      subtotal: true,
      taxAmount: true,
      total: true,
      createdAt: true,
      updatedAt: true,
      customer: { select: { id: true, name: true, taxId: true } },
      seller: { select: { id: true, code: true, name: true } },
      paymentMethod: { select: { id: true, code: true, name: true } },
      electronicInvoice: {
        select: { id: true, status: true, consecutive: true },
      },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          unitPrice: true,
          taxRate: true,
          taxAmount: true,
          lineTotal: true,
          product: { select: { id: true, sku: true, name: true } },
        },
      },
    };
  }

  private serializeSale<
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
      }>;
    },
  >(sale: T) {
    return {
      ...sale,
      subtotal: Number(sale.subtotal),
      taxAmount: Number(sale.taxAmount),
      total: Number(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
      })),
    };
  }

  private hasColombiaFiscalData(customer: {
    taxDocumentType: string | null;
    taxId: string | null;
    fiscalPersonType: string | null;
    taxCheckDigit: string | null;
  }) {
    return Boolean(
      customer.taxDocumentType &&
      COLOMBIA_IDENTIFICATION_TYPES.has(customer.taxDocumentType) &&
      customer.taxId &&
      customer.fiscalPersonType &&
      (customer.taxDocumentType !== '31' || Boolean(customer.taxCheckDigit)),
    );
  }
}
