import { Module } from '@nestjs/common';
import { RedisModule } from '../../../core/redis/redis.module';
import { BuyVoucherService } from './buy-voucher.service';
import { BuyVoucherController } from './buy-voucher.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [BuyVoucherController],
  providers: [BuyVoucherService],
})
export class BuyVoucherModule {}
