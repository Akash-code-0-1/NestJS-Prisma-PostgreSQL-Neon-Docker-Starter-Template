import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Request, Response } from 'express';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseInterceptor<T = any> implements NestInterceptor<T, any> {
  intercept(context: ExecutionContext, next: CallHandler<T>) {
    const ctx = context.switchToHttp();

    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    return next.handle().pipe(
      map((data: T) => ({
        success: true,
        statusCode: response.statusCode,
        path: request.url,
        timestamp: new Date().toISOString(),
        data,
      })),
    );
  }
}
