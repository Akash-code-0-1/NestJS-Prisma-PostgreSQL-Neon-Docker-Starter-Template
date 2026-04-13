import { Module } from '@nestjs/common';
import { ServiceImportController } from './import-services.controller';
import { ServiceImportService } from './import-services.service';

@Module({
  controllers: [ServiceImportController],
  providers: [ServiceImportService],
})
export class ServiceImportModule {}
