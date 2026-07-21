import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ValidationError,
} from '@nestjs/common';
import { Response } from 'express';
import { I18nService, I18nValidationException } from 'nestjs-i18n';

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

    const lang = this.getRequestLanguage(request);

    if (exception instanceof I18nValidationException) {
      translatedMessage = await this.extractValidationMessages(
        exception.errors,
        lang,
      );
      response.status(status).json({
        statusCode: status,
        message: translatedMessage,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
      return;
    }

    const translationKey = this.extractTranslationKey(exceptionResponse);

    if (translationKey) {
      const args = this.extractTranslationArgs(exceptionResponse);
      try {
        translatedMessage = await this.i18n.translate(translationKey, {
          lang,
          args,
        });
      } catch {
        translatedMessage = translationKey;
      }
    } else {
      translatedMessage = await this.extractMessage(exceptionResponse, lang);
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

  private async extractMessage(
    response: string | object,
    lang: string,
  ): Promise<string> {
    if (typeof response === 'string') {
      return this.translateValidationMessage(response, lang);
    }

    if (typeof response === 'object' && response !== null) {
      const obj = response as any;

      if (obj.message && typeof obj.message === 'string') {
        return this.translateValidationMessage(obj.message, lang);
      }

      if (Array.isArray(obj.message)) {
        const translated = await Promise.all(
          obj.message.map((message: unknown) =>
            this.translateValidationMessage(String(message), lang),
          ),
        );
        return translated.join(', ');
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

  private getRequestLanguage(request: any): string {
    const supportedLanguages = ['es', 'en', 'pt', 'zh'];
    const rawLanguage =
      request.i18nLang ||
      request.headers?.['accept-language'] ||
      request.headers?.['Accept-Language'] ||
      'es';
    const language = String(rawLanguage)
      .split(',')[0]
      .trim()
      .split('-')[0]
      .toLowerCase();

    return supportedLanguages.includes(language) ? language : 'es';
  }

  private async extractValidationMessages(
    errors: ValidationError[],
    lang: string,
  ): Promise<string> {
    const messages = this.flattenValidationMessages(errors);
    const translated = await Promise.all(
      messages.map((message) => this.translateValidationMessage(message, lang)),
    );

    return translated.join(', ');
  }

  private flattenValidationMessages(errors: ValidationError[]): string[] {
    return errors.flatMap((error) => {
      const ownMessages = error.constraints
        ? Object.values(error.constraints)
        : [];
      const childMessages = error.children?.length
        ? this.flattenValidationMessages(error.children)
        : [];

      return [...ownMessages, ...childMessages];
    });
  }

  private async translateValidationMessage(
    message: string,
    lang: string,
  ): Promise<string> {
    const [translationKey, argsString] = message.split('|');
    if (!translationKey || !this.looksLikeTranslationKey(translationKey)) {
      return this.translateDefaultValidationMessage(message, lang);
    }

    let args: Record<string, any> | undefined;
    if (argsString) {
      try {
        args = JSON.parse(argsString) as Record<string, any>;
      } catch {
        args = undefined;
      }
    }

    try {
      return await this.i18n.translate(translationKey, { lang, args });
    } catch {
      return translationKey;
    }
  }

  private async translateDefaultValidationMessage(
    message: string,
    lang: string,
  ): Promise<string> {
    const normalized = message.trim();

    const defaultValidation = this.mapDefaultValidationMessage(normalized);
    if (!defaultValidation) {
      return message;
    }

    try {
      return await this.i18n.translate(defaultValidation.key, {
        lang,
        args: defaultValidation.args,
      });
    } catch {
      return message;
    }
  }

  private mapDefaultValidationMessage(
    message: string,
  ): { key: string; args?: Record<string, any> } | undefined {
    const emailMatch = message.match(/^(.+) must be an email$/);
    if (emailMatch) {
      return { key: 'common.validation.invalid_email' };
    }

    const stringMatch = message.match(/^(.+) must be a string$/);
    if (stringMatch) {
      return {
        key: 'common.validation.invalid_string',
        args: { field: stringMatch[1] },
      };
    }

    const booleanMatch = message.match(/^(.+) must be a boolean value$/);
    if (booleanMatch) {
      return {
        key: 'common.validation.invalid_boolean',
        args: { field: booleanMatch[1] },
      };
    }

    const notEmptyMatch = message.match(/^(.+) should not be empty$/);
    if (notEmptyMatch) {
      return {
        key: 'common.validation.required_field',
        args: { field: notEmptyMatch[1] },
      };
    }

    const forbiddenPropertyMatch = message.match(
      /^property (.+) should not exist$/,
    );
    if (forbiddenPropertyMatch) {
      return {
        key: 'common.validation.forbidden_property',
        args: { field: forbiddenPropertyMatch[1] },
      };
    }

    const minLengthMatch = message.match(
      /^(.+) must be longer than or equal to (\d+) characters$/,
    );
    if (minLengthMatch) {
      return {
        key: 'common.validation.min_length',
        args: { field: minLengthMatch[1], min: Number(minLengthMatch[2]) },
      };
    }

    const maxLengthMatch = message.match(
      /^(.+) must be shorter than or equal to (\d+) characters$/,
    );
    if (maxLengthMatch) {
      return {
        key: 'common.validation.max_length',
        args: { field: maxLengthMatch[1], max: Number(maxLengthMatch[2]) },
      };
    }

    return undefined;
  }
}
