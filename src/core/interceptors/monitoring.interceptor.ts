/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/core/interceptors/monitoring.interceptor.ts
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { tap } from 'rxjs/operators';

@Injectable()
export class MonitoringInterceptor implements NestInterceptor {
  private readonly logger = new Logger('MONITOR');

  intercept(context: ExecutionContext, next: CallHandler) {
    const req = context.switchToHttp().getRequest();
    const { method, url, user } = req;
    const salonId = user?.salonId || 'GUEST';
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const ms = Date.now() - start;
        this.logger.log(`[${method}] ${url} | Tenant: ${salonId} | +${ms}ms`);
      }),
    );
  }
}
