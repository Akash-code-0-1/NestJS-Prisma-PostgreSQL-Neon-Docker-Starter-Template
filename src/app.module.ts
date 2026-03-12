import { Module } from '@nestjs/common';
import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { UsersModule } from './modules/iam/auth/users/users.module';
import { SalonsModule } from './modules/tenancy/salons/salons.module';
import { HealthModule } from './health/health.module'; // ← import this
import { OwnerAuthModule } from './modules/iam/auth/salon-owners/salonOwner-auth.module';
import { EmployeeAuthModule } from './modules/iam/auth/employee/employee.module'; // ← import this

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SalonsModule,
    HealthModule,
    OwnerAuthModule,
    EmployeeAuthModule,
  ],
})
export class AppModule {}
