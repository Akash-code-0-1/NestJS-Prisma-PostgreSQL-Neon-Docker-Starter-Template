import { Global, Module } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { RedisService } from './redis.service';

@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
        return new Redis({
          host: process.env.REDIS_HOST || 'redis', // Use 'redis' as the default, which is the Docker service name
          port: Number(process.env.REDIS_PORT) || 6379, // Ensure the correct port is used
        });
      },
    },
    RedisService,
  ],
  exports: [RedisService],
})
export class RedisModule {}
