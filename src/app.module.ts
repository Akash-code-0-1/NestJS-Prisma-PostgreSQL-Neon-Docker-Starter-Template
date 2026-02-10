import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/auth/users/users.module';
import { SalonsModule } from './modules/salons/salons.module';
import { HealthModule } from './health/health.module'; // ← import this

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SalonsModule,
    HealthModule, // ← add here
  ],
})
export class AppModule {}
