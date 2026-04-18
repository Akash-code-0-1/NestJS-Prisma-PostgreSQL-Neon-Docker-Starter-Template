/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import {
  HealthIndicator,
  HealthIndicatorResult,
  HealthCheckError,
} from '@nestjs/terminus';
// ADDED: Missing import
import { RedisService } from '../redis/redis.service';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private readonly redisService: RedisService) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      const status = await this.redisService.ping();
      const isHealthy = status === 'PONG';

      const result = this.getStatus(key, isHealthy, { message: status });

      if (isHealthy) return result;
      throw new HealthCheckError('Redis Check Failed', result);
    } catch (error) {
      throw new HealthCheckError(
        'Redis Check Failed',
        this.getStatus(key, false, { message: error.message }),
      );
    }
  }
}
