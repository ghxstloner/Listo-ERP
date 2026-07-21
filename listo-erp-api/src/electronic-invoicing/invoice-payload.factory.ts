import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  TheFactoryGeneralTax,
  TheFactoryInvoicePayload,
  TheFactoryLineTax,
  TheFactoryTaxTotal,
} from './the-factory.types';

export interface InvoicePayloadInput {
  consecutive: string;
  numberingRange: string;
  numberingMode: 'WITH_PREFIX' | 'WITHOUT_PREFIX';
  issuedAt: Date;
  paymentReference: string | null;
  customer: {
    name: string;
    isFinalConsumer: boolean;
    taxDocumentType: string | null;
    taxId: string | null;
    taxCheckDigit: string | null;
    fiscalPersonType: string | null;
  };
  paymentMethod: { dianCode: string };
  items: Array<{
    sku: string;
    name: string;
    dianCode: string;
    quantity: Prisma.Decimal;
    unitPrice: Prisma.Decimal;
    taxRate: Prisma.Decimal;
    taxAmount: Prisma.Decimal;
    lineTotal: Prisma.Decimal;
  }>;
}

@Injectable()
export class InvoicePayloadFactory {
  create(input: InvoicePayloadInput): TheFactoryInvoicePayload {
    const taxGroups = new Map<string, TheFactoryGeneralTax>();
    const detailDeFactura = input.items.map((item, index) => {
      const base = this.round(item.unitPrice.mul(item.quantity));
      const tax = this.toTax(item.taxRate, base, item.taxAmount, item.dianCode);
      if (tax) {
        const generalTax = tax;
        const key = `${tax.codigoTOTALImp}:${tax.porcentajeTOTALImp}:${tax.unidadMedida}`;
        const current = taxGroups.get(key);
        taxGroups.set(
          key,
          current ? this.addGeneralTax(current, generalTax) : generalTax,
        );
      }
      return {
        secuencia: String(index + 1),
        codigoProducto: item.sku,
        descripcion: item.name,
        cantidadUnidades: this.format(item.quantity),
        unidadMedida: item.dianCode,
        cantidadReal: '1' as const,
        cantidadRealUnidadMedida: item.dianCode,
        precioVentaUnitario: this.format(item.unitPrice),
        precioTotalSinImpuestos: this.format(base),
        precioTotal: this.format(
          base.plus(tax ? new Prisma.Decimal(tax.valorTOTALImp) : 0),
        ),
        impuestosDetalles: tax ? [tax] : [],
        impuestosTotales: tax ? this.createTaxTotals([tax]) : [],
      };
    });
    const totalWithoutTax = detailDeFactura.reduce(
      (sum, item) => sum.plus(item.precioTotalSinImpuestos),
      new Prisma.Decimal(0),
    );
    const generalTaxes = [...taxGroups.values()];
    const taxTotals = this.createTaxTotals(generalTaxes);
    const totalTax = taxTotals.reduce(
      (sum, tax) => sum.plus(tax.montoTotal),
      new Prisma.Decimal(0),
    );
    const totalBaseImponible = generalTaxes.reduce(
      (sum, tax) => sum.plus(tax.baseImponibleTOTALImp),
      new Prisma.Decimal(0),
    );

    return {
      factura: {
        tipoDocumento: '01',
        consecutivoDocumento: input.consecutive,
        fechaEmision: this.formatDate(input.issuedAt),
        moneda: 'COP',
        cantidadDecimales: '2',
        rangoNumeracion: input.numberingRange,
        cliente: this.createCustomer(input.customer),
        detalleDeFactura: detailDeFactura,
        impuestosGenerales: generalTaxes,
        impuestosTotales: taxTotals,
        mediosDePago: [
          {
            metodoDePago: '1',
            medioPago: input.paymentMethod.dianCode,
            ...(input.paymentReference && {
              numeroDeReferencia: input.paymentReference,
            }),
          },
        ],
        totalSinImpuestos: this.format(totalWithoutTax),
        totalBaseImponible: this.format(totalBaseImponible),
        totalBrutoConImpuesto: this.format(totalWithoutTax.plus(totalTax)),
        totalMonto: this.format(totalWithoutTax.plus(totalTax)),
        redondeoAplicado: '0.00',
        totalProductos: String(input.items.length),
        tipoOperacion: '10',
        tipoSector: '1',
      },
      documentosAdjuntos: '0',
    };
  }

  private createCustomer(customer: InvoicePayloadInput['customer']) {
    if (customer.isFinalConsumer) {
      return {
        nombreRazonSocial: 'CONSUMIDOR FINAL',
        tipoPersona: '2',
        tipoIdentificacion: '13',
        numeroDocumento: '222222222222',
        notificar: 'NO' as const,
        responsabilidadesRut: [{ obligaciones: 'R-99-PN' }],
        detallesTributarios: [{ codigoImpuesto: 'ZZ' }],
      };
    }

    return {
      nombreRazonSocial: customer.name,
      tipoPersona: customer.fiscalPersonType!,
      tipoIdentificacion: customer.taxDocumentType!,
      numeroDocumento: customer.taxId!,
      ...(customer.taxCheckDigit && {
        numeroIdentificacionDV: customer.taxCheckDigit,
      }),
      notificar: 'NO' as const,
      responsabilidadesRut: [{ obligaciones: 'R-99-PN' }],
      detallesTributarios: [{ codigoImpuesto: 'ZZ' }],
    };
  }

  private toTax(
    taxRate: Prisma.Decimal,
    base: Prisma.Decimal,
    amount: Prisma.Decimal,
    unidadMedida: string,
  ) {
    if (amount.isZero()) return null;
    const rate = taxRate.greaterThan(1) ? taxRate : taxRate.mul(100);
    return {
      codigoTOTALImp: '01',
      porcentajeTOTALImp: this.format(rate),
      baseImponibleTOTALImp: this.format(base),
      valorTOTALImp: this.format(amount),
      unidadMedida,
    };
  }

  private addGeneralTax(
    current: TheFactoryGeneralTax,
    next: TheFactoryGeneralTax,
  ): TheFactoryGeneralTax {
    return {
      ...current,
      baseImponibleTOTALImp: this.format(
        new Prisma.Decimal(current.baseImponibleTOTALImp).plus(
          next.baseImponibleTOTALImp,
        ),
      ),
      valorTOTALImp: this.format(
        new Prisma.Decimal(current.valorTOTALImp).plus(next.valorTOTALImp),
      ),
    };
  }

  private createTaxTotals(
    generalTaxes: TheFactoryGeneralTax[],
  ): TheFactoryTaxTotal[] {
    const totals = new Map<string, Prisma.Decimal>();
    for (const tax of generalTaxes) {
      totals.set(
        tax.codigoTOTALImp,
        (totals.get(tax.codigoTOTALImp) ?? new Prisma.Decimal(0)).plus(
          tax.valorTOTALImp,
        ),
      );
    }
    return [...totals.entries()].map(([codigoTOTALImp, montoTotal]) => ({
      codigoTOTALImp,
      montoTotal: this.format(montoTotal),
    }));
  }

  private format(value: Prisma.Decimal) {
    return this.round(value).toFixed(2);
  }

  private round(value: Prisma.Decimal) {
    return value.toDecimalPlaces(2, Prisma.Decimal.ROUND_HALF_UP);
  }

  private formatDate(date: Date) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'America/Bogota',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const value = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? '';
    return `${value('year')}-${value('month')}-${value('day')} ${value('hour')}:${value('minute')}:${value('second')}`;
  }
}
