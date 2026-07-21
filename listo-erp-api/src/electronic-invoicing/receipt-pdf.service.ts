import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';
import sharp from 'sharp';
import type { TheFactoryInvoicePayload } from './the-factory.types';

interface ReceiptPdfInput {
  payload: TheFactoryInvoicePayload;
  cufe: string;
  qr: string | null;
}

const RECEIPT_WIDTH = 226.77; // 80 mm in PostScript points.
const MARGIN = 12;

@Injectable()
export class ReceiptPdfService {
  async create({ payload, cufe, qr }: ReceiptPdfInput): Promise<Buffer> {
    const invoice = payload.factura;
    const height = this.estimateHeight(invoice.detalleDeFactura);
    const document = new PDFDocument({
      size: [RECEIPT_WIDTH, height],
      margin: MARGIN,
      info: { Title: `Recibo ${invoice.consecutivoDocumento}` },
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));

    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    document.font('Helvetica-Bold').fontSize(11).text('FACTURA ELECTRONICA', {
      align: 'center',
    });
    document.fontSize(9).text(`No. ${invoice.consecutivoDocumento}`, {
      align: 'center',
    });
    document.font('Helvetica').fontSize(7).text(invoice.fechaEmision, {
      align: 'center',
    });
    document
      .moveDown(0.25)
      .font('Helvetica-Bold')
      .fontSize(7)
      .text('CUFE', { align: 'center' });
    document.font('Courier').fontSize(5).text(cufe, {
      align: 'center',
      width: this.contentWidth(),
    });
    this.rule(document);

    document.font('Helvetica-Bold').fontSize(7).text('COMPRADOR');
    document
      .font('Helvetica')
      .fontSize(8)
      .text(invoice.cliente.nombreRazonSocial, { width: this.contentWidth() });
    this.rule(document);

    document.font('Helvetica-Bold').fontSize(7);
    document.text('CANT', MARGIN, document.y, { width: 30 });
    document.text('DESCRIPCION', MARGIN + 32, document.y, { width: 94 });
    document.text('TOTAL', MARGIN + 128, document.y, {
      width: 74,
      align: 'right',
    });
    document.font('Helvetica').fontSize(7);
    for (const item of invoice.detalleDeFactura) {
      const y = document.y + 3;
      document.text(item.cantidadUnidades, MARGIN, y, { width: 30 });
      document.text(item.descripcion, MARGIN + 32, y, { width: 94 });
      document.text(this.money(item.precioTotal), MARGIN + 128, y, {
        width: 74,
        align: 'right',
      });
      document.y = Math.max(
        document.y,
        y + document.heightOfString(item.descripcion, { width: 94 }),
      );
    }
    this.rule(document);

    this.total(document, 'Subtotal', invoice.totalSinImpuestos);
    for (const tax of invoice.impuestosTotales) {
      this.total(document, this.taxLabel(tax.codigoTOTALImp), tax.montoTotal);
    }
    document.font('Helvetica-Bold');
    this.total(document, 'TOTAL', invoice.totalMonto, 9);
    this.rule(document);

    const qrImage = await this.qrImage(qr);
    if (qrImage) {
      const size = 110;
      document.image(qrImage, (RECEIPT_WIDTH - size) / 2, document.y + 5, {
        fit: [size, size],
      });
    }

    document.end();
    return await completed;
  }

  private estimateHeight(
    items: TheFactoryInvoicePayload['factura']['detalleDeFactura'],
  ) {
    const itemsHeight = items.reduce(
      (height, item) =>
        height + Math.max(16, Math.ceil(item.descripcion.length / 23) * 9),
      0,
    );
    return Math.max(430, 245 + itemsHeight + 130);
  }

  private total(
    document: PDFKit.PDFDocument,
    label: string,
    value: string,
    size = 7,
  ) {
    document.fontSize(size).text(label, MARGIN, document.y + 2, {
      width: 96,
    });
    document.text(this.money(value), MARGIN + 98, document.y, {
      width: 104,
      align: 'right',
    });
  }

  private rule(document: PDFKit.PDFDocument) {
    document.moveDown(0.35);
    document
      .moveTo(MARGIN, document.y)
      .lineTo(RECEIPT_WIDTH - MARGIN, document.y)
      .strokeColor('#999999')
      .stroke();
    document.moveDown(0.35);
  }

  private contentWidth() {
    return RECEIPT_WIDTH - MARGIN * 2;
  }

  private money(value: string) {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 2,
    }).format(Number(value));
  }

  private taxLabel(code: string) {
    return code === '01' ? 'IVA' : `Impuesto ${code}`;
  }

  private async qrImage(qr: string | null) {
    if (!qr) return null;
    const image = this.imageData(qr);
    if (image) {
      try {
        // TheFactory can return QR images in formats PDFKit does not support.
        return await sharp(image).png().toBuffer();
      } catch {
        // Treat unparseable values as QR content instead of crashing receipt creation.
      }
    }
    return QRCode.toBuffer(qr, { type: 'png', width: 220, margin: 1 });
  }

  private imageData(qr: string) {
    const dataUri = qr.match(/^data:image\/[a-zA-Z0-9.+-]+;base64,(.+)$/);
    if (dataUri) return Buffer.from(dataUri[1], 'base64');
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(qr) || qr.length % 4 !== 0) {
      return null;
    }
    return Buffer.from(qr, 'base64');
  }
}
