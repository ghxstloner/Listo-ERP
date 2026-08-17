import { PurchaseInvoiceReceiptService } from './purchase-invoice-receipt.service';

describe('PurchaseInvoiceReceiptService', () => {
  it('creates a simple supplier invoice PDF', async () => {
    const service = new PurchaseInvoiceReceiptService();
    const content = await service.create(
      {
        documentNumber: 'FACP-000001',
        supplierInvoiceNumber: 'SUP-42',
        issueDate: new Date('2026-08-17T00:00:00.000Z'),
        supplier: { name: 'Supplier', taxId: '900123' },
        items: [
          {
            quantity: 2,
            unitCost: 10,
            taxRate: 0.19,
            taxAmount: 3.8,
            lineTotal: 23.8,
            product: { sku: 'SKU-1', name: 'Product' },
          },
        ],
        subtotal: 20,
        taxAmount: 3.8,
        total: 23.8,
      },
      {
        code: 'USD',
        symbol: '$',
        decimalPlaces: 2,
        decimalSeparator: '.',
        thousandsSeparator: ',',
        format: 'symbol_before',
      },
    );

    expect(content.subarray(0, 5).toString()).toBe('%PDF-');
    expect(content.length).toBeGreaterThan(100);
  });
});
