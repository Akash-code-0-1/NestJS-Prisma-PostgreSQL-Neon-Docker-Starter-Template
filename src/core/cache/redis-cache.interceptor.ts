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
      this.redis
        .get(key)
        .then((cached: string | null) => {
          if (cached) {
            subscriber.next(JSON.parse(cached));
            subscriber.complete();
          } else {
            next
              .handle()
              .pipe(
                tap((data) => {
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
          next.handle().subscribe({
            next: (data) => subscriber.next(data),
            error: (err) => subscriber.error(err),
            complete: () => subscriber.complete(),
          });
        });
    });
  }
}
