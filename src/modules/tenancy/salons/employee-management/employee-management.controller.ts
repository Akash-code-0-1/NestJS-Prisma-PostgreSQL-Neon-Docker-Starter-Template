import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { EmployeeManagementService } from './employee-management.service';
import {
  MemberIdParamDto,
  MemberProfileQueryDto,
  UpdateMemberDto,
  EmployeeActionDto,
  FilterEmployeeDto,
  TimeOffDto,
} from './dto/filter-employee.dto';

@Controller('iam/auth/employee-management/employees')
export class EmployeeManagementController {
  constructor(private readonly service: EmployeeManagementService) {}

  @Get()
  getEmployees(@Query() query: FilterEmployeeDto) {
    return this.service.getEmployees(query);
  }

  @Get(':id')
  getProfile(
    @Param() params: MemberIdParamDto,
    @Query() query: MemberProfileQueryDto,
  ) {
    return this.service.getMemberProfile(params.id, query);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMemberDto) {
    return this.service.updateMember(id, dto);
  }

  @Post(':id/time-off')
  addTimeOff(@Param('id') id: string, @Body() dto: TimeOffDto) {
    return this.service.addTimeOff(id, dto);
  }

  @Patch(':id/action')
  action(@Param('id') id: string, @Body() dto: EmployeeActionDto) {
    return this.service.performAction(id, dto);
  }
}
