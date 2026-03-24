import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

import { PrismaModule } from './core/prisma/prisma.module';
import { AuthModule } from './modules/iam/auth/auth.module';
import { UsersModule } from './modules/iam/auth/users/users.module';
import { SalonsModule } from './modules/tenancy/salons/salons.module';
import { HealthModule } from './health/health.module';
import { OwnerAuthModule } from './modules/iam/auth/salon-owners/salonOwner-auth.module';
import { EmployeeAuthModule } from './modules/iam/auth/employee/employee.module';
import { ClientAuthModule } from './modules/iam/auth/client/client-auth.module';
import { ServicesModule } from './modules/tenancy/salons/services/services.module';
import { TestimonialModule } from './modules/tenancy/salons/testimonials/testimonial.module';
import { EmployeeManagementModule } from './modules/tenancy/salons/employee-management/employee-management.module';
import { AppointmentModule } from './modules/tenancy/appointments/appointment.module';
import { VoucherModule } from './modules/tenancy/create-voucher/create-voucher.module';
import { BuyVoucherModule } from './modules/tenancy/buy_voucher/buy-voucher.module';
import { ContactModule } from './modules/tenancy/contact/contact.module';
@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60,
        limit: 20,
      },
    ]),

    PrismaModule,
    AuthModule,
    UsersModule,
    SalonsModule,
    HealthModule,
    OwnerAuthModule,
    EmployeeAuthModule,
    ClientAuthModule,
    ServicesModule,
    TestimonialModule,
    EmployeeManagementModule,
    AppointmentModule,
    VoucherModule,
    BuyVoucherModule,
    ContactModule,
  ],
})
export class AppModule {}
