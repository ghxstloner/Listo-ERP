import { CashSessionStatus, Prisma } from '@prisma/client';
import { CashSessionsService } from './cash-sessions.service';

describe('CashSessionsService', () => {
  const prisma = {
    cashSession: {
      updateMany: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
  };
  const auditService = { log: jest.fn() };
  const service = new CashSessionsService(
    prisma as never,
    auditService as never,
  );

  beforeEach(() => jest.clearAllMocks());

  it('marks elapsed open sessions as expired before returning the current session', async () => {
    prisma.cashSession.updateMany.mockResolvedValue({ count: 1 });
    prisma.cashSession.findFirst.mockResolvedValue({
      id: 5,
      status: CashSessionStatus.EXPIRED,
    });

    const session = await service.findCurrent(1, 2);

    expect(prisma.cashSession.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: CashSessionStatus.OPEN,
          expiresAt: { lte: expect.any(Date) },
        }),
        data: { status: CashSessionStatus.EXPIRED },
      }),
    );
    expect(session).toEqual({ id: 5, status: CashSessionStatus.EXPIRED });
  });

  it('closes an expired session after its cash count is declared', async () => {
    const openingAmount = new Prisma.Decimal(100);
    prisma.cashSession.findFirst.mockResolvedValue({
      id: 5,
      status: CashSessionStatus.EXPIRED,
      openingAmount,
      till: { tillCode: 'POS-01' },
    });
    prisma.cashSession.update.mockResolvedValue({
      id: 5,
      status: CashSessionStatus.CLOSED,
    });

    await service.close(5, { declaredClosingAmount: 120 }, 1, 2);

    expect(prisma.cashSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: CashSessionStatus.CLOSED,
          differenceAmount: new Prisma.Decimal(20),
        }),
      }),
    );
    expect(auditService.log).toHaveBeenCalled();
  });
});
