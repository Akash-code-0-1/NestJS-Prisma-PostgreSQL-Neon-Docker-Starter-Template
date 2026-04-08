/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Req,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { TestimonialService } from './testimonial.service';
import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

@Controller('salons/:salonId/testimonials')
export class TestimonialController {
  constructor(private readonly service: TestimonialService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Param('salonId') salonId: string,
    @Req() req: any,
    @Body() dto: CreateTestimonialDto,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new ForbiddenException('User not authenticated');
    }

    return this.service.create(salonId, userId, dto);
  }

  @Get()
  findAll(@Param('salonId') salonId: string) {
    return this.service.findAll(salonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('salonId') salonId: string,
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateTestimonialDto,
  ) {
    const userId = req.user?.id ?? req.user?.sub;
    if (!userId) throw new UnauthorizedException('No userId in token');
    return this.service.update(id, salonId, dto, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(
    @Param('salonId') salonId: string,
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const userId = req.user?.id ?? req.user?.sub;

    if (!userId) {
      throw new UnauthorizedException('No userId in token');
    }

    return this.service.remove(salonId, id, userId);
  }
}
