import { ReceiptPdfService } from './receipt-pdf.service';

describe('ReceiptPdfService', () => {
  it('creates a thermal PDF with the invoice data and QR content', async () => {
    const service = new ReceiptPdfService();

    const pdf = await service.create({
      cufe: 'cufe-test',
      qr: 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=cufe-test',
      currency: {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        format: 'symbol_before',
      },
      payload: {
        factura: {
          consecutivoDocumento: 'FE1',
          fechaEmision: '2026-07-21 10:00:00',
          cliente: { nombreRazonSocial: 'Cliente de prueba' },
          detalleDeFactura: [
            {
              cantidadUnidades: '2.00',
              descripcion: 'Producto de prueba',
              precioTotal: '23800.00',
            },
          ],
          impuestosTotales: [{ codigoTOTALImp: '01', montoTotal: '3800.00' }],
          totalSinImpuestos: '20000.00',
          totalMonto: '23800.00',
        },
      } as never,
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(500);
  });

  it('renders multiple taxes with custom names and percentages from impuestosGenerales', async () => {
    const service = new ReceiptPdfService();

    const pdf = await service.create({
      cufe: 'cufe-test-multi-tax',
      qr: 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=cufe-test',
      currency: {
        code: 'COP',
        symbol: '$',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        format: 'symbol_before',
      },
      payload: {
        factura: {
          consecutivoDocumento: 'FE102',
          fechaEmision: '2026-08-20 14:00:00',
          cliente: { nombreRazonSocial: 'Empresa Test SAS' },
          detalleDeFactura: [
            {
              cantidadUnidades: '1.00',
              descripcion: 'Servicio con IVA',
              precioTotal: '11900.00',
            },
            {
              cantidadUnidades: '1.00',
              descripcion: 'Consumo Restaurante',
              precioTotal: '10800.00',
            },
          ],
          impuestosGenerales: [
            {
              codigoTOTALImp: '01',
              porcentajeTOTALImp: '19.00',
              baseImponibleTOTALImp: '10000.00',
              valorTOTALImp: '1900.00',
              unidadMedida: '94',
              nombreImpuesto: 'IVA General',
            },
            {
              codigoTOTALImp: '04',
              porcentajeTOTALImp: '8.00',
              baseImponibleTOTALImp: '10000.00',
              valorTOTALImp: '800.00',
              unidadMedida: '94',
              nombreImpuesto: 'Impoconsumo 8%',
            },
            {
              codigoTOTALImp: '01',
              porcentajeTOTALImp: '5.00',
              baseImponibleTOTALImp: '5000.00',
              valorTOTALImp: '250.00',
              unidadMedida: '94',
            },
          ],
          impuestosTotales: [
            { codigoTOTALImp: '01', montoTotal: '2150.00' },
            { codigoTOTALImp: '04', montoTotal: '800.00' },
          ],
          totalSinImpuestos: '25000.00',
          totalMonto: '27950.00',
        },
      } as never,
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
    expect(pdf.length).toBeGreaterThan(500);
  });

  it('normalizes an image QR before embedding it in the PDF', async () => {
    const service = new ReceiptPdfService();
    const qr = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>',
    ).toString('base64');

    const pdf = await service.create({
      cufe: 'cufe-test',
      qr: `data:image/svg+xml;base64,${qr}`,
      currency: {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        format: 'symbol_before',
      },
      payload: {
        factura: {
          consecutivoDocumento: 'FE1',
          fechaEmision: '2026-07-21 10:00:00',
          cliente: { nombreRazonSocial: 'Cliente de prueba' },
          detalleDeFactura: [],
          impuestosTotales: [],
          totalSinImpuestos: '0.00',
          totalMonto: '0.00',
        },
      } as never,
    });

    expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  });
});
