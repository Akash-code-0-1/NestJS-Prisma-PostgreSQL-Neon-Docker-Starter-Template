/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Controller, Post, Body, Param, UseGuards, Req } from '@nestjs/common';

import { ClientService } from './client.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';

import { CreateClientDto } from './dto/create-client.dto';
import { LoginClientDto } from './dto/login-client.dto';

@Controller('/iam/auth/client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @Post('signup/:salonId')
  signup(@Param('salonId') salonId: string, @Body() dto: CreateClientDto) {
    return this.clientService.signup(salonId, dto);
  }

  @Post('login')
  login(@Body() dto: LoginClientDto) {
    return this.clientService.login(dto.email, dto.password);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  logout(@Req() req: any) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const clientId = req.user?.id ?? req.user?.sub;

    return this.clientService.logout(clientId);
  }
}
