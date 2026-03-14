import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { RedisService } from '../redis/redis.service';
import type { Request } from 'express';

@Injectable()
export class RedisCacheInterceptor implements NestInterceptor {
  constructor(private readonly redis: RedisService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest<Request>();
    const key = `cache:${req.url}`;

    return new Observable((subscriber) => {
      // Explicitly tell TS that cached is string | null
      this.redis
        .get(key)
        .then((cached: string | null) => {
          if (cached) {
            // Safe JSON.parse because cached is string
            subscriber.next(JSON.parse(cached));
            subscriber.complete();
          } else {
            next
              .handle()
              .pipe(
                tap((data) => {
                  // Fire-and-forget async call (don't await in tap)
                  this.redis
                    .set(key, JSON.stringify(data), 60)
                    .catch((err: unknown) => {
                      console.error('Redis set error:', err);
                    });
                }),
              )
              .subscribe({
                next: (data) => subscriber.next(data),
                error: (err) => subscriber.error(err),
                complete: () => subscriber.complete(),
              });
          }
        })
        .catch((err: unknown) => {
          console.error('Redis get error:', err);
          // fallback: continue without cache
          next.handle().subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
    });
  }
}
