/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ContactService } from './contact.service';
import { CreateContactDto } from './dto/contact.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard'; // 👈 Update path

@Controller('salons/:salonId/contact')
export class ContactController {
  constructor(private readonly contactService: ContactService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Param('salonId') salonId: string,
    @Body() dto: CreateContactDto,
    @Req() req: any,
  ) {
    console.log('User from token:', req.user);

    const userId = req.user?.sub || req.user?.id || null;

    return this.contactService.create(salonId, dto, userId);
  }

  @Get()
  async findAll(@Param('salonId') salonId: string) {
    return this.contactService.findAll(salonId);
  }
}
