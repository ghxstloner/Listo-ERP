import { Injectable } from '@nestjs/common';
import {
  InventoryMovementType,
  Prisma,
  ProductType,
  PurchaseInvoiceStatus,
  PurchaseOrderStatus,
  SeriesModule,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { isUniqueConstraintError } from '../common/utils/prisma-errors';
import { PrismaService } from '../prisma/prisma.service';
import { SeriesService } from '../series/series.service';
import { CreatePurchaseInvoiceDto } from './dto/create-purchase-invoice.dto';
import {
  PurchaseInvoiceReceiptService,
  type PurchaseReceiptCurrency,
} from './purchase-invoice-receipt.service';

@Injectable()
export class PurchaseInvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly series: SeriesService,
    private readonly receipt: PurchaseInvoiceReceiptService,
  ) {}

  async create(
    dto: CreatePurchaseInvoiceDto,
    companyId: number,
    userId: number,
  ) {
    const productIds = dto.items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw I18nException.badRequest(
        'purchase_invoices.errors.duplicate_product',
      );
    }

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const [supplier, warehouse, products, series, company] =
          await Promise.all([
            tx.supplier.findFirst({
              where: { id: dto.supplierId, companyId, isActive: true },
              select: { id: true },
            }),
            tx.warehouse.findFirst({
              where: { id: dto.warehouseId, companyId, isActive: true },
              select: { id: true },
            }),
            tx.product.findMany({
          where: {
            companyId,
            id: { in: productIds },
            isActive: true,
            productType: ProductType.PRODUCT,
          },
              select: {
                id: true,
                sku: true,
                name: true,
                tax: true,
                isExempt: true,
              },
            }),
            tx.series.findFirst({
              where: {
                companyId,
                module: SeriesModule.PURCHASE_INVOICES,
                isActive: true,
              },
              select: { id: true },
            }),
            tx.company.findUnique({
              where: { id: companyId },
              select: { defaultCurrencyId: true },
            }),
          ]);

        if (!supplier) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.supplier_not_found',
          );
        }
        if (!warehouse) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.warehouse_not_found',
          );
        }
        if (products.length !== productIds.length) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.product_not_found',
          );
        }
        if (!series) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.series_required',
          );
        }
        if (!company?.defaultCurrencyId) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.default_currency_required',
          );
        }

        const purchaseOrder = dto.purchaseOrderId
          ? await tx.purchaseOrder.findFirst({
              where: { id: dto.purchaseOrderId, companyId },
              include: { items: true },
            })
          : null;
        if (dto.purchaseOrderId && !purchaseOrder) {
          throw I18nException.badRequest(
            'purchase_invoices.errors.purchase_order_not_found',
          );
        }
        if (purchaseOrder) {
          if (purchaseOrder.status !== PurchaseOrderStatus.PENDING) {
            throw I18nException.badRequest(
              'purchase_invoices.errors.purchase_order_not_pending',
            );
          }
          if (
            purchaseOrder.supplierId !== dto.supplierId ||
            purchaseOrder.warehouseId !== dto.warehouseId
          ) {
            throw I18nException.badRequest(
              'purchase_invoices.errors.purchase_order_changed',
            );
          }
          const orderQuantities = new Map(
            purchaseOrder.items.map((item) => [item.productId, item.quantity]),
          );
          if (
            purchaseOrder.items.length !== dto.items.length ||
            dto.items.some(
              (item) =>
                !orderQuantities.has(item.productId) ||
                !orderQuantities.get(item.productId)?.equals(item.quantity),
            )
          ) {
            throw I18nException.badRequest(
              'purchase_invoices.errors.purchase_order_items_changed',
            );
          }
        }

        const productsById = new Map(
          products.map((product) => [product.id, product]),
        );
        const lines = dto.items.map((item) => {
          const product = productsById.get(item.productId);
          if (!product) {
            throw I18nException.badRequest(
              'purchase_invoices.errors.product_not_found',
            );
          }
          const quantity = new Prisma.Decimal(item.quantity);
          const unitCost = new Prisma.Decimal(item.unitCost);
          const taxRate = product.isExempt
            ? new Prisma.Decimal(0)
            : new Prisma.Decimal(item.taxRate ?? (product.tax?.rate) ?? 0);
          const subtotal = quantity.mul(unitCost);
          const taxAmount = subtotal.mul(taxRate).toDecimalPlaces(4);
          return {
            productId: product.id,
            quantity,
            unitCost,
            taxRate,
            taxAmount,
            lineTotal: subtotal.plus(taxAmount).toDecimalPlaces(4),
          };
        });
        const subtotal = lines
          .reduce(
            (sum, line) => sum.plus(line.quantity.mul(line.unitCost)),
            new Prisma.Decimal(0),
          )
          .toDecimalPlaces(4);
        const taxAmount = lines
          .reduce(
            (sum, line) => sum.plus(line.taxAmount),
            new Prisma.Decimal(0),
          )
          .toDecimalPlaces(4);
        const total = subtotal.plus(taxAmount).toDecimalPlaces(4);

        const numbering = await this.series.consumeConsecutive(tx, series.id);
        const documentNumber = this.series.formatNumber(
          numbering.format,
          numbering.previousConsecutive,
        );
        const invoice = await tx.purchaseInvoice.create({
          data: {
            companyId,
            supplierId: dto.supplierId,
            warehouseId: dto.warehouseId,
            purchaseOrderId: dto.purchaseOrderId ?? null,
            seriesId: series.id,
            consecutive: numbering.previousConsecutive,
            documentNumber,
            supplierInvoiceNumber: documentNumber,
            issueDate: new Date(dto.issueDate),
            status: PurchaseInvoiceStatus.POSTED,
            subtotal,
            taxAmount,
            total,
            createdByUserId: userId,
            items: { create: lines },
          },
          select: this.selectInvoice(),
        });

        for (const item of invoice.items) {
          const balance = await tx.inventoryBalance.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: dto.warehouseId,
                productId: item.productId,
              },
            },
            create: {
              companyId,
              warehouseId: dto.warehouseId,
              productId: item.productId,
              quantity: item.quantity,
            },
            update: { quantity: { increment: item.quantity } },
            select: { quantity: true },
          });
          await tx.inventoryMovement.create({
            data: {
              companyId,
              warehouseId: dto.warehouseId,
              productId: item.productId,
              type: InventoryMovementType.PURCHASE_INVOICE,
              quantity: item.quantity,
              unitCost: item.unitCost,
              balanceAfter: balance.quantity,
              purchaseInvoiceId: invoice.id,
              purchaseInvoiceItemId: item.id,
              createdByUserId: userId,
            },
          });
          await tx.product.update({
            where: { id: item.productId },
            data: { costPrice: item.unitCost },
          });
        }

        if (purchaseOrder) {
          await tx.purchaseOrder.update({
            where: { id: purchaseOrder.id },
            data: {
              status: PurchaseOrderStatus.RECEIVED,
              receivedAt: new Date(),
              receivedByUserId: userId,
            },
          });
        }

        return invoice;
      });
      await this.audit.logCreate(
        userId,
        companyId,
        'purchase-invoices',
        'Factura de proveedor',
        result.id,
      );
      return {
        message: 'purchase_invoices.success.created',
        data: this.serializeInvoice(result),
      };
    } catch (error) {
      if (isUniqueConstraintError(error)) {
        throw I18nException.badRequest(
          'purchase_invoices.errors.supplier_invoice_exists',
        );
      }
      throw error;
    }
  }

  async findAll(companyId: number) {
    const invoices = await this.prisma.purchaseInvoice.findMany({
      where: { companyId },
      select: this.selectInvoice(),
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
    });
    return invoices.map((invoice) => this.serializeInvoice(invoice));
  }

  async findOne(id: number, companyId: number) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, companyId },
      select: this.selectInvoice(),
    });
    if (!invoice) {
      throw I18nException.notFound('purchase_invoices.errors.not_found');
    }
    return this.serializeInvoice(invoice);
  }

  async downloadReceipt(id: number, companyId: number) {
    const invoice = await this.prisma.purchaseInvoice.findFirst({
      where: { id, companyId, status: PurchaseInvoiceStatus.POSTED },
      select: {
        documentNumber: true,
        supplierInvoiceNumber: true,
        issueDate: true,
        subtotal: true,
        taxAmount: true,
        total: true,
        supplier: { select: { name: true, taxId: true } },
        items: {
          select: {
            quantity: true,
            unitCost: true,
            taxRate: true,
            taxAmount: true,
            lineTotal: true,
            product: { select: { sku: true, name: true } },
          },
        },
        company: {
          select: {
            defaultCurrency: {
              select: {
                code: true,
                symbol: true,
                companySettings: {
                  where: { companyId },
                  select: {
                    symbol: true,
                    decimalPlaces: true,
                    decimalSeparator: true,
                    thousandsSeparator: true,
                    format: true,
                  },
                },
              },
            },
          },
        },
      },
    });
    if (!invoice) {
      throw I18nException.badRequest(
        'purchase_invoices.errors.receipt_not_available',
      );
    }

    const settings = invoice.company.defaultCurrency?.companySettings[0];
    const currency: PurchaseReceiptCurrency = {
      code: invoice.company.defaultCurrency?.code ?? 'USD',
      symbol:
        settings?.symbol ?? invoice.company.defaultCurrency?.symbol ?? '$',
      decimalPlaces: settings?.decimalPlaces ?? 2,
      decimalSeparator: settings?.decimalSeparator ?? '.',
      thousandsSeparator: settings?.thousandsSeparator ?? ',',
      format: settings?.format ?? 'symbol_before',
    };
    const content = await this.receipt.create(
      {
        documentNumber: invoice.documentNumber,
        supplierInvoiceNumber: invoice.supplierInvoiceNumber,
        issueDate: invoice.issueDate,
        supplier: invoice.supplier,
        items: invoice.items.map((item) => ({
          ...item,
          quantity: Number(item.quantity),
          unitCost: Number(item.unitCost),
          taxRate: Number(item.taxRate),
          taxAmount: Number(item.taxAmount),
          lineTotal: Number(item.lineTotal),
        })),
        subtotal: Number(invoice.subtotal),
        taxAmount: Number(invoice.taxAmount),
        total: Number(invoice.total),
      },
      currency,
    );
    return {
      content,
      contentType: 'application/pdf',
      filename: `${invoice.documentNumber}-recibo.pdf`,
    };
  }

  async findProductInvoices(
    companyId: number,
    productId: number,
    filters: {
      warehouseId?: number;
      supplierId?: number;
      dateFrom?: string;
      dateTo?: string;
    },
  ) {
    const where: Prisma.PurchaseInvoiceWhereInput = {
      companyId,
      status: PurchaseInvoiceStatus.POSTED,
      items: { some: { productId } },
    };
    if (filters.warehouseId != null) where.warehouseId = filters.warehouseId;
    if (filters.supplierId != null) where.supplierId = filters.supplierId;
    if (filters.dateFrom || filters.dateTo) {
      where.issueDate = {};
      if (filters.dateFrom) where.issueDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) {
        const endDate = new Date(filters.dateTo);
        endDate.setHours(23, 59, 59, 999);
        where.issueDate.lte = endDate;
      }
    }

    const invoices = await this.prisma.purchaseInvoice.findMany({
      where,
      orderBy: [{ issueDate: 'desc' }, { id: 'desc' }],
      select: {
        id: true,
        documentNumber: true,
        supplierInvoiceNumber: true,
        status: true,
        issueDate: true,
        createdAt: true,
        supplier: { select: { id: true, name: true, taxId: true } },
        warehouse: { select: { id: true, name: true, code: true } },
        items: {
          where: { productId },
          select: {
            id: true,
            productId: true,
            quantity: true,
            unitCost: true,
            taxAmount: true,
            lineTotal: true,
          },
        },
      },
    });

    return invoices.flatMap((invoice) =>
      invoice.items.map((item) => ({
        id: invoice.id,
        itemId: item.id,
        documentNumber: invoice.documentNumber,
        supplierInvoiceNumber: invoice.supplierInvoiceNumber,
        status: invoice.status,
        createdAt: invoice.createdAt,
        issueDate: invoice.issueDate,
        supplier: invoice.supplier,
        warehouse: invoice.warehouse,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        taxAmount: Number(item.taxAmount),
        total: Number(item.lineTotal),
      })),
    );
  }

  private selectInvoice() {
    return {
      id: true,
      companyId: true,
      supplierId: true,
      warehouseId: true,
      purchaseOrderId: true,
      seriesId: true,
      consecutive: true,
      documentNumber: true,
      supplierInvoiceNumber: true,
      issueDate: true,
      status: true,
      subtotal: true,
      taxAmount: true,
      total: true,
      createdByUserId: true,
      postedAt: true,
      cancelledAt: true,
      createdAt: true,
      updatedAt: true,
      supplier: { select: { id: true, name: true, taxId: true } },
      warehouse: { select: { id: true, name: true, code: true } },
      items: {
        select: {
          id: true,
          productId: true,
          quantity: true,
          unitCost: true,
          taxRate: true,
          taxAmount: true,
          lineTotal: true,
          product: { select: { id: true, sku: true, name: true, unit: true } },
        },
      },
    };
  }

  private serializeInvoice<
    T extends {
      subtotal: Prisma.Decimal;
      taxAmount: Prisma.Decimal;
      total: Prisma.Decimal;
      items: Array<{
        quantity: Prisma.Decimal;
        unitCost: Prisma.Decimal;
        taxRate: Prisma.Decimal;
        taxAmount: Prisma.Decimal;
        lineTotal: Prisma.Decimal;
      }>;
    },
  >(invoice: T) {
    return {
      ...invoice,
      subtotal: Number(invoice.subtotal),
      taxAmount: Number(invoice.taxAmount),
      total: Number(invoice.total),
      items: invoice.items.map((item) => ({
        ...item,
        quantity: Number(item.quantity),
        unitCost: Number(item.unitCost),
        taxRate: Number(item.taxRate),
        taxAmount: Number(item.taxAmount),
        lineTotal: Number(item.lineTotal),
      })),
    };
  }
}
