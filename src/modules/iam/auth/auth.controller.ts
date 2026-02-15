/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';

@Controller('iam/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('admin/register') register(@Body() dto: any) {
    return this.authService.register(dto);
  }
  @Post('admin/login') login(@Body() dto: any) {
    return this.authService.login(dto);
  }
  @Post('admin/refresh')
  refresh(@Body() body: { userId: number; refreshToken: string }) {
    return this.authService.refreshTokens(
      String(body.userId),
      body.refreshToken,
    );
  }
  @UseGuards(JwtAuthGuard)
  @Post('admin/logout')
  logout(@Req() req) {
    return this.authService.logout(req.user.sub);
  }
}
