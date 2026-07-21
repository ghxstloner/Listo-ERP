import { ConfigService } from '@nestjs/config';
import { ElectronicInvoicingEnvironment } from '@prisma/client';
import { CredentialsService } from './credentials.service';
import { ElectronicInvoicingService } from './electronic-invoicing.service';

describe('ElectronicInvoicingService', () => {
  const key =
    '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';
  const prisma = {
    company: { findUnique: jest.fn() },
    electronicInvoicingConfiguration: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
  };
  const audit = { logCreate: jest.fn(), logUpdate: jest.fn() };
  const credentials = new CredentialsService(
    new ConfigService({ ELECTRONIC_INVOICING_ENCRYPTION_KEY: key }),
  );
  const payloadFactory = { create: jest.fn() };
  const theFactory = {
    downloadPdf: jest.fn(),
    downloadXml: jest.fn(),
    getNumberingRanges: jest.fn(),
  };
  const receiptPdf = { create: jest.fn() };
  const service = new ElectronicInvoicingService(
    prisma as never,
    audit as never,
    credentials,
    payloadFactory as never,
    theFactory as never,
    receiptPdf as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.company.findUnique.mockResolvedValue({
      taxDocumentNumber: '900123456',
    });
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 200,
      numeraciones: [
        {
          idNumeracion: 'range-id',
          prefijo: 'DEMO',
          numeroDesde: '1',
          numeroHasta: '1000',
          activo: '1',
          tipoAmbienteSecuencial: '3',
          tipoServicio: '2',
          modalidad: '2',
        },
      ],
    });
  });

  it('stores encrypted credentials and never returns them', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    prisma.electronicInvoicingConfiguration.upsert.mockImplementation(
      ({ create }) =>
        Promise.resolve({
          ...create,
          id: 1,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
    );

    const result = await service.updateColombiaConfiguration(1, 2, {
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
      rangoNumeracion: 'DEMO-1',
      nextConsecutive: 1,
    });

    const create =
      prisma.electronicInvoicingConfiguration.upsert.mock.calls[0][0].create;
    expect(create.credentialsCiphertext).not.toContain('company-token');
    expect(create.credentialsCiphertext).not.toContain('password-token');
    expect(result.data).toMatchObject({
      countryCode: 'CO',
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      hasCredentials: true,
    });
    expect(result.data).not.toHaveProperty('credentialsCiphertext');
    expect(result.data).not.toHaveProperty('tokenEmpresa');
    expect(audit.logCreate).toHaveBeenCalled();
  });

  it('requires both credentials together', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);

    await expect(
      service.updateColombiaConfiguration(1, 2, {
        tokenEmpresa: 'company-token',
      }),
    ).rejects.toMatchObject({
      response: {
        key: 'electronic_invoicing.errors.credentials_pair_required',
      },
    });
  });

  it('rejects a consecutive before the configured range start', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);

    await expect(
      service.updateColombiaConfiguration(1, 2, {
        environment: ElectronicInvoicingEnvironment.DEMO,
        providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
        tokenEmpresa: 'company-token',
        tokenPassword: 'password-token',
        rangoNumeracion: 'DEMO-100',
        nextConsecutive: 99,
      }),
    ).rejects.toMatchObject({
      response: { key: 'electronic_invoicing.errors.invalid_numbering' },
    });
  });

  it('rejects a numbering range configured for the HKA portal', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 200,
      numeraciones: [
        {
          idNumeracion: 'portal-range',
          prefijo: 'DEMO',
          numeroDesde: '1',
          numeroHasta: '1000',
          activo: '1',
          tipoAmbienteSecuencial: '3',
          tipoServicio: '1',
          modalidad: '1',
        },
      ],
    });

    await expect(
      service.updateColombiaConfiguration(1, 2, {
        environment: ElectronicInvoicingEnvironment.DEMO,
        providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
        tokenEmpresa: 'company-token',
        tokenPassword: 'password-token',
        rangoNumeracion: 'DEMO-1',
        nextConsecutive: 1,
      }),
    ).rejects.toMatchObject({
      response: {
        key: 'electronic_invoicing.errors.integration_numbering_required',
      },
    });
  });

  it('accepts a Produccion 2.1 integration sequential in the HKA demo portal', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 200,
      numeraciones: [
        {
          idNumeracion: 'demo-production-range',
          prefijo: 'DEMO',
          numeroDesde: '1',
          numeroHasta: '1000000',
          activo: '1',
          tipoAmbienteSecuencial: '2',
          tipoServicio: '2',
          modalidad: '2',
        },
      ],
    });
    prisma.electronicInvoicingConfiguration.upsert.mockImplementation(
      ({ create }) =>
        Promise.resolve({
          ...create,
          id: 1,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
    );

    const result = await service.updateColombiaConfiguration(1, 2, {
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
      rangoNumeracion: 'DEMO-1',
      nextConsecutive: 1,
    });

    expect(result.data.providerNumberingId).toBe('demo-production-range');
  });

  it('accepts the textual values returned by the HKA portal', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 200,
      numeraciones: [
        {
          idNumeracion: 'text-range',
          prefijo: 'demo',
          numeroDesde: '1',
          numeroHasta: '1000000',
          activo: 'Activo',
          tipoAmbienteSecuencial: 'Producción 2.1',
          tipoServicio: 'Servicio de Integración 2.1',
          modalidad: 'Manual Con Prefijo',
        },
      ],
    });
    prisma.electronicInvoicingConfiguration.upsert.mockImplementation(
      ({ create }) =>
        Promise.resolve({
          ...create,
          id: 1,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
    );

    const result = await service.updateColombiaConfiguration(1, 2, {
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
      rangoNumeracion: 'DEMO-1',
      nextConsecutive: 1,
    });

    expect(result.data.providerNumberingId).toBe('text-range');
  });

  it('normalizes spaces in the company NIT before querying HKA', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    prisma.company.findUnique.mockResolvedValue({
      taxDocumentNumber: '155664092 - 1',
    });
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 200,
      numeraciones: [
        {
          idNumeracion: 'range-id',
          prefijo: 'DEMO',
          numeroDesde: '1',
          numeroHasta: '1000000',
          activo: '1',
          tipoAmbienteSecuencial: '2',
          tipoServicio: '2',
          modalidad: '2',
        },
      ],
    });
    prisma.electronicInvoicingConfiguration.upsert.mockImplementation(
      ({ create }) =>
        Promise.resolve({
          ...create,
          id: 1,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
    );

    await service.updateColombiaConfiguration(1, 2, {
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
      rangoNumeracion: 'DEMO-1',
      nextConsecutive: 5,
    });

    expect(theFactory.getNumberingRanges).toHaveBeenCalledWith(
      ElectronicInvoicingEnvironment.DEMO,
      expect.any(Object),
      '155664092-1',
    );
  });

  it('returns the provider reason when HKA rejects the numbering lookup', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    theFactory.getNumberingRanges.mockResolvedValue({
      codigo: 401,
      mensaje: 'Token inválido',
      resultado: 'Error',
    });

    await expect(
      service.updateColombiaConfiguration(1, 2, {
        environment: ElectronicInvoicingEnvironment.DEMO,
        providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
        tokenEmpresa: 'company-token',
        tokenPassword: 'password-token',
        rangoNumeracion: 'DEMO-1',
        nextConsecutive: 5,
      }),
    ).rejects.toMatchObject({
      response: {
        key: 'electronic_invoicing.errors.provider_numbering_request_failed',
        args: { code: 401, reason: 'Token inválido' },
      },
    });
  });

  it('accepts the PascalCase response returned by legacy HKA services', async () => {
    prisma.electronicInvoicingConfiguration.findUnique.mockResolvedValue(null);
    theFactory.getNumberingRanges.mockResolvedValue({
      Codigo: 200,
      Resultado: 'Exitoso',
      Numeraciones: [
        {
          IdNumeracion: 'pascal-range',
          Prefijo: 'DEMO',
          NumeroDesde: '1',
          NumeroHasta: '1000000',
          Activo: '1',
          TipoAmbienteSecuencial: 'Producción 2.1',
          TipoServicio: 'Servicio de Integración 2.1',
          Modalidad: 'Manual Con Prefijo',
        },
      ],
    });
    prisma.electronicInvoicingConfiguration.upsert.mockImplementation(
      ({ create }) =>
        Promise.resolve({
          ...create,
          id: 1,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          updatedAt: new Date('2026-07-20T00:00:00.000Z'),
        }),
    );

    const result = await service.updateColombiaConfiguration(1, 2, {
      environment: ElectronicInvoicingEnvironment.DEMO,
      providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
      tokenEmpresa: 'company-token',
      tokenPassword: 'password-token',
      rangoNumeracion: 'DEMO-1',
      nextConsecutive: 5,
    });

    expect(result.data.providerNumberingId).toBe('pascal-range');
  });

  it('reserves a consecutive and creates a pending invoice in the sale transaction', async () => {
    const payload = { factura: { consecutivoDocumento: 'DEMO5' } };
    payloadFactory.create.mockReturnValue(payload);
    const tx = {
      electronicInvoicingConfiguration: {
        findUnique: jest.fn().mockResolvedValue({
          id: 7,
          providerBaseUrl: 'https://demoemision21-api.thefactoryhka.com.co',
          providerNumberingId: 'range-id',
          numberingRange: 'DEMO-1',
          numberingMode: 'WITH_PREFIX',
        }),
        update: jest.fn().mockResolvedValue({
          id: 7,
          numberingRange: 'DEMO-1',
          nextConsecutive: 6,
        }),
      },
      sale: {
        findUniqueOrThrow: jest.fn().mockResolvedValue({
          paymentReference: null,
          createdAt: new Date('2026-07-20T00:00:00.000Z'),
          customer: { isFinalConsumer: true, name: 'Consumidor Final' },
          paymentMethod: { dianCode: '10' },
          items: [
            {
              quantity: {},
              unitPrice: {},
              taxRate: {},
              taxAmount: {},
              lineTotal: {},
              product: { sku: 'SKU-1', name: 'Producto', dianCode: 'UND' },
            },
          ],
        }),
      },
      electronicInvoice: {
        create: jest.fn().mockResolvedValue({
          id: 9,
          status: 'PENDING',
          consecutive: 'DEMO5',
        }),
      },
    };

    await service.createPendingInvoice(tx as never, 20, 1);

    expect(tx.electronicInvoicingConfiguration.update).toHaveBeenCalledWith(
      expect.objectContaining({ data: { nextConsecutive: { increment: 1 } } }),
    );
    expect(payloadFactory.create).toHaveBeenCalledWith(
      expect.objectContaining({ numberingRange: 'DEMO-1' }),
    );
    expect(tx.electronicInvoice.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          saleId: 20,
          configurationId: 7,
          consecutive: 'DEMO5',
          requestPayload: payload,
        }),
      }),
    );
  });
});
