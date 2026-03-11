/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Body,
  Param,
  UnauthorizedException,
  UseGuards,
  Req,
} from '@nestjs/common';
import { SalonOwnerAuthService } from './salonOwner-auth.service';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';
import { LoginSalonOwnerDto } from './dto/login-salonOwner.dto';
// import { LogoutOwnerDto } from './dto/logout-salonOwner.dto';
import { CreateSalonOwnerDto } from './dto/create-salon-owner.dto';
import { JwtAuthGuard } from 'src/core/guards/jwt-auth.guard';

@Controller('iam/admin/salon  s/owner')
export class SalonOwnerAuthController {
  constructor(private readonly salonOwnerAuthService: SalonOwnerAuthService) {}

  @Post('signup/:salonId')
  async signup(
    @Body() dto: CreateSalonOwnerDto,
    @Param('salonId') salonId: string,
  ) {
    return this.salonOwnerAuthService.signup(dto, salonId);
  }

  @Post('set-password/:ownerId')
  async setPassword(
    @Body() setOwnerPasswordDto: SetOwnerPasswordDto,
    @Param('ownerId') ownerId: string,
  ) {
    return this.salonOwnerAuthService.setPassword(
      ownerId,
      setOwnerPasswordDto.password,
    );
  }

  @Post('login')
  async login(@Body() loginDto: LoginSalonOwnerDto) {
    return this.salonOwnerAuthService.login(loginDto.email, loginDto.password);
  }

  // Logout endpoint - use LogoutOwnerDto for body validation
  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    return this.salonOwnerAuthService.logout(req.user.sub);
  }
}
