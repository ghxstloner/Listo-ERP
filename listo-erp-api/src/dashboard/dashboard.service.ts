import { Injectable } from '@nestjs/common';
import { InventoryMovementType, OrderStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async getSummary(companyId: number) {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const todayWhere = { gte: todayStart, lt: tomorrowStart };

    const [productsSold, sales, newCustomers, pendingInvoices] =
      await Promise.all([
        this.prisma.saleItem.aggregate({
          _sum: { quantity: true },
          where: {
            sale: {
              companyId,
              createdAt: todayWhere,
            },
          },
        }),
        this.prisma.sale.aggregate({
          _sum: { total: true },
          where: { companyId, createdAt: todayWhere },
        }),
        this.prisma.customer.count({
          where: {
            companyId,
            createdAt: { gte: monthStart, lt: nextMonthStart },
          },
        }),
        this.prisma.order.count({
          where: { companyId, status: OrderStatus.PENDING },
        }),
      ]);

    return {
      productsSoldToday: Number(productsSold._sum.quantity ?? 0),
      salesToday: Number(sales._sum.total ?? 0),
      newCustomersThisMonth: newCustomers,
      pendingInvoices,
    };
  }

  async getTopProducts(companyId: number) {
    const { start, end } = this.getCurrentMonthRange();
    const rows = await this.prisma.$queryRaw<
      Array<{
        productId: number;
        sku: string;
        name: string;
        unitPrice: unknown;
        quantity: unknown;
        total: unknown;
      }>
    >(Prisma.sql`
      SELECT
        p."id" AS "productId",
        p."sku",
        p."name",
        COALESCE(
          SUM(si."unitPrice" * si."quantity") / NULLIF(SUM(si."quantity"), 0),
          0
        ) AS "unitPrice",
        COALESCE(SUM(si."quantity"), 0) AS "quantity",
        COALESCE(SUM(si."lineTotal"), 0) AS "total"
      FROM "SaleItem" si
      INNER JOIN "Sale" s ON s."id" = si."saleId"
      INNER JOIN "Product" p ON p."id" = si."productId"
      WHERE s."companyId" = ${companyId}
        AND s."createdAt" >= ${start}
        AND s."createdAt" < ${end}
      GROUP BY p."id", p."sku", p."name"
      ORDER BY "total" DESC, "quantity" DESC
      LIMIT 10
    `);

    return rows.map((row) => ({
      productId: row.productId,
      sku: row.sku,
      name: row.name,
      unitPrice: this.toNumber(row.unitPrice),
      quantity: this.toNumber(row.quantity),
      total: this.toNumber(row.total),
    }));
  }

  async getMonthlySalesProfit(companyId: number) {
    const { start, end } = this.getLastTwelveMonthsRange();
    const [salesRows, costRows] = await Promise.all([
      this.prisma.$queryRaw<Array<{ month: string; sales: unknown; subtotal: unknown }>>(
        Prisma.sql`
          SELECT
            TO_CHAR(DATE_TRUNC('month', s."createdAt"), 'YYYY-MM') AS "month",
            COALESCE(SUM(s."total"), 0) AS "sales",
            COALESCE(SUM(s."subtotal"), 0) AS "subtotal"
          FROM "Sale" s
          WHERE s."companyId" = ${companyId}
            AND s."createdAt" >= ${start}
            AND s."createdAt" < ${end}
          GROUP BY DATE_TRUNC('month', s."createdAt")
          ORDER BY DATE_TRUNC('month', s."createdAt")
        `,
      ),
      this.prisma.$queryRaw<Array<{ month: string; cost: unknown }>>(
        Prisma.sql`
          SELECT
            TO_CHAR(DATE_TRUNC('month', s."createdAt"), 'YYYY-MM') AS "month",
            COALESCE(SUM(ABS(im."quantity") * im."unitCost"), 0) AS "cost"
          FROM "InventoryMovement" im
          INNER JOIN "SaleItem" si ON si."id" = im."saleItemId"
          INNER JOIN "Sale" s ON s."id" = si."saleId"
          WHERE im."companyId" = ${companyId}
            AND im."type" = ${InventoryMovementType.SALE}
            AND s."createdAt" >= ${start}
            AND s."createdAt" < ${end}
          GROUP BY DATE_TRUNC('month', s."createdAt")
          ORDER BY DATE_TRUNC('month', s."createdAt")
        `,
      ),
    ]);

    const salesByMonth = new Map(
      salesRows.map((row) => [row.month, row]),
    );
    const costsByMonth = new Map(
      costRows.map((row) => [row.month, this.toNumber(row.cost)]),
    );

    return this.getMonthKeys(start, 12).map((month) => {
      const sales = salesByMonth.get(month);
      const subtotal = this.toNumber(sales?.subtotal);
      return {
        month,
        sales: this.toNumber(sales?.sales),
        profit: subtotal - (costsByMonth.get(month) ?? 0),
      };
    });
  }

  async getWeeklySales(companyId: number) {
    const { start, end } = this.getCurrentWeekRange();
    const rows = await this.prisma.$queryRaw<Array<{ day: number; sales: unknown }>>(
      Prisma.sql`
        SELECT
          EXTRACT(ISODOW FROM s."createdAt")::int AS "day",
          COALESCE(SUM(s."total"), 0) AS "sales"
        FROM "Sale" s
        WHERE s."companyId" = ${companyId}
          AND s."createdAt" >= ${start}
          AND s."createdAt" < ${end}
        GROUP BY EXTRACT(ISODOW FROM s."createdAt")
        ORDER BY "day"
      `,
    );
    const salesByDay = new Map(
      rows.map((row) => [row.day, this.toNumber(row.sales)]),
    );

    return Array.from({ length: 7 }, (_, index) => ({
      day: index + 1,
      sales: salesByDay.get(index + 1) ?? 0,
    }));
  }

  async getTopCustomers(companyId: number) {
    const { start, end } = this.getCurrentMonthRange();
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; sales: unknown }>
    >(Prisma.sql`
      SELECT
        c."id",
        c."name",
        COALESCE(SUM(s."total"), 0) AS "sales"
      FROM "Sale" s
      INNER JOIN "Customer" c ON c."id" = s."customerId"
      WHERE s."companyId" = ${companyId}
        AND s."createdAt" >= ${start}
        AND s."createdAt" < ${end}
      GROUP BY c."id", c."name"
      ORDER BY "sales" DESC
      LIMIT 5
    `);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sales: this.toNumber(row.sales),
    }));
  }

  async getTopSellers(companyId: number) {
    const { start, end } = this.getCurrentMonthRange();
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; sales: unknown }>
    >(Prisma.sql`
      SELECT
        se."id",
        se."name",
        COALESCE(SUM(s."total"), 0) AS "sales"
      FROM "Sale" s
      INNER JOIN "Seller" se ON se."id" = s."sellerId"
      WHERE s."companyId" = ${companyId}
        AND s."createdAt" >= ${start}
        AND s."createdAt" < ${end}
      GROUP BY se."id", se."name"
      ORDER BY "sales" DESC
      LIMIT 5
    `);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      sales: this.toNumber(row.sales),
    }));
  }

  async getTopDepartments(companyId: number) {
    const { start, end } = this.getCurrentMonthRange();
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; code: string; name: string; sales: unknown }>
    >(Prisma.sql`
      SELECT
        d."id",
        d."code",
        d."name",
        COALESCE(SUM(si."lineTotal"), 0) AS "sales"
      FROM "SaleItem" si
      INNER JOIN "Sale" s ON s."id" = si."saleId"
      INNER JOIN "Product" p ON p."id" = si."productId"
      INNER JOIN "Department" d ON d."id" = p."departmentId"
      WHERE s."companyId" = ${companyId}
        AND s."createdAt" >= ${start}
        AND s."createdAt" < ${end}
      GROUP BY d."id", d."code", d."name"
      ORDER BY "sales" DESC
      LIMIT 5
    `);

    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      sales: this.toNumber(row.sales),
    }));
  }

  async getPaymentMethodSales(companyId: number) {
    const { start, end } = this.getCurrentMonthRange();
    const rows = await this.prisma.$queryRaw<
      Array<{ id: number; name: string; code: string; sales: unknown }>
    >(Prisma.sql`
      SELECT
        pm."id",
        pm."name",
        pm."code",
        COALESCE(SUM(sp."amount"), 0) AS "sales"
      FROM "SalePayment" sp
      INNER JOIN "Sale" s ON s."id" = sp."saleId"
      INNER JOIN "PaymentMethod" pm ON pm."id" = sp."paymentMethodId"
      WHERE s."companyId" = ${companyId}
        AND s."createdAt" >= ${start}
        AND s."createdAt" < ${end}
      GROUP BY pm."id", pm."name", pm."code"
      ORDER BY "sales" DESC
    `);

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      code: row.code,
      sales: this.toNumber(row.sales),
    }));
  }

  private getCurrentMonthRange() {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth(), 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  private getLastTwelveMonthsRange() {
    const now = new Date();
    return {
      start: new Date(now.getFullYear(), now.getMonth() - 11, 1),
      end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
    };
  }

  private getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const daysFromMonday = day === 0 ? -6 : 1 - day;
    const start = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + daysFromMonday,
    );
    const end = new Date(start);
    end.setDate(end.getDate() + 7);
    return { start, end };
  }

  private getMonthKeys(start: Date, count: number) {
    return Array.from({ length: count }, (_, index) => {
      const month = new Date(start.getFullYear(), start.getMonth() + index, 1);
      return `${month.getFullYear()}-${String(month.getMonth() + 1).padStart(2, '0')}`;
    });
  }

  private toNumber(value: unknown) {
    const number = Number(value ?? 0);
    return Number.isFinite(number) ? number : 0;
  }
}
