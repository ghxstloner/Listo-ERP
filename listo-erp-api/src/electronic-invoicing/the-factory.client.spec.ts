import { ConfigService } from '@nestjs/config';
import { TheFactoryClient } from './the-factory.client';
import type { TheFactoryInvoicePayload } from './the-factory.types';

describe('TheFactoryClient', () => {
  const client = new TheFactoryClient(
    new ConfigService({ THEFACTORY_TIMEOUT_MS: '60000' }),
  );
  const credentials = {
    tokenEmpresa: 'token-company',
    tokenPassword: 'token-password',
  };
  const payload: TheFactoryInvoicePayload = {
    factura: {
      tipoDocumento: '01',
      consecutivoDocumento: 'DEMO1',
      fechaEmision: '2026-07-20 12:00:00',
      moneda: 'COP',
      cantidadDecimales: '2',
      rangoNumeracion: 'DEMO-1',
      cliente: {
        nombreRazonSocial: 'Consumidor Final',
        tipoPersona: '2',
        tipoIdentificacion: '13',
        numeroDocumento: '222222222222',
        notificar: 'NO' as const,
        responsabilidadesRut: [],
        detallesTributarios: [] as [],
      },
      detalleDeFactura: [],
      impuestosGenerales: [],
      impuestosTotales: [],
      mediosDePago: [{ metodoDePago: '1' as const, medioPago: '10' }],
      totalSinImpuestos: '0.00',
      totalBaseImponible: '0.00',
      totalBrutoConImpuesto: '0.00',
      totalMonto: '0.00',
      redondeoAplicado: '0.00' as const,
      totalProductos: '0',
      tipoOperacion: '10' as const,
      tipoSector: '1' as const,
    },
    documentosAdjuntos: '0' as const,
  };

  afterEach(() => jest.restoreAllMocks());

  it('sends the documented REST emission envelope', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('{"codigo":200}'),
    } as unknown as Response);

    await client.sendInvoice(
      'https://demoemision21-api.thefactoryhka.com.co',
      credentials,
      payload,
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://demoemision21-api.thefactoryhka.com.co/api/documentos/Enviar',
      expect.objectContaining({
        body: JSON.stringify({
          tokenEmpresa: 'token-company',
          tokenPassword: 'token-password',
          ...payload,
        }),
      }),
    );
  });

  it('classifies provider HTTP failures without exposing request data', async () => {
    jest
      .spyOn(global, 'fetch')
      .mockResolvedValue({ ok: false, status: 503 } as Response);

    await expect(
      client.sendInvoice('https://demo.example.test', credentials, payload),
    ).rejects.toMatchObject({
      kind: 'HTTP',
      retryable: true,
      statusCode: 503,
    });
  });

  it('classifies malformed provider responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('<html>unexpected</html>'),
    } as unknown as Response);

    await expect(
      client.sendInvoice('https://demo.example.test', credentials, payload),
    ).rejects.toMatchObject({ kind: 'INVALID_RESPONSE', retryable: true });
  });

  it('classifies network failures without including credentials', async () => {
    jest.spyOn(global, 'fetch').mockRejectedValue(new Error('socket failed'));

    await expect(
      client.sendInvoice('https://demo.example.test', credentials, payload),
    ).rejects.toMatchObject({ kind: 'NETWORK', retryable: true });
  });

  it('uses the exact documented HKA numbering request contract', async () => {
    const fetch = jest.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      text: jest.fn().mockResolvedValue('{"codigo":200,"numeraciones":[]}'),
    } as unknown as Response);

    await client.getNumberingRanges('DEMO', credentials, '155664092-1');

    expect(fetch).toHaveBeenCalledWith(
      'https://demogestioncontribuyentesrest.thefactoryhka.com.co/api/NumeracionFacturacion/ConsultarNumeraciones',
      expect.objectContaining({
        body: JSON.stringify({
          Nit: '155664092-1',
          TokenEmpresa: 'token-company',
          TokenClave: 'token-password',
          Plataforma: 'TFHKA',
        }),
      }),
    );
  });
});
