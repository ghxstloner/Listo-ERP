import { Injectable } from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryTransferStatus,
  Prisma,
  ProductType,
  SeriesModule,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { SeriesService } from '../series/series.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';

@Injectable()
export class InventoryTransfersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private i18n: I18nService,
    private seriesService: SeriesService,
  ) {}

  async create(
    dto: CreateInventoryTransferDto,
    companyId: number,
    userId: number,
  ) {
    if (!dto.items || dto.items.length === 0) {
      throw I18nException.badRequest('common.errors.invalid_data');
    }

    if (
      new Set(dto.items.map((item) => item.productId)).size !== dto.items.length
    ) {
      throw I18nException.badRequest('common.errors.duplicate_product');
    }

    const [sourceWarehouse, destinationWarehouse, products] = await Promise.all(
      [
        this.prisma.warehouse.findFirst({
          where: { id: dto.sourceWarehouseId, companyId, isActive: true },
        }),
        this.prisma.warehouse.findFirst({
          where: { id: dto.destinationWarehouseId, companyId, isActive: true },
        }),
        this.prisma.product.findMany({
          where: {
            id: { in: dto.items.map((item) => item.productId) },
            companyId,
            isActive: true,
            productType: ProductType.PRODUCT,
          },
          select: { id: true, costPrice: true },
        }),
      ],
    );

    if (
      !sourceWarehouse ||
      !destinationWarehouse ||
      sourceWarehouse.id === destinationWarehouse.id
    ) {
      throw I18nException.badRequest('common.errors.invalid_location');
    }

    if (products.length !== dto.items.length) {
      throw I18nException.badRequest('inventory.errors.invalid_product');
    }

    const productMap = new Map(products.map((p) => [p.id, p.costPrice]));

    const activeSeries = await this.seriesService.findActiveByModule(
      companyId,
      SeriesModule.INVENTORY_TRANSFERS,
    );

    if (!activeSeries) {
      throw I18nException.badRequest(
        'inventory_transfers.errors.no_active_series',
      );
    }

    if (dto.controlStock !== false) {
      const balances = await this.prisma.inventoryBalance.findMany({
        where: {
          warehouseId: sourceWarehouse.id,
          productId: { in: dto.items.map((item) => item.productId) },
        },
        select: { productId: true, quantity: true },
      });

      const quantities = new Map(
        balances.map((balance) => [balance.productId, balance.quantity]),
      );

      if (
        dto.items.some(
          (item) =>
            !quantities
              .get(item.productId)
              ?.greaterThanOrEqualTo(item.quantity),
        )
      ) {
        throw I18nException.badRequest('common.errors.insufficient_stock');
      }
    }

    const transfer = await this.prisma.$transaction(async (tx) => {
      const { previousConsecutive, format } =
        await this.seriesService.consumeConsecutive(tx, activeSeries.id);
      const documentNumber = this.seriesService.formatNumber(
        format,
        previousConsecutive,
      );

      const now = new Date();

      const createdTransfer = await tx.inventoryTransfer.create({
        data: {
          companyId,
          sourceWarehouseId: sourceWarehouse.id,
          destinationWarehouseId: destinationWarehouse.id,
          status: InventoryTransferStatus.RECEIVED,
          seriesId: activeSeries.id,
          consecutive: previousConsecutive,
          documentNumber,
          createdByUserId: userId,
          controlStock: dto.controlStock ?? true,
          notes: dto.notes?.trim() || null,
          dispatchedAt: now,
          dispatchedByUserId: userId,
          receivedAt: now,
          receivedByUserId: userId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              quantity: new Prisma.Decimal(item.quantity),
            })),
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  sku: true,
                  name: true,
                  barcode: true,
                  reference: true,
                },
              },
            },
          },
          sourceWarehouse: { select: { name: true, code: true } },
          destinationWarehouse: { select: { name: true, code: true } },
          createdByUser: { select: { name: true } },
        },
      });

      for (const item of dto.items) {
        const itemQuantity = new Prisma.Decimal(item.quantity);
        const unitCost =
          productMap.get(item.productId) ?? new Prisma.Decimal(0);

        // Descontar o registrar saldo en almacén origen (upsert para soportar saldo negativo si controlStock = false)
        const updatedSourceBalance = await tx.inventoryBalance.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: sourceWarehouse.id,
              productId: item.productId,
            },
          },
          create: {
            companyId,
            warehouseId: sourceWarehouse.id,
            productId: item.productId,
            quantity: itemQuantity.negated(),
          },
          update: {
            quantity: { decrement: itemQuantity },
          },
          select: { quantity: true },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: sourceWarehouse.id,
            productId: item.productId,
            type: InventoryMovementType.TRANSFER_OUT,
            quantity: itemQuantity,
            unitCost,
            balanceAfter: updatedSourceBalance.quantity,
            createdByUserId: userId,
          },
        });

        const updatedDestBalance = await tx.inventoryBalance.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: destinationWarehouse.id,
              productId: item.productId,
            },
          },
          create: {
            companyId,
            warehouseId: destinationWarehouse.id,
            productId: item.productId,
            quantity: itemQuantity,
          },
          update: {
            quantity: { increment: itemQuantity },
          },
          select: { quantity: true },
        });

        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: destinationWarehouse.id,
            productId: item.productId,
            type: InventoryMovementType.TRANSFER_IN,
            quantity: itemQuantity,
            unitCost,
            balanceAfter: updatedDestBalance.quantity,
            createdByUserId: userId,
          },
        });
      }

      return createdTransfer;
    });

    await this.audit.logCreate(
      userId,
      companyId,
      'inventory-transfers',
      'Transferencia de inventario',
      transfer.id,
    );

    return this.withLocalizedStatus(transfer);
  }

  async findAll(companyId: number) {
    const transfers = await this.prisma.inventoryTransfer.findMany({
      where: { companyId },
      select: {
        id: true,
        sourceWarehouseId: true,
        destinationWarehouseId: true,
        status: true,
        documentNumber: true,
        consecutive: true,
        seriesId: true,
        controlStock: true,
        notes: true,
        createdAt: true,
        createdByUser: { select: { name: true } },
        sourceWarehouse: { select: { name: true, code: true } },
        destinationWarehouse: { select: { name: true, code: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return Promise.all(
      transfers.map((transfer) => this.withLocalizedStatus(transfer)),
    );
  }

  async findOne(id: number, companyId: number) {
    const transfer = await this.prisma.inventoryTransfer.findFirst({
      where: { id, companyId },
      include: {
        sourceWarehouse: { select: { name: true, code: true } },
        destinationWarehouse: { select: { name: true, code: true } },
        createdByUser: { select: { name: true } },
        items: {
          include: {
            product: {
              select: {
                sku: true,
                name: true,
                barcode: true,
                reference: true,
                image: true,
              },
            },
          },
        },
      },
    });

    if (!transfer)
      throw I18nException.notFound('common.errors.not_found', {
        entity: 'Transferencia',
      });

    return this.withLocalizedStatus(transfer);
  }

  private async withLocalizedStatus<
    T extends { status: InventoryTransferStatus },
  >(transfer: T) {
    const code = transfer.status;
    const lang = I18nContext.current()?.lang ?? 'es';
    return {
      ...transfer,
      status: {
        code,
        label: await this.i18n.translate<string>(
          `inventory_transfers.status.${code.toLowerCase()}`,
          { lang },
        ),
      },
    };
  }
}
