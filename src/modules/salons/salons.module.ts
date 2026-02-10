import { Module } from '@nestjs/common';
import { SalonsService } from './salons.service';
import { SalonsController } from './salons.controller';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  controllers: [SalonsController],
  providers: [SalonsService, PrismaService],
  exports: [SalonsService], // Exported in case other modules (like Billing) need it
})
export class SalonsModule {}
