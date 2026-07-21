import { ReceiptPdfService } from './receipt-pdf.service';

describe('ReceiptPdfService', () => {
  it('creates a thermal PDF with the invoice data and QR content', async () => {
    const service = new ReceiptPdfService();

    const pdf = await service.create({
      cufe: 'cufe-test',
      qr: 'https://catalogo-vpfe.dian.gov.co/document/searchqr?documentkey=cufe-test',
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

  it('normalizes an image QR before embedding it in the PDF', async () => {
    const service = new ReceiptPdfService();
    const qr = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"><rect width="20" height="20"/></svg>',
    ).toString('base64');

    const pdf = await service.create({
      cufe: 'cufe-test',
      qr: `data:image/svg+xml;base64,${qr}`,
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
