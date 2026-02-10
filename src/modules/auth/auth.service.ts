/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from './users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(dto: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const admin = await this.usersService.create(dto);
    return this.generateAndStoreTokens(admin);
  }

  async login(dto: any) {
    const admin = await this.usersService.findByEmail(dto.email);
    if (!admin) throw new UnauthorizedException('Invalid credentials');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const isMatch = await bcrypt.compare(dto.password, admin.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    return this.generateAndStoreTokens(admin);
  }

  async refreshTokens(adminId: string, refreshToken: string) {
    const admin = await this.usersService.findById(adminId);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (!admin || !admin.refreshToken)
      throw new UnauthorizedException('Access denied');

    const match = await bcrypt.compare(refreshToken, admin.refreshToken);
    if (!match) throw new UnauthorizedException('Access denied');

    return this.generateAndStoreTokens(admin);
  }

  async logout(adminId: string) {
    await this.usersService.updateRefreshToken(adminId, null);
    return { message: 'Logged out' };
  }

  private async generateAndStoreTokens(admin: any) {
    const payload = { sub: admin.id, email: admin.email, role: 'ADMIN' };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '15m',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);
    await this.usersService.updateRefreshToken(admin.id, hashedRefresh);

    return { accessToken, refreshToken };
  }
}
