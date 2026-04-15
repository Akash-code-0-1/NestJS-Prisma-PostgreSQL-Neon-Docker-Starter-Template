import { Module } from '@nestjs/common';
import { ServiceImportController } from '../services/import-services.controller';
import { ServiceImportService } from '../services/import-services.service';

@Module({
  controllers: [ServiceImportController],
  providers: [ServiceImportService],
})
export class EmployeeImportModule {}
