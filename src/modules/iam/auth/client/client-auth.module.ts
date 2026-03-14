import { Module } from '@nestjs/common';

import { ClientService } from './client.service';
import { ClientController } from './client.controller';

import { PrismaModule } from '../../../../core/prisma/prisma.module';
import { RedisModule } from '../../../../core/redis/redis.module';

import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [PrismaModule, RedisModule],
  controllers: [ClientController],
  providers: [ClientService, JwtService],
})
export class ClientAuthModule {}
