import { OrderStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';

describe('DashboardService', () => {
  const prisma = {
    $queryRaw: jest.fn(),
    saleItem: { aggregate: jest.fn() },
    sale: { aggregate: jest.fn() },
    customer: { count: jest.fn() },
    order: { count: jest.fn() },
  };
  const service = new DashboardService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('returns the four company-scoped dashboard metrics', async () => {
    prisma.saleItem.aggregate.mockResolvedValue({ _sum: { quantity: '7.5' } });
    prisma.sale.aggregate.mockResolvedValue({ _sum: { total: '125000.25' } });
    prisma.customer.count.mockResolvedValue(3);
    prisma.order.count.mockResolvedValue(4);

    await expect(service.getSummary(12)).resolves.toEqual({
      productsSoldToday: 7.5,
      salesToday: 125000.25,
      newCustomersThisMonth: 3,
      pendingInvoices: 4,
    });

    expect(prisma.saleItem.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          sale: expect.objectContaining({ companyId: 12 }),
        }),
      }),
    );
    expect(prisma.sale.aggregate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 12 }),
      }),
    );
    expect(prisma.customer.count).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ companyId: 12 }),
      }),
    );
    expect(prisma.order.count).toHaveBeenCalledWith({
      where: { companyId: 12, status: OrderStatus.PENDING },
    });
  });

  it('returns zero for empty aggregates', async () => {
    prisma.saleItem.aggregate.mockResolvedValue({ _sum: { quantity: null } });
    prisma.sale.aggregate.mockResolvedValue({ _sum: { total: null } });
    prisma.customer.count.mockResolvedValue(0);
    prisma.order.count.mockResolvedValue(0);

    await expect(service.getSummary(12)).resolves.toEqual({
      productsSoldToday: 0,
      salesToday: 0,
      newCustomersThisMonth: 0,
      pendingInvoices: 0,
    });
  });

  it('fills missing weekdays with zero sales', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { day: 1, sales: '100.50' },
      { day: 5, sales: '50' },
    ]);

    await expect(service.getWeeklySales(12)).resolves.toEqual([
      { day: 1, sales: 100.5 },
      { day: 2, sales: 0 },
      { day: 3, sales: 0 },
      { day: 4, sales: 0 },
      { day: 5, sales: 50 },
      { day: 6, sales: 0 },
      { day: 7, sales: 0 },
    ]);
  });

  it('calculates gross profit for each of the last twelve months', async () => {
    const now = new Date();
    const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    prisma.$queryRaw
      .mockResolvedValueOnce([
        { month: currentMonthKey, sales: '1500', subtotal: '1260' },
      ])
      .mockResolvedValueOnce([{ month: currentMonthKey, cost: '800' }]);

    const result = await service.getMonthlySalesProfit(12);
    const currentMonth = result.find((month) => month.month === currentMonthKey);

    expect(result).toHaveLength(12);
    expect(currentMonth).toEqual({
      month: currentMonthKey,
      sales: 1500,
      profit: 460,
    });
  });

  it('maps monthly sales grouped by payment method', async () => {
    prisma.$queryRaw.mockResolvedValue([
      { id: 1, name: 'Efectivo', code: 'CASH', sales: '250.75' },
      { id: 2, name: 'Tarjeta', code: 'CARD', sales: '100' },
    ]);

    await expect(service.getPaymentMethodSales(12)).resolves.toEqual([
      { id: 1, name: 'Efectivo', code: 'CASH', sales: 250.75 },
      { id: 2, name: 'Tarjeta', code: 'CARD', sales: 100 },
    ]);
  });
});
