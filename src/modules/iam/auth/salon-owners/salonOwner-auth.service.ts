import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../../../core/redis/redis.service';
import { CreateSalonOwnerDto } from './dto/create-salon-owner.dto';

@Injectable()
export class SalonOwnerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  async signup(dto: CreateSalonOwnerDto, salonId: string) {
    const { fullName, email, password, confirmPassword } = dto;

    if (password !== confirmPassword) {
      throw new UnauthorizedException('Passwords do not match');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new UnauthorizedException('Email already registered');
    }

    const [firstName, ...rest] = fullName.split(' ');
    const lastName = rest.join(' ') || '';

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await this.prisma.user.create({
      data: {
        firstName,
        lastName,
        email,
        password: hashedPassword,
        role: 'SALON_OWNER',
        isActive: true,
      },
    });

    await this.prisma.ownerProfile.create({
      data: {
        userId: user.id,
        salonId,
      },
    });

    await this.prisma.salonUser.create({
      data: {
        userId: user.id,
        salonId,
        role: 'SALON_OWNER',
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId: salonId,
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
      where: { id: user.id },
      data: { refreshToken },
    });

    await this.redisService.set(
      `auth:${user.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );

    await this.redisService.set(
      `auth:${user.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return {
      message: 'Account created successfully',
      accessToken,
      refreshToken,
    };
  }

  async setPassword(ownerId: string, password: string) {
    const ownerProfile = await this.prisma.ownerProfile.findUnique({
      where: { id: ownerId },
      include: {
        user: true,
      },
    });

    if (!ownerProfile) {
      throw new NotFoundException('Salon Owner not found');
    }

    const user = ownerProfile.user;

    if (!user) {
      throw new NotFoundException('User associated with Salon Owner not found');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const role = user.role || 'SALON_OWNER';

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        role,
      },
    });

    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      salonId: ownerProfile.salonId,
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
      where: { id: user.id },
      data: { refreshToken },
    });

    await this.redisService.set(
      `auth:${user.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );
    await this.redisService.set(
      `auth:${user.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    await this.prisma.ownerProfile.update({
      where: { id: ownerId },
      data: { invitationSent: true },
    });

    return {
      message: 'Password set successfully',
      accessToken,
      refreshToken,
    };
  }

  async login(email: string, password: string) {
    const salonOwner = await this.prisma.user.findUnique({
      where: { email },
      include: { ownerProfile: true },
    });

    if (!salonOwner || salonOwner.role !== 'SALON_OWNER') {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!salonOwner.password) {
      throw new UnauthorizedException(
        'Password not set. Check invitation email.',
      );
    }

    const passwordMatches = await bcrypt.compare(password, salonOwner.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.prisma.user.update({
      where: { id: salonOwner.id },
      data: { isActive: true },
    });

    const payload = {
      sub: salonOwner.id,
      email: salonOwner.email,
      role: salonOwner.role,
      salonId: salonOwner.ownerProfile?.salonId,
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
      where: { id: salonOwner.id },
      data: { refreshToken },
    });

    await this.redisService.set(
      `auth:${salonOwner.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );
    await this.redisService.set(
      `auth:${salonOwner.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return {
      accessToken,
      refreshToken,
      user: {
        id: salonOwner.id,
        email: salonOwner.email,
        role: salonOwner.role,
        salonId: salonOwner.ownerProfile?.salonId,
      },
    };
  }

  async refreshTokens(ownerId: string, refreshToken: string) {
    const salonOwner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { ownerProfile: true },
    });

    if (!salonOwner) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const storedRefreshToken = salonOwner.refreshToken;
    if (storedRefreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const payload = {
      sub: salonOwner.id,
      email: salonOwner.email,
      role: salonOwner.role,
      salonId: salonOwner.ownerProfile?.salonId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });

    await this.redisService.set(
      `auth:${ownerId}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );

    return {
      accessToken,
      message: 'Access token refreshed successfully',
    };
  }

  async logout(ownerId: string) {
    await this.prisma.user.update({
      where: { id: ownerId },
      data: { isActive: false },
    });

    await this.redisService.delete(`auth:${ownerId}:access`);
    await this.redisService.delete(`auth:${ownerId}:refresh`);

    return { message: 'Logged out successfully' };
  }
}
