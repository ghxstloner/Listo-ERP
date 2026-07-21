import { Injectable } from '@nestjs/common';
import {
  ElectronicInvoiceAttemptType,
  ElectronicInvoiceStatus,
  Prisma,
} from '@prisma/client';
import { CredentialsService } from './credentials.service';
import { PrismaService } from '../prisma/prisma.service';
import { TheFactoryClient } from './the-factory.client';
import {
  TheFactoryClientError,
  TheFactoryEstadoDocumentoResponse,
  TheFactoryInvoicePayload,
} from './the-factory.types';

@Injectable()
export class ElectronicInvoiceDispatcher {
  constructor(
    private readonly prisma: PrismaService,
    private readonly credentials: CredentialsService,
    private readonly theFactory: TheFactoryClient,
  ) {}

  async dispatchPendingInvoice(invoiceId: number) {
    const claim = await this.prisma.electronicInvoice.updateMany({
      where: { id: invoiceId, status: ElectronicInvoiceStatus.PENDING },
      data: { status: ElectronicInvoiceStatus.PROCESSING },
    });
    if (claim.count !== 1) {
      throw new Error('Only PENDING electronic invoices can be dispatched');
    }

    const invoice = await this.prisma.electronicInvoice.findUniqueOrThrow({
      where: { id: invoiceId },
      select: {
        id: true,
        consecutive: true,
        retryCount: true,
        requestPayload: true,
        configuration: {
          select: {
            providerBaseUrl: true,
            credentialsCiphertext: true,
            credentialsNonce: true,
            credentialsAuthTag: true,
          },
        },
      },
    });

    let credentials: ReturnType<CredentialsService['decrypt']>;
    try {
      credentials = this.credentials.decrypt({
        ciphertext: invoice.configuration.credentialsCiphertext,
        nonce: invoice.configuration.credentialsNonce,
        authTag: invoice.configuration.credentialsAuthTag,
      });
    } catch (error) {
      await this.persistConfigurationFailure(invoice, error);
      throw error;
    }

    if (invoice.retryCount > 0) {
      try {
        const statusResponse = await this.theFactory.getDocumentStatus(
          invoice.configuration.providerBaseUrl!,
          credentials,
          invoice.consecutive,
        );
        const status = this.statusFromCheck(statusResponse);
        await this.persistStatusCheck(invoice, statusResponse, status, null);
        if (status !== ElectronicInvoiceStatus.PENDING) {
          return {
            invoiceId: invoice.id,
            consecutive: invoice.consecutive,
            status,
          };
        }
      } catch (error) {
        await this.persistStatusCheckError(invoice, error);
        throw error;
      }
    }

    try {
      const response = await this.theFactory.sendInvoice(
        invoice.configuration.providerBaseUrl!,
        credentials,
        invoice.requestPayload as unknown as TheFactoryInvoicePayload,
      );
      const status = this.responseStatus(response);
      const validationError = this.validationError(response);
      await this.prisma.$transaction([
        this.prisma.electronicInvoiceAttempt.create({
          data: {
            electronicInvoiceId: invoice.id,
            type: ElectronicInvoiceAttemptType.SUBMISSION,
            requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
            providerResponse: response as unknown as Prisma.InputJsonValue,
          },
        }),
        this.prisma.electronicInvoice.update({
          where: { id: invoice.id },
          data: {
            status,
            providerResponse: response as unknown as Prisma.InputJsonValue,
            cufe: response.cufe ?? null,
            qr: response.qr ?? null,
            submittedAt: new Date(),
            acceptedAt:
              status === ElectronicInvoiceStatus.ACCEPTED
                ? this.acceptedAt(response.fechaAceptacionDIAN)
                : null,
            retryCount: { increment: 1 },
            nextRetryAt:
              status === ElectronicInvoiceStatus.PENDING
                ? this.nextRetryAt()
                : null,
            lastError: validationError,
          },
        }),
      ]);

      return {
        invoiceId: invoice.id,
        consecutive: invoice.consecutive,
        status,
      };
    } catch (error) {
      const retryable =
        !(error instanceof TheFactoryClientError) || error.retryable;
      const message =
        error instanceof Error
          ? error.message.slice(0, 2000)
          : 'TheFactory request failed';
      const status = retryable
        ? ElectronicInvoiceStatus.PENDING
        : ElectronicInvoiceStatus.FAILED;
      const checkedStatus = retryable
        ? await this.checkAfterAmbiguousFailure(invoice, credentials, message)
        : null;
      if (
        checkedStatus &&
        checkedStatus.status !== ElectronicInvoiceStatus.PENDING
      ) {
        await this.prisma.electronicInvoiceAttempt.create({
          data: {
            electronicInvoiceId: invoice.id,
            type: ElectronicInvoiceAttemptType.SUBMISSION,
            requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
            error: message,
          },
        });
        return {
          invoiceId: invoice.id,
          consecutive: invoice.consecutive,
          status: checkedStatus.status,
        };
      }
      await this.prisma.$transaction([
        this.prisma.electronicInvoiceAttempt.create({
          data: {
            electronicInvoiceId: invoice.id,
            type: ElectronicInvoiceAttemptType.SUBMISSION,
            requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
            error: message,
          },
        }),
        this.prisma.electronicInvoice.update({
          where: { id: invoice.id },
          data: {
            status,
            retryCount: { increment: 1 },
            nextRetryAt: retryable ? this.nextRetryAt() : null,
            lastError: message,
          },
        }),
      ]);
      throw error;
    }
  }

  private async checkAfterAmbiguousFailure(
    invoice: {
      id: number;
      consecutive: string;
      requestPayload: Prisma.JsonValue;
      configuration: { providerBaseUrl: string | null };
    },
    credentials: ReturnType<CredentialsService['decrypt']>,
    submissionError: string,
  ) {
    try {
      const response = await this.theFactory.getDocumentStatus(
        invoice.configuration.providerBaseUrl!,
        credentials,
        invoice.consecutive,
      );
      const status = this.statusFromCheck(response);
      await this.persistStatusCheck(invoice, response, status, submissionError);
      return { status };
    } catch {
      return null;
    }
  }

  private async persistStatusCheck(
    invoice: {
      id: number;
      requestPayload: Prisma.JsonValue;
    },
    response: TheFactoryEstadoDocumentoResponse,
    status: ElectronicInvoiceStatus,
    submissionError: string | null,
  ) {
    const validationError = this.validationError(response) ?? submissionError;
    await this.prisma.$transaction([
      this.prisma.electronicInvoiceAttempt.create({
        data: {
          electronicInvoiceId: invoice.id,
          type: ElectronicInvoiceAttemptType.STATUS_CHECK,
          requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
          providerResponse: response as unknown as Prisma.InputJsonValue,
          error: submissionError,
        },
      }),
      this.prisma.electronicInvoice.update({
        where: { id: invoice.id },
        data: {
          status,
          providerResponse: response as unknown as Prisma.InputJsonValue,
          cufe: response.cufe ?? null,
          submittedAt: new Date(),
          acceptedAt:
            status === ElectronicInvoiceStatus.ACCEPTED
              ? this.acceptedAt(response.fechaAceptacionDIAN)
              : null,
          nextRetryAt:
            status === ElectronicInvoiceStatus.PENDING
              ? this.nextRetryAt()
              : null,
          lastError: validationError,
        },
      }),
    ]);
  }

  private async persistStatusCheckError(
    invoice: { id: number; requestPayload: Prisma.JsonValue },
    error: unknown,
  ) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 2000)
        : 'TheFactory status check failed';
    const retryable =
      !(error instanceof TheFactoryClientError) || error.retryable;
    await this.prisma.$transaction([
      this.prisma.electronicInvoiceAttempt.create({
        data: {
          electronicInvoiceId: invoice.id,
          type: ElectronicInvoiceAttemptType.STATUS_CHECK,
          requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
          error: message,
        },
      }),
      this.prisma.electronicInvoice.update({
        where: { id: invoice.id },
        data: {
          status: retryable
            ? ElectronicInvoiceStatus.PENDING
            : ElectronicInvoiceStatus.FAILED,
          nextRetryAt: retryable ? this.nextRetryAt() : null,
          lastError: message,
        },
      }),
    ]);
  }

  private async persistConfigurationFailure(
    invoice: { id: number; requestPayload: Prisma.JsonValue },
    error: unknown,
  ) {
    const message =
      error instanceof Error
        ? error.message.slice(0, 2000)
        : 'Electronic invoicing credentials could not be read';
    await this.prisma.$transaction([
      this.prisma.electronicInvoiceAttempt.create({
        data: {
          electronicInvoiceId: invoice.id,
          type: ElectronicInvoiceAttemptType.SUBMISSION,
          requestPayload: invoice.requestPayload as Prisma.InputJsonValue,
          error: message,
        },
      }),
      this.prisma.electronicInvoice.update({
        where: { id: invoice.id },
        data: {
          status: ElectronicInvoiceStatus.FAILED,
          lastError: message,
          nextRetryAt: null,
        },
      }),
    ]);
  }

  private responseStatus(response: {
    codigo: number;
    resultado?: string;
    esValidoDian?: boolean;
  }) {
    if (response.esValidoDian === true) {
      return ElectronicInvoiceStatus.ACCEPTED;
    }
    if (
      response.esValidoDian === false ||
      response.codigo >= 400 ||
      response.resultado?.toLowerCase() === 'error'
    ) {
      return ElectronicInvoiceStatus.REJECTED;
    }
    return ElectronicInvoiceStatus.PENDING;
  }

  private statusFromCheck(response: TheFactoryEstadoDocumentoResponse) {
    if (response.esValidoDIAN === true) {
      return ElectronicInvoiceStatus.ACCEPTED;
    }
    if (
      response.esValidoDIAN === false ||
      response.codigo >= 400 ||
      response.estatusDocumento === 0 ||
      response.resultado?.toLowerCase() === 'error'
    ) {
      return ElectronicInvoiceStatus.REJECTED;
    }
    return ElectronicInvoiceStatus.PENDING;
  }

  private validationError(response: {
    mensaje?: string;
    mensajesValidacion?: string[];
    reglasValidacionDIAN?: string[];
  }) {
    const messages = [
      ...(response.mensajesValidacion ?? []),
      ...(response.reglasValidacionDIAN ?? []),
      ...(response.mensaje ? [response.mensaje] : []),
    ];
    return messages.length > 0 ? messages.join('\n').slice(0, 2000) : null;
  }

  private acceptedAt(value: string | undefined) {
    if (!value) return new Date();
    const date = new Date(value);
    return Number.isNaN(date.valueOf()) ? new Date() : date;
  }

  private nextRetryAt() {
    return new Date(Date.now() + 5 * 60 * 1000);
  }
}
