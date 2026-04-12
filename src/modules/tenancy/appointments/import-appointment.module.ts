import { Module } from '@nestjs/common';
import { AppointmentImportService } from './import-appointment.service';
import { AppointmentImportController } from './import-appointment.controller';

@Module({
  controllers: [AppointmentImportController],
  providers: [AppointmentImportService],
})
export class AppointmentImportModule {}
