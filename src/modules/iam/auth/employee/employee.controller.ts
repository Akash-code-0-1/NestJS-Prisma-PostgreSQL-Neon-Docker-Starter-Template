/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';
// import { EmployeeService } from './employee.service';
// import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
// import { CreateEmployeeDto } from './dto/create-employee.dto';
// import { SetEmployeePasswordDto } from './dto/set-employee-password.dto';
// import { LoginEmployeeDto } from './dto/login-employee.dto';

// @Controller('/iam/auth/salon/employee')
// export class EmployeeController {
//   constructor(private readonly employeeService: EmployeeService) {}

//   @Post('create/:salonId')
//   async createEmployee(
//     @Param('salonId') salonId: string,
//     @Body() dto: CreateEmployeeDto,
//   ) {
//     try {
//       return await this.employeeService.createEmployee(salonId, dto);
//     } catch (err: any) {
//       console.error('Error creating employee:', err);
//       return {
//         message: err.message || 'Failed to create employee',
//         stack: err.stack,
//         error: err.name || 'Error',
//       };
//     }
//   }

//   @Post('set-password/:employeeId')
//   async setPassword(
//     @Param('employeeId') employeeId: string,
//     @Body() dto: SetEmployeePasswordDto,
//   ) {
//     try {
//       return await this.employeeService.setPassword(employeeId, dto);
//     } catch (err: any) {
//       console.error('Error setting password:', err);
//       return {
//         message: err.message || 'Failed to set password',
//         stack: err.stack,
//         error: err.name || 'Error',
//       };
//     }
//   }

//   @Post('login')
//   async login(@Body() dto: LoginEmployeeDto) {
//     try {
//       return await this.employeeService.login(dto.email, dto.password);
//     } catch (err: any) {
//       console.error('Error logging in:', err);
//       return {
//         message: err.message || 'Login failed',
//         stack: err.stack,
//         error: err.name || 'Error',
//       };
//     }
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post('logout')
//   async logout(@Req() req: any) {
//     try {
//       const employeeId = req.user?.id ?? req.user?.sub;
//       return await this.employeeService.logout(employeeId);
//     } catch (err: any) {
//       console.error('Error logging out:', err);
//       return {
//         message: err.message || 'Logout failed',
//         stack: err.stack,
//         error: err.name || 'Error',
//       };
//     }
//   }

//   @UseGuards(JwtAuthGuard)
//   @Post('reset-password/:employeeId')
//   async resetPassword(
//     @Param('employeeId') employeeId: string,
//     @Body() body: { newPassword: string },
//   ) {
//     try {
//       return await this.employeeService.resetPassword(
//         employeeId,
//         body.newPassword,
//       );
//     } catch (err: any) {
//       console.error('Error resetting password:', err);
//       return {
//         message: err.message || 'Reset password failed',
//         stack: err.stack,
//         error: err.name || 'Error',
//       };
//     }
//   }
// }
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';

import { EmployeeService } from './employee.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SetEmployeePasswordDto } from './dto/set-employee-password.dto';
import { LoginEmployeeDto } from './dto/login-employee.dto';

@Controller('/iam/auth/salon/employee')
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  // ✅ CREATE EMPLOYEE (FIXED)
  @UseGuards(JwtAuthGuard)
  @Post('create/:salonId')
  async createEmployee(
    @Param('salonId') salonId: string,
    @Body() dto: CreateEmployeeDto,
    @Req() req: any,
  ) {
    return this.employeeService.createEmployee(
      salonId,
      dto,
      req.user, // ✅ THIS FIXES createdBy
    );
  }

  // ✅ SET PASSWORD
  @Post('set-password/:employeeId')
  async setPassword(
    @Param('employeeId') employeeId: string,
    @Body() dto: SetEmployeePasswordDto,
  ) {
    return this.employeeService.setPassword(employeeId, dto);
  }

  // ✅ LOGIN
  @Post('login')
  async login(@Body() dto: LoginEmployeeDto) {
    return this.employeeService.login(dto.email, dto.password);
  }

  // ✅ LOGOUT
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const employeeId = req.user?.id ?? req.user?.sub;
    return this.employeeService.logout(employeeId);
  }

  // ✅ RESET PASSWORD (OWNER/ADMIN)
  @UseGuards(JwtAuthGuard)
  @Post('reset-password/:employeeId')
  async resetPassword(
    @Param('employeeId') employeeId: string,
    @Body() body: { newPassword: string },
  ) {
    return this.employeeService.resetPassword(employeeId, body.newPassword);
  }
}
