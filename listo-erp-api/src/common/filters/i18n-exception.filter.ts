import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService } from 'nestjs-i18n';

@Catch(HttpException)
export class I18nExceptionFilter implements ExceptionFilter {
  constructor(private readonly i18n: I18nService) {}

  async catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();

    const exceptionResponse = exception.getResponse();
    let translatedMessage: string | undefined;
    const translationKey = this.extractTranslationKey(exceptionResponse);

    if (translationKey) {
      const args = this.extractTranslationArgs(exceptionResponse);
      try {
        translatedMessage = await this.i18n.translate(translationKey, {
          lang: request.i18nLang || 'es',
          args,
        });
      } catch {
        translatedMessage = translationKey;
      }
    } else {
      translatedMessage = this.extractMessage(exceptionResponse);
    }

    response.status(status).json({
      statusCode: status,
      message: translatedMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private extractTranslationKey(response: string | object): string | undefined {
    if (typeof response === 'string') {
      return this.looksLikeTranslationKey(response) ? response : undefined;
    }

    if (typeof response === 'object' && response !== null) {
      const obj = response as any;

      if (obj.key && typeof obj.key === 'string') {
        return obj.key;
      }

      if (
        obj.message &&
        typeof obj.message === 'object' &&
        obj.message !== null
      ) {
        if (obj.message.key && typeof obj.message.key === 'string') {
          return obj.message.key;
        }
      }

      if (obj.message && typeof obj.message === 'string') {
        if (this.looksLikeTranslationKey(obj.message as string)) {
          return obj.message;
        }
      }
    }

    return undefined;
  }

  private extractTranslationArgs(
    response: string | object,
  ): Record<string, any> | undefined {
    if (typeof response === 'object' && response !== null) {
      const obj = response as any;

      if (obj.args && typeof obj.args === 'object') {
        return obj.args;
      }

      if (
        obj.message &&
        typeof obj.message === 'object' &&
        obj.message !== null
      ) {
        if (obj.message.args && typeof obj.message.args === 'object') {
          return obj.message.args;
        }
      }
    }

    return undefined;
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (typeof response === 'object' && response !== null) {
      const obj = response as any;

      if (obj.message && typeof obj.message === 'string') {
        return obj.message;
      }

      try {
        return JSON.stringify(response);
      } catch {
        return 'An error occurred';
      }
    }

    return 'An error occurred';
  }

  private looksLikeTranslationKey(message: string): boolean {
    return message.includes('.') && !message.includes(' ');
  }
}
