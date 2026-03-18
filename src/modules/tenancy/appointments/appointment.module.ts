import { Module } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { AppointmentController } from './appointment.controller';
// import { PrismaModule } from '../../../core/prisma/prisma.module';
import { RedisModule } from '../../../core/redis/redis.module';

@Module({
  imports: [RedisModule],
  controllers: [AppointmentController],
  providers: [AppointmentService],
})
export class AppointmentModule {}
