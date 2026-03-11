import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../../../core/redis/redis.service';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';
import { CreateSalonOwnerDto } from './dto/create-salon-owner.dto';

@Injectable()
export class SalonOwnerAuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private readonly redisService: RedisService,
  ) {}

  // Salon owner Signup to SalonOwner Portal
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

  // Set password for Salon Owner
  async setPassword(ownerId: string, password: string) {
    // Step 1: Find the salon owner's profile by ownerId
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

    //Hash the new password
    const hashedPassword = await bcrypt.hash(password, 10);

    const role = user.role || 'SALON_OWNER';

    //Update the user's password and role in the database
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        role,
      },
    });

    //Create JWT access and refresh tokens
    const payload = { sub: user.id, email: user.email, role: user.role };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    //Store the refresh token in the database (and also in Redis for session management)
    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }, // Saved the refresh token in the database
    });

    //Store tokens in Redis for session management
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

    //Optionally, update the invitationSent flag for the owner
    await this.prisma.ownerProfile.update({
      where: { id: ownerId },
      data: { invitationSent: true },
    });

    //Return the tokens in the response
    return {
      message: 'Password set successfully',
      accessToken,
      refreshToken,
    };
  }

  // Owner login
  async login(email: string, password: string) {
    const salonOwner = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!salonOwner || salonOwner.role !== 'SALON_OWNER') {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if password exists
    if (!salonOwner.password) {
      throw new UnauthorizedException(
        'Password not set. Check invitation email.',
      );
    }

    const passwordMatches = await bcrypt.compare(password, salonOwner.password);
    if (!passwordMatches) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Set isActive to true when the owner logs in
    await this.prisma.user.update({
      where: { id: salonOwner.id },
      data: { isActive: true },
    });

    // Create JWT tokens
    const payload = {
      sub: salonOwner.id,
      email: salonOwner.email,
      role: salonOwner.role,
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    //Update refreshToken in database (if necessary)
    await this.prisma.user.update({
      where: { id: salonOwner.id },
      data: { refreshToken }, // Save the refresh token in the database
    });

    //Store tokens in Redis for session management
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
      },
    };
  }

  // Refresh tokens - Generate new access token using refresh token
  async refreshTokens(ownerId: string, refreshToken: string) {
    const salonOwner = await this.prisma.user.findUnique({
      where: { id: ownerId },
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
    };
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });

    // Store new access token in Redis
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

  // Logout - Remove session tokens from Redis
  async logout(ownerId: string) {
    // Set isActive to false when the owner logs out
    await this.prisma.user.update({
      where: { id: ownerId },
      data: { isActive: false },
    });

    // Remove tokens from Redis
    await this.redisService.delete(`auth:${ownerId}:access`);
    await this.redisService.delete(`auth:${ownerId}:refresh`);

    return { message: 'Logged out successfully' };
  }
}
