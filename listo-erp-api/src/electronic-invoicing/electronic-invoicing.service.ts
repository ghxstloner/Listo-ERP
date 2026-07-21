import { Injectable } from '@nestjs/common';
import {
  ElectronicInvoiceStatus,
  ElectronicInvoicingEnvironment,
  ElectronicInvoicingNumberingMode,
  Prisma,
} from '@prisma/client';
import { AuditService } from '../audit/audit.service';
import { I18nException } from '../common/exceptions/i18n-exception';
import { PrismaService } from '../prisma/prisma.service';
import { CredentialsService } from './credentials.service';
import { UpdateColombiaConfigurationDto } from './dto/update-colombia-configuration.dto';
import { InvoicePayloadFactory } from './invoice-payload.factory';
import { ReceiptPdfService } from './receipt-pdf.service';
import { TheFactoryClient } from './the-factory.client';

const COLOMBIA = 'CO';

@Injectable()
export class ElectronicInvoicingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly credentials: CredentialsService,
    private readonly payloadFactory: InvoicePayloadFactory,
    private readonly theFactory: TheFactoryClient,
    private readonly receiptPdf: ReceiptPdfService,
  ) {}

  async getColombiaConfiguration(companyId: number) {
    const configuration =
      await this.prisma.electronicInvoicingConfiguration.findUnique({
        where: { companyId_countryCode: { companyId, countryCode: COLOMBIA } },
      });

    return configuration ? this.serializeConfiguration(configuration) : null;
  }

  async updateColombiaConfiguration(
    companyId: number,
    userId: number,
    dto: UpdateColombiaConfigurationDto,
  ) {
    const existing =
      await this.prisma.electronicInvoicingConfiguration.findUnique({
        where: { companyId_countryCode: { companyId, countryCode: COLOMBIA } },
      });
    const hasTokenEmpresa = dto.tokenEmpresa != null;
    const hasTokenPassword = dto.tokenPassword != null;
    if (hasTokenEmpresa !== hasTokenPassword) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.credentials_pair_required',
      );
    }

    if (!existing) {
      if (
        dto.environment == null ||
        dto.providerBaseUrl == null ||
        dto.rangoNumeracion == null ||
        dto.nextConsecutive == null ||
        !hasTokenEmpresa
      ) {
        throw I18nException.badRequest(
          'electronic_invoicing.errors.initial_configuration_required',
        );
      }
    }
    if (
      dto.rangoNumeracion != null &&
      dto.nextConsecutive == null &&
      existing
    ) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.next_consecutive_required',
      );
    }

    const numberingRange = dto.rangoNumeracion ?? existing?.numberingRange;
    const nextConsecutive = dto.nextConsecutive ?? existing?.nextConsecutive;
    const providerBaseUrl = dto.providerBaseUrl ?? existing?.providerBaseUrl;
    const environment = dto.environment ?? existing?.environment!;
    const numberingMode =
      dto.numberingMode ??
      existing?.numberingMode ??
      ElectronicInvoicingNumberingMode.WITH_PREFIX;
    this.validateNumbering(numberingRange, nextConsecutive, numberingMode);
    this.validateProviderBaseUrl(providerBaseUrl, environment);

    const credentials = hasTokenEmpresa
      ? this.credentials.encrypt({
          tokenEmpresa: dto.tokenEmpresa!,
          tokenPassword: dto.tokenPassword!,
        })
      : null;
    const activeCredentials = credentials
      ? { tokenEmpresa: dto.tokenEmpresa!, tokenPassword: dto.tokenPassword! }
      : existing
        ? this.credentials.decrypt({
            ciphertext: existing.credentialsCiphertext,
            nonce: existing.credentialsNonce,
            authTag: existing.credentialsAuthTag,
          })
        : null;
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { taxDocumentNumber: true },
    });
    if (!company?.taxDocumentNumber || !activeCredentials) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.company_tax_id_required',
      );
    }
    const providerNumberingId = await this.validateProviderNumbering({
      environment,
      credentials: activeCredentials,
      taxId: this.normalizeTaxId(company.taxDocumentNumber),
      numberingRange: numberingRange!,
      nextConsecutive: nextConsecutive!,
      numberingMode,
    });
    const data: Prisma.ElectronicInvoicingConfigurationUncheckedCreateInput = {
      companyId,
      countryCode: COLOMBIA,
      environment,
      providerBaseUrl: providerBaseUrl!,
      providerNumberingId,
      numberingMode,
      numberingRange: numberingRange!,
      nextConsecutive: nextConsecutive!,
      credentialsCiphertext:
        credentials?.ciphertext ?? existing?.credentialsCiphertext!,
      credentialsNonce: credentials?.nonce ?? existing?.credentialsNonce!,
      credentialsAuthTag: credentials?.authTag ?? existing?.credentialsAuthTag!,
      encryptionKeyVersion: existing?.encryptionKeyVersion ?? 1,
    };
    const configuration =
      await this.prisma.electronicInvoicingConfiguration.upsert({
        where: { companyId_countryCode: { companyId, countryCode: COLOMBIA } },
        create: data,
        update: {
          environment: data.environment,
          providerBaseUrl: data.providerBaseUrl,
          providerNumberingId: data.providerNumberingId,
          numberingMode: data.numberingMode,
          numberingRange: data.numberingRange,
          nextConsecutive: data.nextConsecutive,
          ...(credentials && {
            credentialsCiphertext: credentials.ciphertext,
            credentialsNonce: credentials.nonce,
            credentialsAuthTag: credentials.authTag,
          }),
        },
      });

    if (existing) {
      await this.audit.logUpdate(
        userId,
        companyId,
        'electronic-invoicing',
        'Configuración de facturación electrónica Colombia',
        configuration.id,
      );
    } else {
      await this.audit.logCreate(
        userId,
        companyId,
        'electronic-invoicing',
        'Configuración de facturación electrónica Colombia',
        configuration.id,
      );
    }

    return {
      message: 'electronic_invoicing.success.configuration_saved',
      data: this.serializeConfiguration(configuration),
    };
  }

  async createPendingInvoice(
    tx: Prisma.TransactionClient,
    saleId: number,
    companyId: number,
  ) {
    const configuration = await tx.electronicInvoicingConfiguration.findUnique({
      where: { companyId_countryCode: { companyId, countryCode: COLOMBIA } },
      select: {
        id: true,
        providerBaseUrl: true,
        providerNumberingId: true,
        numberingRange: true,
        numberingMode: true,
      },
    });
    if (!configuration) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.configuration_required',
      );
    }
    this.validateProviderBaseUrl(configuration.providerBaseUrl);
    if (!configuration.providerNumberingId) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.numbering_validation_required',
      );
    }

    // The returned value is the only safe source for the concurrent allocation.
    const reservedConfiguration =
      await tx.electronicInvoicingConfiguration.update({
        where: { id: configuration.id },
        data: { nextConsecutive: { increment: 1 } },
        select: { id: true, numberingRange: true, nextConsecutive: true },
      });
    const consecutive = this.buildConsecutive(
      reservedConfiguration.numberingRange,
      reservedConfiguration.nextConsecutive - 1,
      configuration.numberingMode,
    );
    const sale = await tx.sale.findUniqueOrThrow({
      where: { id: saleId },
      select: {
        paymentReference: true,
        createdAt: true,
        customer: {
          select: {
            name: true,
            isFinalConsumer: true,
            taxDocumentType: true,
            taxId: true,
            taxCheckDigit: true,
            fiscalPersonType: true,
          },
        },
        paymentMethod: { select: { dianCode: true } },
        items: {
          select: {
            quantity: true,
            unitPrice: true,
            taxRate: true,
            taxAmount: true,
            lineTotal: true,
            product: { select: { sku: true, name: true, dianCode: true } },
          },
        },
      },
    });
    if (
      !sale.paymentMethod.dianCode ||
      !/^\d{2}$/.test(sale.paymentMethod.dianCode)
    ) {
      throw I18nException.badRequest(
        'sales.errors.payment_method_dian_code_required',
      );
    }
    if (
      sale.items.some(
        (item) =>
          !item.product.dianCode ||
          !/^[A-Za-z0-9]{1,3}$/.test(item.product.dianCode),
      )
    ) {
      throw I18nException.badRequest('sales.errors.product_dian_code_required');
    }

    const payload = this.payloadFactory.create({
      consecutive,
      numberingRange: configuration.numberingRange,
      numberingMode: configuration.numberingMode,
      issuedAt: sale.createdAt,
      paymentReference: sale.paymentReference,
      customer: sale.customer,
      paymentMethod: { dianCode: sale.paymentMethod.dianCode },
      items: sale.items.map((item) => ({
        sku: item.product.sku,
        name: item.product.name,
        dianCode: item.product.dianCode!,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        lineTotal: item.lineTotal,
      })),
    });
    return tx.electronicInvoice.create({
      data: {
        saleId,
        configurationId: reservedConfiguration.id,
        consecutive,
        requestPayload: payload as unknown as Prisma.InputJsonValue,
      },
      select: { id: true, status: true, consecutive: true },
    });
  }

  async getInvoiceForSale(companyId: number, saleId: number) {
    const invoice = await this.prisma.electronicInvoice.findFirst({
      where: { saleId, sale: { companyId } },
      select: {
        id: true,
        saleId: true,
        consecutive: true,
        status: true,
        cufe: true,
        qr: true,
        acceptedAt: true,
        lastError: true,
      },
    });
    if (!invoice) {
      throw I18nException.notFound(
        'electronic_invoicing.errors.invoice_not_found',
      );
    }
    return {
      ...invoice,
      canDownload: invoice.status === ElectronicInvoiceStatus.ACCEPTED,
    };
  }

  async downloadReceipt(companyId: number, saleId: number) {
    const invoice = await this.prisma.electronicInvoice.findFirst({
      where: {
        saleId,
        status: ElectronicInvoiceStatus.ACCEPTED,
        sale: { companyId },
      },
      select: {
        consecutive: true,
        requestPayload: true,
        cufe: true,
        qr: true,
      },
    });
    if (!invoice || !invoice.cufe) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.artifact_not_available',
      );
    }
    return {
      content: await this.receiptPdf.create({
        payload:
          invoice.requestPayload as unknown as import('./the-factory.types').TheFactoryInvoicePayload,
        cufe: invoice.cufe,
        qr: invoice.qr,
      }),
      contentType: 'application/pdf',
      filename: `${invoice.consecutive}-recibo.pdf`,
    };
  }

  private validateNumbering(
    numberingRange: string | undefined,
    nextConsecutive: number | undefined,
    numberingMode: ElectronicInvoicingNumberingMode,
  ) {
    const match = numberingRange?.match(/^([A-Za-z0-9]{1,4})-([1-9]\d*)$/);
    if (
      !match ||
      nextConsecutive == null ||
      nextConsecutive < Number(match[2])
    ) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.invalid_numbering',
      );
    }
  }

  private buildConsecutive(
    numberingRange: string,
    consecutive: number,
    numberingMode: ElectronicInvoicingNumberingMode,
  ) {
    const match = numberingRange.match(/^([A-Za-z0-9]{1,4})-\d+$/);
    if (!match) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.invalid_numbering',
      );
    }
    return numberingMode === ElectronicInvoicingNumberingMode.WITH_PREFIX
      ? `${match[1]}${consecutive}`
      : String(consecutive);
  }

  private validateProviderBaseUrl(
    providerBaseUrl: string | undefined | null,
    environment?: ElectronicInvoicingEnvironment,
  ) {
    try {
      const url = new URL(providerBaseUrl ?? '');
      const expectedHost =
        environment === ElectronicInvoicingEnvironment.PRODUCTION
          ? 'emision21-api.thefactoryhka.com.co'
          : 'demoemision21-api.thefactoryhka.com.co';
      if (url.protocol !== 'https:' || url.hostname !== expectedHost)
        throw new Error();
    } catch {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.provider_url_required',
      );
    }
  }

  private serializeConfiguration(configuration: {
    id: number;
    countryCode: string;
    environment: string;
    providerBaseUrl: string | null;
    providerNumberingId: string | null;
    numberingMode: ElectronicInvoicingNumberingMode;
    numberingRange: string;
    nextConsecutive: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: configuration.id,
      countryCode: configuration.countryCode,
      environment: configuration.environment,
      providerBaseUrl: configuration.providerBaseUrl,
      providerNumberingId: configuration.providerNumberingId,
      numberingMode: configuration.numberingMode,
      numberingRange: configuration.numberingRange,
      nextConsecutive: configuration.nextConsecutive,
      hasCredentials: true,
      createdAt: configuration.createdAt,
      updatedAt: configuration.updatedAt,
    };
  }

  private async validateProviderNumbering(input: {
    environment: ElectronicInvoicingEnvironment;
    credentials: { tokenEmpresa: string; tokenPassword: string };
    taxId: string;
    numberingRange: string;
    nextConsecutive: number;
    numberingMode: ElectronicInvoicingNumberingMode;
  }) {
    const match = input.numberingRange.match(/^([A-Za-z0-9]{1,4})-([1-9]\d*)$/);
    if (!match) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.invalid_numbering',
      );
    }
    const response = await this.theFactory.getNumberingRanges(
      input.environment,
      input.credentials,
      input.taxId,
    );
    const ranges =
      this.providerValue<unknown[]>(response, 'numeraciones', 'Numeraciones') ??
      [];
    const providerMessage = this.providerMessage(response);
    const providerCode = Number(
      this.providerValue(response, 'codigo', 'Codigo') ?? 0,
    );
    const providerResult = this.normalized(
      this.providerValue(response, 'resultado', 'Resultado'),
    );
    if (providerCode >= 400 || providerResult === 'error') {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.provider_numbering_request_failed',
        { code: providerCode, reason: providerMessage },
      );
    }
    if (ranges.length === 0) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.provider_numbering_not_found',
        { reason: providerMessage },
      );
    }
    // HKA's DEMO portal permits both habilitation and Produccion 2.1 sequentials.
    // Production Listo accounts must still use a Produccion 2.1 sequential.
    const allowedSequentialEnvironments =
      input.environment === ElectronicInvoicingEnvironment.DEMO
        ? ['2', '3']
        : ['2'];
    const expectedMode =
      input.numberingMode === ElectronicInvoicingNumberingMode.WITH_PREFIX
        ? '2'
        : '3';
    const numbering = ranges.find(
      (candidate) =>
        this.normalized(this.providerValue(candidate, 'prefijo', 'Prefijo')) ===
          this.normalized(match[1]) &&
        Number(this.providerValue(candidate, 'numeroDesde', 'NumeroDesde')) <=
          input.nextConsecutive &&
        Number(this.providerValue(candidate, 'numeroHasta', 'NumeroHasta')) >=
          input.nextConsecutive &&
        this.isActiveNumbering(
          this.providerValue(candidate, 'activo', 'Activo'),
        ) &&
        this.matchesSequentialEnvironment(
          this.providerValue(
            candidate,
            'tipoAmbienteSecuencial',
            'TipoAmbienteSecuencial',
          ),
          allowedSequentialEnvironments,
        ) &&
        this.isIntegrationService(
          this.providerValue(candidate, 'tipoServicio', 'TipoServicio'),
        ) &&
        this.matchesNumberingMode(
          this.providerValue(candidate, 'modalidad', 'Modalidad'),
          expectedMode,
        ),
    );
    if (!numbering) {
      throw I18nException.badRequest(
        'electronic_invoicing.errors.integration_numbering_required',
      );
    }
    return String(
      this.providerValue(numbering, 'idNumeracion', 'IdNumeracion'),
    );
  }

  private normalized(value: unknown) {
    return String(value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()
      .toLowerCase();
  }

  private normalizeTaxId(value: string) {
    return value.replace(/\s+/g, '');
  }

  private providerMessage(response: { mensaje?: string; resultado?: string }) {
    const message =
      this.providerValue<string>(
        response,
        'mensaje',
        'Mensaje',
        'resultado',
        'Resultado',
      ) ?? 'Sin detalle';
    return message.replace(/[\r\n]+/g, ' ').slice(0, 300);
  }

  private providerValue<T = unknown>(value: unknown, ...keys: string[]) {
    if (!value || typeof value !== 'object') return undefined;
    const record = value as Record<string, unknown>;
    for (const key of keys) {
      if (record[key] != null) return record[key] as T;
    }
    return undefined;
  }

  private isActiveNumbering(value: unknown) {
    return ['1', 'true', 'si', 'activo'].includes(this.normalized(value));
  }

  private matchesSequentialEnvironment(value: unknown, allowedCodes: string[]) {
    const normalized = this.normalized(value);
    return (
      allowedCodes.includes(normalized) ||
      (allowedCodes.includes('2') && normalized.includes('produccion')) ||
      (allowedCodes.includes('3') && normalized.includes('habilitacion'))
    );
  }

  private isIntegrationService(value: unknown) {
    const normalized = this.normalized(value);
    return normalized === '2' || normalized.includes('integraci');
  }

  private matchesNumberingMode(value: unknown, expectedCode: string) {
    const normalized = this.normalized(value);
    return (
      normalized === expectedCode ||
      (expectedCode === '2' && normalized.includes('con prefijo')) ||
      (expectedCode === '3' && normalized.includes('sin prefijo'))
    );
  }
}
