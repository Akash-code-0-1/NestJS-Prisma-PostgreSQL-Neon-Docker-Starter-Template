import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT, REDIS_DEFAULT_TTL } from './redis.constants';

@Injectable()
export class RedisService implements OnModuleDestroy {
  constructor(@Inject(REDIS_CLIENT) private readonly redis: Redis) {}

  async get<T>(key: string): Promise<T | null> {
    const data = await this.redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async set(key: string, value: any, ttl = REDIS_DEFAULT_TTL) {
    await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  async delete(key: string) {
    await this.redis.del(key);
  }

  async flushByPrefix(prefix: string) {
    const keys = await this.redis.keys(`${prefix}*`);
    if (keys.length) {
      await this.redis.del(...keys);
    }
  }

  async onModuleDestroy() {
    await this.redis.quit();
  }
}
