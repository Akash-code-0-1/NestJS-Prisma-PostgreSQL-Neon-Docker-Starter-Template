import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { BundlesController } from './bundle.controller';
import { BundlesService } from './bundle.service';
import { RedisModule } from 'src/core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [BundlesController],
  providers: [BundlesService],
  exports: [BundlesService],
})
export class BundleModule {}
