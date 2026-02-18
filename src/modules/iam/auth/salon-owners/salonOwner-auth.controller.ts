/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../../core/decorators/roles.decorators';
import { OwnerAuthService } from './salonOwner-auth.service';
import { LoginOwnerDto } from './dto/login-salonOwner.dto';

@Controller('iam/auth/salon-owners')
export class OwnerAuthController {
  constructor(private ownerAuthService: OwnerAuthService) {}

  @Post('login')
  login(@Body() dto: LoginOwnerDto) {
    return this.ownerAuthService.login(dto.email, dto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Roles('SALON_OWNER')
  logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user.sub;
    return this.ownerAuthService.logout(userId);
  }
}
