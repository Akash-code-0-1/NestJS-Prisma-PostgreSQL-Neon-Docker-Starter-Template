/* eslint-disable @typescript-eslint/no-unsafe-return */
// employee-management.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { EmployeeManagementService } from './employee-management.service';
import { FilterEmployeeDto } from './dto/filter-employee.dto';

@Controller('iam/auth/employee-management/employees')
export class EmployeeManagementController {
  constructor(private readonly service: EmployeeManagementService) {}

  @Get()
  async getEmployees(@Query() query: FilterEmployeeDto) {
    return this.service.getEmployees(query);
  }
}
