import { Module } from '@nestjs/common';
import { VoucherService } from './create-voucher.service';
import { VoucherController } from './create-voucher.controller';
import { RedisModule } from '../../../core/redis/redis.module';
import { PrismaModule } from '../../../core/prisma/prisma.module';

@Module({
  imports: [RedisModule, PrismaModule],
  controllers: [VoucherController],
  providers: [VoucherService],
})
export class VoucherModule {}
