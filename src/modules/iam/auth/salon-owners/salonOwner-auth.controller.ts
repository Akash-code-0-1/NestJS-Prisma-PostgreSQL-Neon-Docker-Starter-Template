import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { Roles } from '../../../../core/decorators/roles.decorators';
import { OwnerAuthService } from './salonOwner-auth.service';
import { LoginSalonOwnerDto } from './dto/login-salonOwner.dto';

@Controller('iam/auth/salon-owners')
export class OwnerAuthController {
  constructor(private ownerAuthService: OwnerAuthService) {}

  @Post('login')
  login(@Body() dto: LoginSalonOwnerDto) {
    return this.ownerAuthService.login(dto.email, dto.password);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @Roles('SALON_OWNER')
  logout(@Req() req: any) {
    const userId = req.user.sub;
    return this.ownerAuthService.logout(userId);
  }
}
