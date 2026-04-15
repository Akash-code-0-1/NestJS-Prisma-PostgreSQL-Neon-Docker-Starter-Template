import { Module } from '@nestjs/common';

import { EmployeeImportController } from './import-employee.controller';
import { EmployeeImportService } from './import-employee.service';

@Module({
  controllers: [EmployeeImportController],
  providers: [EmployeeImportService],
})
export class EmployeeImportModule {}
