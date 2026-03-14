import { Injectable, UnauthorizedException } from '@nestjs/common';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { RedisService } from '../../../../core/redis/redis.service';

import * as bcrypt from 'bcryptjs';

import { CreateClientDto } from './dto/create-client.dto';

@Injectable()
export class ClientService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private redisService: RedisService,
  ) {}

  async signup(salonId: string, dto: CreateClientDto) {
    const existingUser = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPassword,
        role: 'CLIENT',
        isActive: true,
      },
    });

    await this.prisma.salonUser.create({
      data: {
        userId: user.id,
        salonId: salonId,
        role: 'CLIENT',
        phone: dto.phone,
      },
    });

    return {
      message: 'Client created successfully',
      clientId: user.id,
    };
  }

  async login(email: string, password: string) {
    const client = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!client || client.role !== 'CLIENT') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!client.password) {
      throw new UnauthorizedException('Password not set');
    }

    const passwordMatch = await bcrypt.compare(password, client.password);

    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: client.id,
      email: client.email,
      role: client.role,
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
      `auth:${client.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );

    await this.redisService.set(
      `auth:${client.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: client.id,
        email: client.email,
        role: client.role,
      },
    };
  }

  async logout(clientId: string) {
    await this.redisService.delete(`auth:${clientId}:access`);
    await this.redisService.delete(`auth:${clientId}:refresh`);

    return {
      message: 'Logged out successfully',
    };
  }
}
