import { Controller, Post, Body, Param, Get, Delete } from '@nestjs/common';
import { AppointmentService } from './appointment.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';

@Controller('salons/:salonId/appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Post()
  create(@Param('salonId') salonId: string, @Body() dto: CreateAppointmentDto) {
    return this.service.create(salonId, dto);
  }

  @Get()
  findAll(@Param('salonId') salonId: string) {
    return this.service.findAll(salonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
