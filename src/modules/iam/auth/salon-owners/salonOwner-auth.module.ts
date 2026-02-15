import { Module } from '@nestjs/common';
import { OwnerAuthService } from './salonOwner-auth.service';
import { OwnerAuthController } from './salonOwner-auth.controller';
import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule],
  controllers: [OwnerAuthController],
  providers: [OwnerAuthService, JwtService],
  exports: [OwnerAuthService],
})
export class OwnerAuthModule {}
