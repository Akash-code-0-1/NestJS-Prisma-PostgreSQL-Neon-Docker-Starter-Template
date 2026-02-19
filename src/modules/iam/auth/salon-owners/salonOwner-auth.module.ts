import { Module } from '@nestjs/common';
import { SalonOwnerAuthService } from './salonOwner-auth.service';
import { SalonOwnerAuthController } from './salonOwner-auth.controller';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule],
  controllers: [SalonOwnerAuthController],
  providers: [SalonOwnerAuthService, JwtService],
  exports: [SalonOwnerAuthService],
})
export class OwnerAuthModule {}
