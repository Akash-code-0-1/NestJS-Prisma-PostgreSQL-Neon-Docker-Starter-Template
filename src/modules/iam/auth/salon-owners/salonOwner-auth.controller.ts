import {
  Controller,
  Post,
  Body,
  Param,
  UnauthorizedException,
} from '@nestjs/common';
import { SalonOwnerAuthService } from './salonOwner-auth.service';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto'; // Ensure your DTO is correctly imported
import { LoginSalonOwnerDto } from './dto/login-salonOwner.dto'; // Ensure your login DTO is correctly imported
import { LogoutOwnerDto } from './dto/logout-salonOwner.dto';

@Controller('iam/admin/salons/owner')
export class SalonOwnerAuthController {
  constructor(private readonly salonOwnerAuthService: SalonOwnerAuthService) {}

  @Post('set-password/:ownerId')
  async setPassword(
    @Body() setOwnerPasswordDto: SetOwnerPasswordDto, // DTO to validate password structure
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
  async logout(@Body() logoutOwnerDto: LogoutOwnerDto) {
    // Ensure that userId is passed in the body
    if (!logoutOwnerDto || !logoutOwnerDto.userId) {
      throw new UnauthorizedException('userId is required for logout');
    }

    return this.salonOwnerAuthService.logout(logoutOwnerDto.userId);
  }
}
