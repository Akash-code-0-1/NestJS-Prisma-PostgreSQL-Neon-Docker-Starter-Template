/* eslint-disable @typescript-eslint/no-misused-promises */
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';

import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const req = context.switchToHttp().getRequest();

    const key = `cache:${req.url}`;

    const cached = await this.redis.get(key);

    if (cached) {
      return of(JSON.parse(cached));
    }

    return next.handle().pipe(
      tap(async (data) => {
        await this.redis.set(key, JSON.stringify(data), 60);
      }),
    );
  }
}
