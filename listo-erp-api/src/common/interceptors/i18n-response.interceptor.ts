import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class I18nResponseInterceptor implements NestInterceptor {
  constructor(private readonly i18n: I18nService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(async (data) => {
        // If the response has a message property that looks like a translation key, translate it
        if (data && typeof data === 'object' && 'message' in data) {
          const message = data.message;
          if (
            typeof message === 'string' &&
            (message.includes('.success.') || message.includes('.errors.'))
          ) {
            return {
              ...data,
              message: await this.i18n.translate(message),
            };
          }
        }
        return data;
      }),
    );
  }
}
