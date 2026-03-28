import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Query,
  Patch,
} from '@nestjs/common';
import { AppointmentService } from './appointment.service';
// Change the import below to get AppointmentStatus from your DTO
import {
  CreateAppointmentDto,
  AppointmentStatus,
} from './dto/create-appointment.dto';

@Controller('salons/:salonId/appointments')
export class AppointmentController {
  constructor(private readonly service: AppointmentService) {}

  @Post()
  async create(
    @Param('salonId') salonId: string,
    @Body() dto: CreateAppointmentDto,
  ) {
    return await this.service.create(salonId, dto);
  }

  @Get()
  async findAll(
    @Param('salonId') salonId: string,
    // This will now use the DTO enum, matching the Service type
    @Query('status') status?: AppointmentStatus,
    @Query('view') view?: 'day' | 'week' | 'month',
    @Query('date') date?: string,
    @Query('search') search?: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return await this.service.findAll(salonId, {
      status,
      view,
      date,
      search,
      page,
      limit,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Param('salonId') salonId: string) {
    return await this.service.findOne(id, salonId);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Param('salonId') salonId: string,
    @Body() dto: Partial<CreateAppointmentDto>,
  ) {
    return await this.service.update(id, salonId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Param('salonId') salonId: string) {
    return await this.service.remove(id, salonId);
  }
}
