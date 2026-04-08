import { Module } from '@nestjs/common';
import { SalonOwnerAnalyticsController } from './salonowner-analytics.controller';
import { SalonOwnerAnalyticsService } from './salonowner-analytics.service';
import { PrismaModule } from '../../../../core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SalonOwnerAnalyticsController],
  providers: [SalonOwnerAnalyticsService],
})
export class SalonOwnerAnalyticsModule {}
