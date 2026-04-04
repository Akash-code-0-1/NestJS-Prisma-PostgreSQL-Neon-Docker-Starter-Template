// src/modules/tenancy/receipts/receipts.module.ts
import { Module } from '@nestjs/common';
import { ReceiptsService } from './receipt.service';
import { ReceiptsController } from './receipt.controller';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { RedisModule } from '../../../../core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ReceiptsController],
  providers: [ReceiptsService],
  exports: [ReceiptsService],
})
export class ReceiptsModule {}
