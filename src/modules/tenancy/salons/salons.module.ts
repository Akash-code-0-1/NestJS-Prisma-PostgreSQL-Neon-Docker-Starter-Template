import { Module } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { SalonsController } from './salons.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../../../core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule, JwtModule.register({})],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
