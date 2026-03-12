import { Module } from '@nestjs/common';
import { EmployeeService } from './employee.service';
import { EmployeeController } from './employee.controller';

import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { JwtService } from '@nestjs/jwt';
import { RedisModule } from '../../../../core/redis/redis.module';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [EmployeeController],
  providers: [EmployeeService, JwtService],
  exports: [EmployeeService],
})
export class EmployeeAuthModule {}
