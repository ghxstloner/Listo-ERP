import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InventoryService {
  constructor(private prisma: PrismaService) {}

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
        branch: { select: { id: true, name: true, branchCode: true } },
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
    return (await this.prisma.branchInventoryBalance.findMany({
      where: { companyId, branchId },
      select: {
        id: true, branchId: true, productId: true, quantity: true, updatedAt: true,
        product: { select: { id: true, sku: true, name: true, unit: true } },
      },
      orderBy: { product: { name: 'asc' } },
    })).map((balance) => ({ ...balance, quantity: Number(balance.quantity) }));
  }
}
