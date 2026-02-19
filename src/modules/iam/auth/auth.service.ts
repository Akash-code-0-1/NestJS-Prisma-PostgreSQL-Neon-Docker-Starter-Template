import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { RedisService } from '../../../core/redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly redisService: RedisService, // Inject RedisService
  ) {}

  async register(dto: any) {
    const admin = await this.usersService.create(dto);
    return this.generateAndStoreTokens(admin);
  }

  async login(dto: any) {
    const admin = await this.usersService.findByEmail(dto.email);
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateAndStoreTokens(admin);
  }

  async refreshTokens(adminId: string, refreshToken: string) {
    const admin = await this.usersService.findById(adminId);
    if (!admin || !admin.refreshToken)
      throw new UnauthorizedException('Access denied');

    const match = await bcrypt.compare(refreshToken, admin.refreshToken);
    if (!match) throw new UnauthorizedException('Access denied');

    return this.generateAndStoreTokens(admin);
  }

  async logout(adminId: string) {
    await this.usersService.updateRefreshToken(adminId, null);
    // Remove the tokens from Redis
    await this.redisService.delete(`auth:${adminId}:access`);
    await this.redisService.delete(`auth:${adminId}:refresh`);

    return { message: 'Logged out' };
  }

  private async generateAndStoreTokens(admin: any) {
    const payload = { sub: admin.id, email: admin.email, role: 'SUPER_ADMIN' };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(admin.id, hashedRefresh);

    // Store tokens in Redis with a TTL of 7 days
    await this.redisService.set(
      `auth:${admin.id}:access`,
      accessToken,
      60 * 60 * 24 * 7,
    );
    await this.redisService.set(
      `auth:${admin.id}:refresh`,
      refreshToken,
      60 * 60 * 24 * 7,
    );

    return { accessToken, refreshToken };
  }
}
