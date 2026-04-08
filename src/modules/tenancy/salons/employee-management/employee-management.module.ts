import { Module } from '@nestjs/common';
import { EmployeeManagementService } from './employee-management.service';
import { EmployeeManagementController } from './employee-management.controller';

@Module({
  controllers: [EmployeeManagementController],
  providers: [EmployeeManagementService],
})
export class EmployeeManagementModule {}
