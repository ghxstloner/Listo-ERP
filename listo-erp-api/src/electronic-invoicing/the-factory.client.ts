import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProviderCredentials } from './credentials.service';
import {
  TheFactoryClientError,
  TheFactoryEnviarResponse,
  TheFactoryDownloadResponse,
  TheFactoryEstadoDocumentoResponse,
  TheFactoryInvoicePayload,
  TheFactoryNumberingRangesResponse,
} from './the-factory.types';

@Injectable()
export class TheFactoryClient {
  constructor(private readonly config: ConfigService) {}

  sendInvoice(
    providerBaseUrl: string,
    credentials: ProviderCredentials,
    payload: TheFactoryInvoicePayload,
  ) {
    return this.post<TheFactoryEnviarResponse>(
      providerBaseUrl,
      '/api/documentos/Enviar',
      {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        ...payload,
      },
    );
  }

  getDocumentStatus(
    providerBaseUrl: string,
    credentials: ProviderCredentials,
    document: string,
  ) {
    return this.post<TheFactoryEstadoDocumentoResponse>(
      providerBaseUrl,
      '/api/documentos/EstadoDocumento',
      {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: document,
      },
    );
  }

  downloadPdf(
    providerBaseUrl: string,
    credentials: ProviderCredentials,
    document: string,
  ) {
    return this.post<TheFactoryDownloadResponse>(
      providerBaseUrl,
      '/api/archivos/DescargaPDF',
      {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: document,
      },
    );
  }

  downloadXml(
    providerBaseUrl: string,
    credentials: ProviderCredentials,
    document: string,
  ) {
    return this.post<TheFactoryDownloadResponse>(
      providerBaseUrl,
      '/api/archivos/DescargaXML',
      {
        tokenEmpresa: credentials.tokenEmpresa,
        tokenPassword: credentials.tokenPassword,
        documento: document,
      },
    );
  }

  getNumberingRanges(
    environment: 'DEMO' | 'PRODUCTION',
    credentials: ProviderCredentials,
    nit: string,
  ) {
    const baseUrl =
      environment === 'DEMO'
        ? 'https://demogestioncontribuyentesrest.thefactoryhka.com.co'
        : 'https://gestioncontribuyentesrest.thefactoryhka.com.co';
    return this.post<TheFactoryNumberingRangesResponse>(
      baseUrl,
      '/api/NumeracionFacturacion/ConsultarNumeraciones',
      {
        Nit: nit,
        TokenEmpresa: credentials.tokenEmpresa,
        TokenClave: credentials.tokenPassword,
        Plataforma: 'TFHKA',
      },
    );
  }

  private async post<T>(
    providerBaseUrl: string,
    path: string,
    body: Record<string, unknown>,
  ): Promise<T> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs());
    try {
      const response = await fetch(`${this.baseUrl(providerBaseUrl)}${path}`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new TheFactoryClientError(
          `TheFactory responded with HTTP ${response.status}`,
          response.status === 408 ||
            response.status === 429 ||
            response.status >= 500,
          'HTTP',
          response.status,
        );
      }
      const content = await response.text();
      try {
        return JSON.parse(content) as T;
      } catch {
        throw new TheFactoryClientError(
          'TheFactory returned an invalid JSON response',
          true,
          'INVALID_RESPONSE',
        );
      }
    } catch (error) {
      if (error instanceof TheFactoryClientError) throw error;
      if (controller.signal.aborted) {
        throw new TheFactoryClientError(
          `TheFactory request timed out after ${this.timeoutMs()}ms`,
          true,
          'TIMEOUT',
        );
      }
      throw new TheFactoryClientError(
        'TheFactory network request failed',
        true,
        'NETWORK',
      );
    } finally {
      clearTimeout(timeout);
    }
  }

  private baseUrl(value: string) {
    try {
      const url = new URL(value);
      if (url.protocol !== 'https:') throw new Error();
      return url.toString().replace(/\/$/, '');
    } catch {
      throw new TheFactoryClientError(
        'TheFactory provider URL must be a valid HTTPS URL',
        false,
        'CONFIGURATION',
      );
    }
  }

  private timeoutMs() {
    const configured = Number(this.config.get('THEFACTORY_TIMEOUT_MS'));
    return Number.isFinite(configured) && configured >= 1_000
      ? Math.min(configured, 120_000)
      : 60_000;
  }
}
