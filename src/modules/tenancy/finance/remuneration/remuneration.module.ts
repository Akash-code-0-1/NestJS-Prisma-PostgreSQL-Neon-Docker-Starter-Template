import { Module } from '@nestjs/common';

import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { RedisModule } from '../../../../core/redis/redis.module';

import { RemunerationController } from './remuneration.controller';
import { RemunerationService } from './remuneration.service';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [RemunerationController],
  providers: [RemunerationService],
  exports: [RemunerationService],
})
export class RemunerationModule {}
