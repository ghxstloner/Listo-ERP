import { Prisma } from '@prisma/client';
import { InvoicePayloadFactory } from './invoice-payload.factory';

describe('InvoicePayloadFactory', () => {
  const factory = new InvoicePayloadFactory();

  it('builds a token-free Colombia cash invoice payload', () => {
    const payload = factory.create({
      consecutive: 'DEMO1',
      numberingRange: 'DEMO-1',
      numberingMode: 'WITH_PREFIX',
      issuedAt: new Date('2026-07-20T12:34:56.000Z'),
      paymentReference: 'TX-42',
      customer: {
        name: 'Cliente de prueba',
        isFinalConsumer: false,
        taxDocumentType: '31',
        taxId: '900123456',
        taxCheckDigit: '7',
        fiscalPersonType: '1',
      },
      paymentMethod: { dianCode: '10' },
      items: [
        {
          sku: 'SKU-1',
          name: 'Producto de prueba',
          dianCode: '94',
          quantity: new Prisma.Decimal('2'),
          unitPrice: new Prisma.Decimal('10000'),
          taxRate: new Prisma.Decimal('0.19'),
          taxAmount: new Prisma.Decimal('3800'),
          lineTotal: new Prisma.Decimal('23800'),
        },
      ],
    });

    expect(payload).toEqual(
      expect.objectContaining({
        documentosAdjuntos: '0',
        factura: expect.objectContaining({
          tipoDocumento: '01',
          consecutivoDocumento: 'DEMO1',
          fechaEmision: '2026-07-20 07:34:56',
          rangoNumeracion: 'DEMO-1',
          moneda: 'COP',
          totalMonto: '23800.00',
          mediosDePago: [
            expect.objectContaining({
              metodoDePago: '1',
              medioPago: '10',
              numeroDeReferencia: 'TX-42',
            }),
          ],
        }),
      }),
    );
    expect(JSON.stringify(payload)).not.toContain('tokenEmpresa');
    expect(payload.factura.cliente).toMatchObject({
      responsabilidadesRut: [{ obligaciones: 'R-99-PN' }],
      detallesTributarios: [{ codigoImpuesto: 'ZZ' }],
    });
    expect(payload.factura.cliente).not.toHaveProperty('direccionFiscal');
    expect(payload.factura.cliente).not.toHaveProperty(
      'informacionLegalCliente',
    );
    expect(payload.factura.detalleDeFactura[0]).toMatchObject({
      unidadMedida: '94',
      cantidadReal: '1',
      cantidadRealUnidadMedida: '94',
      precioTotalSinImpuestos: '20000.00',
      impuestosDetalles: [
        expect.objectContaining({
          porcentajeTOTALImp: '19.00',
          unidadMedida: '94',
        }),
      ],
      impuestosTotales: [{ codigoTOTALImp: '01', montoTotal: '3800.00' }],
    });
    expect(payload.factura.impuestosGenerales).toEqual([
      expect.objectContaining({
        codigoTOTALImp: '01',
        unidadMedida: '94',
        valorTOTALImp: '3800.00',
      }),
    ]);
    expect(payload.factura.impuestosTotales).toEqual([
      { codigoTOTALImp: '01', montoTotal: '3800.00' },
    ]);
  });

  it('derives header totals from rounded serialized lines', () => {
    const payload = factory.create({
      consecutive: 'DEMO2',
      numberingRange: 'DEMO-1',
      numberingMode: 'WITH_PREFIX',
      issuedAt: new Date('2026-07-20T12:34:56.000Z'),
      paymentReference: null,
      customer: {
        name: 'Consumidor Final',
        isFinalConsumer: true,
        taxDocumentType: null,
        taxId: null,
        taxCheckDigit: null,
        fiscalPersonType: null,
      },
      paymentMethod: { dianCode: '10' },
      items: [
        {
          sku: 'TAXED',
          name: 'Producto gravado',
          dianCode: '94',
          quantity: new Prisma.Decimal('1'),
          unitPrice: new Prisma.Decimal('10.005'),
          taxRate: new Prisma.Decimal('0.19'),
          taxAmount: new Prisma.Decimal('1.90095'),
          lineTotal: new Prisma.Decimal('11.90595'),
        },
        {
          sku: 'EXEMPT',
          name: 'Producto excluido',
          dianCode: '94',
          quantity: new Prisma.Decimal('1'),
          unitPrice: new Prisma.Decimal('1.005'),
          taxRate: new Prisma.Decimal('0'),
          taxAmount: new Prisma.Decimal('0'),
          lineTotal: new Prisma.Decimal('1.005'),
        },
      ],
    });

    expect(payload.factura).toMatchObject({
      totalSinImpuestos: '11.02',
      totalBaseImponible: '10.01',
      totalBrutoConImpuesto: '12.92',
      totalMonto: '12.92',
      impuestosTotales: [{ codigoTOTALImp: '01', montoTotal: '1.90' }],
    });
    expect(
      payload.factura.detalleDeFactura.map((item) => item.precioTotal),
    ).toEqual(['11.91', '1.01']);
  });
});
