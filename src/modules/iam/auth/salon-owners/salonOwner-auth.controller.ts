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
import { LogoutOwnerDto } from './dto/logout-salonOwner.dto';
import { CreateSalonOwnerDto } from './dto/create-salon-owner.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

@Controller('iam/admin/salons/owner')
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

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  async logout(@Req() req: any) {
    // Extract userId from JWT payload, try both 'id' and 'sub'
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('Invalid token: no user ID found');
    }

    return this.salonOwnerAuthService.logout(userId);
  }
}
