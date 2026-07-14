import { Injectable } from '@nestjs/common';
import { InventoryMovementType, Prisma } from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInventoryEntryDto } from './dto/create-inventory-entry.dto';

@Injectable()
export class InventoryService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  async createEntry(
    dto: CreateInventoryEntryDto,
    companyId: number,
    userId: number,
  ) {
    if (
      new Set(dto.items.map((item) => item.productId)).size !== dto.items.length
    )
      throw I18nException.badRequest('inventory.errors.duplicate_product');
    if (
      dto.items.some(
        (item) =>
          !Number.isFinite(item.quantity) ||
          item.quantity === 0 ||
          (dto.type === 'ENTRY' && item.quantity < 0),
      )
    )
      throw I18nException.badRequest('inventory.errors.invalid_quantity');

    const [warehouse, products] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: dto.warehouseId, companyId, isActive: true },
        select: { id: true },
      }),
      this.prisma.product.findMany({
        where: {
          id: { in: dto.items.map((item) => item.productId) },
          companyId,
          isActive: true,
        },
        select: { id: true },
      }),
    ]);
    if (!warehouse)
      throw I18nException.badRequest('inventory.errors.invalid_warehouse');
    if (products.length !== dto.items.length)
      throw I18nException.badRequest('inventory.errors.invalid_product');

    const movementType =
      dto.type === 'ENTRY'
        ? InventoryMovementType.MANUAL_ENTRY
        : InventoryMovementType.INVENTORY_ADJUSTMENT;
    await this.prisma.$transaction(async (tx) => {
      for (const item of dto.items) {
        const quantity = new Prisma.Decimal(item.quantity);
        let balanceAfter: Prisma.Decimal;

        if (quantity.isNegative()) {
          const updated = await tx.inventoryBalance.updateMany({
            where: {
              companyId,
              warehouseId: warehouse.id,
              productId: item.productId,
              quantity: { gte: quantity.abs() },
            },
            data: { quantity: { decrement: quantity.abs() } },
          });
          if (updated.count === 0)
            throw I18nException.badRequest('inventory.errors.insufficient_stock');
          const balance = await tx.inventoryBalance.findUniqueOrThrow({
            where: {
              warehouseId_productId: {
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
            select: { quantity: true },
          });
          balanceAfter = balance.quantity;
        } else {
          const balance = await tx.inventoryBalance.upsert({
            where: {
              warehouseId_productId: {
                warehouseId: warehouse.id,
                productId: item.productId,
              },
            },
            create: {
              companyId,
              warehouseId: warehouse.id,
              productId: item.productId,
              quantity,
            },
            update: { quantity: { increment: quantity } },
            select: { quantity: true },
          });
          balanceAfter = balance.quantity;
        }

        await tx.inventoryMovement.create({
          data: {
            companyId,
            warehouseId: warehouse.id,
            productId: item.productId,
            type: movementType,
            quantity,
            unitCost: new Prisma.Decimal(0),
            balanceAfter,
            createdByUserId: userId,
          },
        });
      }
    });

    await this.audit.logCreate(
      userId,
      companyId,
      'inventory',
      dto.type === 'ENTRY'
        ? 'Ingreso manual de inventario'
        : 'Ajuste de inventario',
      warehouse.id,
    );
    return { message: 'inventory.success.entry_created' };
  }

  async findBalances(companyId: number, warehouseId?: number) {
    const balances = await this.prisma.inventoryBalance.findMany({
      where: { companyId, ...(warehouseId != null && { warehouseId }) },
      select: {
        id: true,
        warehouseId: true,
        productId: true,
        quantity: true,
        updatedAt: true,
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });
    return balances.map((balance) => ({
      ...balance,
      quantity: Number(balance.quantity),
    }));
  }

  async findMovements(
    companyId: number,
    warehouseId?: number,
    productId?: number,
  ) {
    const where: Prisma.InventoryMovementWhereInput = { companyId };
    if (warehouseId != null) where.warehouseId = warehouseId;
    if (productId != null) where.productId = productId;
    const movements = await this.prisma.inventoryMovement.findMany({
      where,
      select: {
        id: true,
        warehouseId: true,
        productId: true,
        type: true,
        quantity: true,
        unitCost: true,
        balanceAfter: true,
        purchaseOrderId: true,
        createdByUserId: true,
        createdAt: true,
        warehouse: { select: { id: true, name: true, code: true } },
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return movements.map((movement) => ({
      ...movement,
      quantity: Number(movement.quantity),
      unitCost: Number(movement.unitCost),
      balanceAfter: Number(movement.balanceAfter),
    }));
  }

  async findBranchBalances(companyId: number, branchId: number) {
    const assignments = await this.prisma.warehouseBranch.findMany({
      where: { branchId, branch: { companyId } },
      select: {
        warehouseId: true,
      },
    });
    const warehouseIds = assignments.map(({ warehouseId }) => warehouseId);
    if (warehouseIds.length === 0) return [];

    const balances = await this.prisma.inventoryBalance.findMany({
      where: { companyId, warehouseId: { in: warehouseIds } },
      select: {
        productId: true,
        quantity: true,
        updatedAt: true,
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
      orderBy: { product: { name: 'asc' } },
    });
    const grouped = new Map<
      number,
      {
        product: (typeof balances)[number]['product'];
        quantity: Prisma.Decimal;
        updatedAt: Date;
      }
    >();
    for (const balance of balances) {
      const current = grouped.get(balance.productId);
      if (current) {
        current.quantity = current.quantity.plus(balance.quantity);
        if (balance.updatedAt > current.updatedAt)
          current.updatedAt = balance.updatedAt;
      } else {
        grouped.set(balance.productId, {
          product: balance.product,
          quantity: balance.quantity,
          updatedAt: balance.updatedAt,
        });
      }
    }
    return [...grouped.values()].map((balance) => ({
      ...balance,
      quantity: Number(balance.quantity),
    }));
  }
}
