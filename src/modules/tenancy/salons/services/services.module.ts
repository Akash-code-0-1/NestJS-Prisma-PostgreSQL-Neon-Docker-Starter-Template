import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { RedisModule } from '../../../../core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
