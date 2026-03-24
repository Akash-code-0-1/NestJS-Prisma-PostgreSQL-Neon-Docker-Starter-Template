/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard'; // 👈 Update path

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
    // DEBUG: Add this console log to see exactly what req.user looks like in your terminal
    console.log('User from token:', req.user);

    // If your strategy returns the payload, the ID is likely in 'sub'
    const userId = req.user?.sub || req.user?.id || null;

    return this.contactService.create(salonId, dto, userId);
  }

  @Get()
  async findAll(@Param('salonId') salonId: string) {
    return this.contactService.findAll(salonId);
  }
}
