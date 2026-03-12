/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';

import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SetEmployeePasswordDto } from './dto/set-employee-password.dto';
import { LoginEmployeeDto } from './dto/login-employee.dto';

@Controller('iam/salon/employees')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @UseGuards(JwtAuthGuard)
  @Post('create/:salonId')
  createEmployee(
    @Param('salonId') salonId: string,
    @Body() dto: CreateEmployeeDto,
  ) {
    return this.employeeService.createEmployee(salonId, dto);
  }

  @Post('set-password/:employeeId')
  setPassword(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetEmployeePasswordDto,
  ) {
    return this.employeeService.setPassword(employeeId, dto);
  }

  @Post('login')
  login(@Body() dto: LoginEmployeeDto) {
    return this.employeeService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    const employeeId = req.user?.id ?? req.user?.sub;

    return this.employeeService.logout(employeeId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('reset-password/:employeeId')
  resetPassword(
    @Param('employeeId') employeeId: string,
    @Body() body: { newPassword: string },
  ) {
    return this.employeeService.resetPassword(employeeId, body.newPassword);
  }
}
