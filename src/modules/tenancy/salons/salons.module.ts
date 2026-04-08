import { Module } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { SalonsController } from './salons.controller';
import { PrismaModule } from '../../../core/prisma/prisma.module';
import { JwtModule } from '@nestjs/jwt';
import { RedisModule } from '../../../core/redis/redis.module';
import { OwnerAuthModule } from '../../../modules/iam/auth/salon-owners/salonOwner-auth.module';

@Module({
  imports: [PrismaModule, RedisModule, OwnerAuthModule, JwtModule.register({})],
  controllers: [SalonsController],
  providers: [SalonsService],
  exports: [SalonsService],
})
export class SalonsModule {}
