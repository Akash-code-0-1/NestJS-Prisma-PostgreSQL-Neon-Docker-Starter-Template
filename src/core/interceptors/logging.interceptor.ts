import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import { WinstonLogger } from '../logger/winston.logger';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const httpContext = context.switchToHttp();
    const req = httpContext.getRequest<Request>();

    const method = req.method;
    const url = req.url;
    const requestId = req.requestId ?? 'unknown-request-id';
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        WinstonLogger.log(
          `[${requestId}] ${method} ${url} - ${duration}ms`,
          'HTTP',
        );
      }),
    );
  }
}
