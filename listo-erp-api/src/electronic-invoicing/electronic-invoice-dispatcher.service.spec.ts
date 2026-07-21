import { ElectronicInvoiceStatus } from '@prisma/client';

import { ElectronicInvoiceDispatcher } from './electronic-invoice-dispatcher.service';
import { TheFactoryClientError } from './the-factory.types';

describe('ElectronicInvoiceDispatcher', () => {
  const prisma = {
    electronicInvoice: {
      updateMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      update: jest.fn(),
    },
    electronicInvoiceAttempt: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  const credentials = { decrypt: jest.fn() };
  const theFactory = {
    sendInvoice: jest.fn(),
    getDocumentStatus: jest.fn(),
  };
  const dispatcher = new ElectronicInvoiceDispatcher(
    prisma as never,
    credentials as never,
    theFactory as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.electronicInvoice.updateMany.mockResolvedValue({ count: 1 });
    prisma.electronicInvoice.findUniqueOrThrow.mockResolvedValue({
      id: 1,
      consecutive: 'DEMO1',
      requestPayload: { factura: { tipoDocumento: '01' } },
      configuration: {
        providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
        credentialsCiphertext: 'ciphertext',
        credentialsNonce: 'nonce',
        credentialsAuthTag: 'tag',
      },
    });
    credentials.decrypt.mockReturnValue({
      tokenEmpresa: 'secret-company-token',
      tokenPassword: 'secret-password-token',
    });
    prisma.$transaction.mockResolvedValue([]);
  });

  it('accepts a valid DIAN response and records a token-free attempt', async () => {
    theFactory.sendInvoice.mockResolvedValue({
      codigo: 200,
      esValidoDian: true,
      cufe: 'CUFE-1',
      qr: 'qr-value',
      fechaAceptacionDIAN: '2026-07-20T12:00:00Z',
    });
    prisma.electronicInvoiceAttempt.create.mockReturnValue({
      query: 'attempt',
    });
    prisma.electronicInvoice.update.mockReturnValue({ query: 'invoice' });

    const result = await dispatcher.dispatchPendingInvoice(1);

    expect(result.status).toBe(ElectronicInvoiceStatus.ACCEPTED);
    expect(prisma.electronicInvoice.updateMany).toHaveBeenCalledWith({
      where: { id: 1, status: ElectronicInvoiceStatus.PENDING },
      data: { status: ElectronicInvoiceStatus.PROCESSING },
    });
    expect(prisma.electronicInvoiceAttempt.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestPayload: { factura: { tipoDocumento: '01' } },
        }),
      }),
    );
    expect(
      JSON.stringify(prisma.electronicInvoiceAttempt.create.mock.calls[0]),
    ).not.toContain('secret-company-token');
  });

  it('returns a retryable transport failure to pending', async () => {
    theFactory.sendInvoice.mockRejectedValue(
      new TheFactoryClientError(
        'TheFactory request timed out after 60000ms',
        true,
        'TIMEOUT',
      ),
    );
    prisma.electronicInvoiceAttempt.create.mockReturnValue({
      query: 'attempt',
    });
    prisma.electronicInvoice.update.mockReturnValue({ query: 'invoice' });

    await expect(dispatcher.dispatchPendingInvoice(1)).rejects.toThrow(
      'TheFactory request timed out after 60000ms',
    );
    expect(prisma.electronicInvoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: ElectronicInvoiceStatus.PENDING,
        }),
      }),
    );
  });

  it('uses document status instead of resending a previous attempt', async () => {
    prisma.electronicInvoice.findUniqueOrThrow.mockResolvedValueOnce({
      ...(await prisma.electronicInvoice.findUniqueOrThrow()),
      retryCount: 1,
    });
    theFactory.getDocumentStatus.mockResolvedValue({
      codigo: 200,
      esValidoDIAN: true,
      cufe: 'CUFE-1',
      fechaAceptacionDIAN: '2026-07-20T12:00:00Z',
    });
    prisma.electronicInvoiceAttempt.create.mockReturnValue({
      query: 'attempt',
    });
    prisma.electronicInvoice.update.mockReturnValue({ query: 'invoice' });

    const result = await dispatcher.dispatchPendingInvoice(1);

    expect(result.status).toBe(ElectronicInvoiceStatus.ACCEPTED);
    expect(theFactory.sendInvoice).not.toHaveBeenCalled();
    expect(theFactory.getDocumentStatus).toHaveBeenCalledWith(
      'https://demoemision21-api.thefactoryhka.com.co',
      expect.any(Object),
      'DEMO1',
    );
  });

  it('accepts a timed-out submission when the subsequent status check confirms DIAN acceptance', async () => {
    theFactory.sendInvoice.mockRejectedValue(
      new TheFactoryClientError(
        'TheFactory request timed out after 60000ms',
        true,
        'TIMEOUT',
      ),
    );
    theFactory.getDocumentStatus.mockResolvedValue({
      codigo: 200,
      esValidoDIAN: true,
      cufe: 'CUFE-1',
      fechaAceptacionDIAN: '2026-07-20T12:00:00Z',
    });
    prisma.electronicInvoiceAttempt.create.mockReturnValue({
      query: 'attempt',
    });
    prisma.electronicInvoice.update.mockReturnValue({ query: 'invoice' });

    const result = await dispatcher.dispatchPendingInvoice(1);

    expect(result.status).toBe(ElectronicInvoiceStatus.ACCEPTED);
  });
});
