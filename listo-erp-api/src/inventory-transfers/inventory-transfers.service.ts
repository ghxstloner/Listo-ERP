import { Injectable } from '@nestjs/common';
import {
  InventoryMovementType,
  InventoryTransferStatus,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { I18nContext, I18nService } from 'nestjs-i18n';
import { CreateInventoryTransferDto } from './dto/create-inventory-transfer.dto';
@Injectable()
export class InventoryTransfersService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
    private i18n: I18nService,
  ) {}
  async create(
    dto: CreateInventoryTransferDto,
    companyId: number,
    userId: number,
  ) {
    if (
      new Set(dto.items.map((item) => item.productId)).size !== dto.items.length
    )
      throw I18nException.badRequest('common.errors.duplicate_product');
    const [sourceWarehouse, destinationWarehouse] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.sourceWarehouseId, companyId, isActive: true },
      }),
      this.prisma.warehouse.findFirst({
        where: { id: dto.destinationWarehouseId, companyId, isActive: true },
      }),
    ]);
    if (
      !sourceWarehouse ||
      !destinationWarehouse ||
      sourceWarehouse.id === destinationWarehouse.id
    )
      throw I18nException.badRequest('common.errors.invalid_location');
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
          !quantities.get(item.productId)?.greaterThanOrEqualTo(item.quantity),
      )
    )
      throw I18nException.badRequest('common.errors.insufficient_stock');
    const transfer = await this.prisma.inventoryTransfer.create({
      data: {
        companyId,
        sourceWarehouseId: sourceWarehouse.id,
        destinationWarehouseId: destinationWarehouse.id,
        notes: dto.notes?.trim() || null,
        items: {
          create: dto.items.map((item) => ({
            productId: item.productId,
            quantity: new Prisma.Decimal(item.quantity),
          })),
        },
      },
      include: {
        items: { include: { product: { select: { sku: true, name: true } } } },
        sourceWarehouse: true,
        destinationWarehouse: true,
      },
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
      include: {
        sourceWarehouse: { select: { name: true, code: true } },
        destinationWarehouse: { select: { name: true, code: true } },
        items: { include: { product: { select: { sku: true, name: true } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return Promise.all(
      transfers.map((transfer) => this.withLocalizedStatus(transfer)),
    );
  }
  async dispatch(id: number, companyId: number, userId: number) {
    const transfer = await this.prisma.$transaction(async (tx) => {
      const current = await tx.inventoryTransfer.findFirst({
        where: { id, companyId },
        include: { items: true },
      });
      if (!current || current.status !== InventoryTransferStatus.PENDING)
        throw I18nException.badRequest('common.errors.invalid_status');
      for (const item of current.items) {
        const balance = await tx.inventoryBalance.findUnique({
          where: {
            warehouseId_productId: {
              warehouseId: current.sourceWarehouseId,
              productId: item.productId,
            },
          },
        });
        if (!balance || balance.quantity.lessThan(item.quantity))
          throw I18nException.badRequest('common.errors.insufficient_stock');
        const updated = await tx.inventoryBalance.update({
          where: { id: balance.id },
          data: { quantity: { decrement: item.quantity } },
          select: { quantity: true },
        });
        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: current.sourceWarehouseId,
            productId: item.productId,
            type: InventoryMovementType.TRANSFER_OUT,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(0),
            balanceAfter: updated.quantity,
            createdByUserId: userId,
          },
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: {
          status: InventoryTransferStatus.IN_TRANSIT,
          dispatchedAt: new Date(),
          dispatchedByUserId: userId,
        },
      });
    });
    await this.audit.logUpdate(
      userId,
      companyId,
      'inventory-transfers',
      'Despacho de transferencia',
      id,
    );
    return this.withLocalizedStatus(transfer);
  }
  async receive(id: number, companyId: number, userId: number) {
    const transfer = await this.prisma.$transaction(async (tx) => {
      const current = await tx.inventoryTransfer.findFirst({
        where: { id, companyId },
        include: { items: true },
      });
      if (!current || current.status !== InventoryTransferStatus.IN_TRANSIT)
        throw I18nException.badRequest('common.errors.invalid_status');
      for (const item of current.items) {
        const balance = await tx.inventoryBalance.upsert({
          where: {
            warehouseId_productId: {
              warehouseId: current.destinationWarehouseId,
              productId: item.productId,
            },
          },
          create: {
            companyId,
            warehouseId: current.destinationWarehouseId,
            productId: item.productId,
            quantity: item.quantity,
          },
          update: { quantity: { increment: item.quantity } },
          select: { quantity: true },
        });
        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: current.destinationWarehouseId,
            productId: item.productId,
            type: InventoryMovementType.TRANSFER_IN,
            quantity: item.quantity,
            unitCost: new Prisma.Decimal(0),
            balanceAfter: balance.quantity,
            createdByUserId: userId,
          },
        });
      }
      return tx.inventoryTransfer.update({
        where: { id },
        data: {
          status: InventoryTransferStatus.RECEIVED,
          receivedAt: new Date(),
          receivedByUserId: userId,
        },
      });
    });
    await this.audit.logUpdate(
      userId,
      companyId,
      'inventory-transfers',
      'Recepción de transferencia',
      id,
    );
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
