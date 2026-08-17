import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

export interface PurchaseReceiptCurrency {
  code: string;
  symbol: string;
  decimalPlaces: number;
  decimalSeparator: string;
  thousandsSeparator: string;
  format: string;
}

interface ReceiptInvoice {
  documentNumber: string;
  supplierInvoiceNumber: string;
  issueDate: Date;
  supplier: { name: string; taxId: string | null };
  items: Array<{
    quantity: number;
    unitCost: number;
    taxRate: number;
    taxAmount: number;
    lineTotal: number;
    product: { sku: string; name: string };
  }>;
  subtotal: number;
  taxAmount: number;
  total: number;
}

const RECEIPT_WIDTH = 226.77;
const MARGIN = 12;

@Injectable()
export class PurchaseInvoiceReceiptService {
  async create(
    invoice: ReceiptInvoice,
    currency: PurchaseReceiptCurrency,
  ): Promise<Buffer> {
    const document = new PDFDocument({
      size: [RECEIPT_WIDTH, this.estimateHeight(invoice)],
      margin: MARGIN,
      info: { Title: `Recibo ${invoice.documentNumber}` },
    });
    const chunks: Buffer[] = [];
    document.on('data', (chunk: Buffer) => chunks.push(chunk));
    const completed = new Promise<Buffer>((resolve, reject) => {
      document.on('end', () => resolve(Buffer.concat(chunks)));
      document.on('error', reject);
    });

    document.font('Helvetica-Bold').fontSize(11).text('FACTURA DE PROVEEDOR', {
      align: 'center',
    });
    document
      .font('Helvetica')
      .fontSize(8)
      .text(`No. ${invoice.documentNumber}`, {
        align: 'center',
      });
    document
      .fontSize(7)
      .text(this.date(invoice.issueDate), { align: 'center' });
    this.rule(document);

    document.font('Helvetica-Bold').fontSize(7).text('PROVEEDOR');
    document.font('Helvetica').fontSize(8).text(invoice.supplier.name);
    if (invoice.supplier.taxId)
      document.fontSize(7).text(`NIT/RUC: ${invoice.supplier.taxId}`);
    document
      .fontSize(7)
      .text(`Factura proveedor: ${invoice.supplierInvoiceNumber}`);
    this.rule(document);

    document.font('Helvetica-Bold').fontSize(7);
    document.text('CANT', MARGIN, document.y, { width: 30 });
    document.text('PRODUCTO', MARGIN + 32, document.y, { width: 94 });
    document.text('TOTAL', MARGIN + 128, document.y, {
      width: 74,
      align: 'right',
    });
    document.font('Helvetica').fontSize(7);
    for (const item of invoice.items) {
      const y = document.y + 3;
      const description = `${item.product.sku} ${item.product.name}`;
      document.text(String(item.quantity), MARGIN, y, { width: 30 });
      document.text(description, MARGIN + 32, y, { width: 94 });
      document.text(this.money(item.lineTotal, currency), MARGIN + 128, y, {
        width: 74,
        align: 'right',
      });
      document.y = Math.max(
        document.y,
        y + document.heightOfString(description, { width: 94 }),
      );
    }
    this.rule(document);
    this.total(document, 'Subtotal', invoice.subtotal, currency);
    this.total(document, 'Impuestos', invoice.taxAmount, currency);
    document.font('Helvetica-Bold');
    this.total(document, 'TOTAL', invoice.total, currency, 9);
    this.rule(document);
    document.font('Helvetica').fontSize(6).text('Recibo interno de compra', {
      align: 'center',
    });

    document.end();
    return completed;
  }

  private estimateHeight(invoice: ReceiptInvoice) {
    const itemsHeight = invoice.items.reduce(
      (height, item) =>
        height +
        Math.max(
          16,
          Math.ceil(`${item.product.sku} ${item.product.name}`.length / 23) * 9,
        ),
      0,
    );
    return Math.max(390, 245 + itemsHeight);
  }

  private total(
    document: PDFKit.PDFDocument,
    label: string,
    value: number,
    currency: PurchaseReceiptCurrency,
    size = 7,
  ) {
    document.fontSize(size).text(label, MARGIN, document.y + 2, { width: 96 });
    document.text(this.money(value, currency), MARGIN + 98, document.y, {
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

  private date(value: Date) {
    return value.toLocaleDateString('es-CO');
  }

  private money(value: number, currency: PurchaseReceiptCurrency) {
    const fixed = Math.abs(value).toFixed(currency.decimalPlaces);
    const [integer, decimals] = fixed.split('.');
    const grouped = integer.replace(
      /\B(?=(\d{3})+(?!\d))/g,
      currency.thousandsSeparator,
    );
    const number = decimals
      ? `${grouped}${currency.decimalSeparator}${decimals}`
      : grouped;
    const sign = value < 0 ? '-' : '';
    const token = currency.format.startsWith('code')
      ? currency.code
      : currency.symbol;
    return currency.format.endsWith('before')
      ? `${sign}${token} ${number}`
      : `${sign}${number} ${token}`;
  }
}
