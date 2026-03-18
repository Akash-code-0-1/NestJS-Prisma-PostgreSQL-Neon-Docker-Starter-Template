/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import {
//   Injectable,
//   UnauthorizedException,
//   NotFoundException,
// } from '@nestjs/common';

// import { PrismaService } from '../../../../core/prisma/prisma.service';
// import { JwtService } from '@nestjs/jwt';
// import * as bcrypt from 'bcryptjs';
// import { RedisService } from '../../../../core/redis/redis.service';

// import { CreateEmployeeDto } from './dto/create-employee.dto';
// import { SetEmployeePasswordDto } from './dto/set-employee-password.dto';

// @Injectable()
// export class EmployeeService {
//   constructor(
//     private prisma: PrismaService,
//     private jwtService: JwtService,
//     private redisService: RedisService,
//   ) {}

//   // OWNER CREATES EMPLOYEE
//   async createEmployee(salonId: string, dto: CreateEmployeeDto) {
//     const existingUser = await this.prisma.user.findUnique({
//       where: { email: dto.email },
//     });

//     if (existingUser) {
//       throw new UnauthorizedException('Email already exists');
//     }

//     const user = await this.prisma.user.create({
//       data: {
//         firstName: dto.firstName,
//         lastName: dto.lastName,
//         email: dto.email,
//         role: 'EMPLOYEE',
//         isActive: false,
//       },
//     });

//     await this.prisma.employeeProfile.create({
//       data: {
//         userId: user.id,
//         salonId,

//         salary: dto.salary,
//         designation: dto.designation,
//         dob: dto.dob,
//         address: dto.address,
//         city: dto.city,
//         province: dto.province,
//         cap: dto.cap,
//         emcName: dto.emcName,
//         emcNumber: dto.emcNumber,
//         contractType: dto.contractType,
//         taxIdCode: dto.taxIdCode,
//         iban: dto.iban,
//         startDate: dto.startDate,
//         endDate: dto.endDate,
//         remunerationType: dto.remunerationType,

//         invitationStatus: true,
//         createdBy: currentUser.id,
//         updatedBy: currentUser.id,
//       },
//     });

//     await this.prisma.salonUser.create({
//       data: {
//         userId: user.id,
//         salonId,
//         role: 'EMPLOYEE',
//       },
//     });

//     return {
//       message: 'Employee created and invitation enabled',
//       employeeId: user.id,
//     };
//   }

//   // EMPLOYEE SET PASSWORD
//   async setPassword(employeeId: string, dto: SetEmployeePasswordDto) {
//     if (dto.password !== dto.confirmPassword) {
//       throw new UnauthorizedException('Passwords do not match');
//     }

//     const employeeProfile = await this.prisma.employeeProfile.findUnique({
//       where: { userId: employeeId },
//       include: { user: true },
//     });

//     if (!employeeProfile) {
//       throw new NotFoundException('Employee not found');
//     }

//     if (!employeeProfile.invitationStatus) {
//       throw new UnauthorizedException('Invitation not allowed');
//     }

//     const hashedPassword = await bcrypt.hash(dto.password, 10);

//     await this.prisma.user.update({
//       where: { id: employeeId },
//       data: {
//         password: hashedPassword,
//         role: 'EMPLOYEE',
//         isActive: true,
//       },
//     });

//     const payload = {
//       sub: employeeId,
//       email: employeeProfile.user.email,
//       role: 'EMPLOYEE',
//     };

//     const accessToken = this.jwtService.sign(payload, {
//       secret: process.env.JWT_ACCESS_SECRET,
//       expiresIn: '7d',
//     });

//     const refreshToken = this.jwtService.sign(payload, {
//       secret: process.env.JWT_REFRESH_SECRET,
//       expiresIn: '7d',
//     });

//     await this.prisma.user.update({
//       where: { id: employeeId },
//       data: { refreshToken },
//     });

//     await this.redisService.set(
//       `auth:${employeeId}:access`,
//       accessToken,
//       60 * 60 * 24 * 7,
//     );

//     await this.redisService.set(
//       `auth:${employeeId}:refresh`,
//       refreshToken,
//       60 * 60 * 24 * 7,
//     );

//     return {
//       message: 'Password set successfully',
//       accessToken,
//       refreshToken,
//     };
//   }

//   // EMPLOYEE LOGIN
//   async login(email: string, password: string) {
//     const employee = await this.prisma.user.findUnique({
//       where: { email },
//     });

//     if (!employee || employee.role !== 'EMPLOYEE') {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     if (!employee.password) {
//       throw new UnauthorizedException('Password not set');
//     }

//     const passwordMatch = await bcrypt.compare(password, employee.password);

//     if (!passwordMatch) {
//       throw new UnauthorizedException('Invalid credentials');
//     }

//     const payload = {
//       sub: employee.id,
//       email: employee.email,
//       role: employee.role,
//     };

//     const accessToken = this.jwtService.sign(payload, {
//       secret: process.env.JWT_ACCESS_SECRET,
//       expiresIn: '7d',
//     });

//     const refreshToken = this.jwtService.sign(payload, {
//       secret: process.env.JWT_REFRESH_SECRET,
//       expiresIn: '7d',
//     });

//     await this.redisService.set(
//       `auth:${employee.id}:access`,
//       accessToken,
//       60 * 60 * 24 * 7,
//     );

//     await this.redisService.set(
//       `auth:${employee.id}:refresh`,
//       refreshToken,
//       60 * 60 * 24 * 7,
//     );

//     return {
//       accessToken,
//       refreshToken,
//       user: {
//         id: employee.id,
//         email: employee.email,
//         role: employee.role,
//       },
//     };
//   }

//   // LOGOUT
//   async logout(employeeId: string) {
//     await this.redisService.delete(`auth:${employeeId}:access`);
//     await this.redisService.delete(`auth:${employeeId}:refresh`);

//     await this.prisma.user.update({
//       where: { id: employeeId },
//       data: { isActive: false },
//     });

//     return { message: 'Logged out successfully' };
//   }

//   // OWNER RESET PASSWORD
//   async resetPassword(employeeId: string, newPassword: string) {
//     const hashedPassword = await bcrypt.hash(newPassword, 10);

//     await this.prisma.user.update({
//       where: { id: employeeId },
//       data: { password: hashedPassword },
//     });

//     await this.redisService.delete(`auth:${employeeId}:access`);
//     await this.redisService.delete(`auth:${employeeId}:refresh`);

//     return {
//       message: 'Employee password reset successfully',
//     };
//   }
// }

import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../../../core/redis/redis.service';

import { CreateEmployeeDto } from './dto/create-employee.dto';
import { SetEmployeePasswordDto } from './dto/set-employee-password.dto';

@Injectable()
export class EmployeeService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  // ✅ OWNER CREATES EMPLOYEE
  async createEmployee(
    salonId: string,
    dto: CreateEmployeeDto,
    currentUser: any,
  ) {
    // 🔐 Role check
    if (!['SALON_OWNER', 'SUPER_ADMIN'].includes(currentUser.role)) {
      throw new ForbiddenException('Not allowed to create employee');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    // 🔥 TRANSACTION (important)
    return this.prisma.$transaction(async (tx) => {
      // 1️⃣ Create user
      const user = await tx.user.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          role: 'EMPLOYEE',
          isActive: false,
        },
      });

      // 2️⃣ Create employee profile
      await tx.employeeProfile.create({
        data: {
          userId: user.id,
          salonId,

          salary: dto.salary,
          designation: dto.designation,
          dob: dto.dob,
          address: dto.address,
          city: dto.city,
          province: dto.province,
          cap: dto.cap,
          emcName: dto.emcName,
          emcNumber: dto.emcNumber,
          contractType: dto.contractType,
          taxIdCode: dto.taxIdCode,
          iban: dto.iban,
          startDate: dto.startDate,
          endDate: dto.endDate,
          remunerationType: dto.remunerationType,

          invitationStatus: true,

          // ✅ FIXED
          createdBy: currentUser.id ?? currentUser.sub,
          updatedBy: currentUser.id ?? currentUser.sub,
        },
      });

      // 3️⃣ Link with salon
      await tx.salonUser.create({
        data: {
          userId: user.id,
          salonId,
          role: 'EMPLOYEE',
        },
      });

      return {
        message: 'Employee created and invitation enabled',
        employeeId: user.id,
      };
    });
  }

  // ✅ EMPLOYEE SET PASSWORD
  async setPassword(employeeId: string, dto: SetEmployeePasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const employeeProfile = await this.prisma.employeeProfile.findUnique({
      where: { userId: employeeId },
      include: { user: true },
    });

    if (!employeeProfile) {
      throw new NotFoundException('Employee not found');
    }

    if (!employeeProfile.invitationStatus) {
      throw new UnauthorizedException('Invitation not allowed');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    await this.prisma.user.update({
      where: { id: employeeId },
      data: {
        password: hashedPassword,
        role: 'EMPLOYEE',
        isActive: true,
      },
    });

    const payload = {
      sub: employeeId,
      email: employeeProfile.user.email,
      role: 'EMPLOYEE',
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.prisma.user.update({
      where: { id: employeeId },
      data: { refreshToken },
    });

    await this.redisService.set(
      `auth:${employeeId}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );

    await this.redisService.set(
      `auth:${employeeId}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return {
      message: 'Password set successfully',
      accessToken,
      refreshToken,
    };
  }

  // ✅ EMPLOYEE LOGIN
  async login(email: string, password: string) {
    const employee = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!employee || employee.role !== 'EMPLOYEE') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!employee.password) {
      throw new UnauthorizedException('Password not set');
    }

    const passwordMatch = await bcrypt.compare(password, employee.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: employee.id,
      email: employee.email,
      role: employee.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    await this.redisService.set(
      `auth:${employee.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );

    await this.redisService.set(
      `auth:${employee.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: employee.id,
        email: employee.email,
        role: employee.role,
      },
    };
  }

  // ✅ LOGOUT
  async logout(employeeId: string) {
    await this.redisService.delete(`auth:${employeeId}:access`);
    await this.redisService.delete(`auth:${employeeId}:refresh`);

    await this.prisma.user.update({
      where: { id: employeeId },
      data: { isActive: false },
    });

    return { message: 'Logged out successfully' };
  }

  // ✅ OWNER RESET PASSWORD
  async resetPassword(employeeId: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: employeeId },
      data: { password: hashedPassword },
    });

    await this.redisService.delete(`auth:${employeeId}:access`);
    await this.redisService.delete(`auth:${employeeId}:refresh`);

    return {
      message: 'Employee password reset successfully',
    };
  }
}
