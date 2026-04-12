/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AppointmentImportService } from './import-appointment.service';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import {
  StageImportDto,
  BulkActionDto,
  ImportQueryDto,
} from './dto/import-appointment.dto';

@Controller('tenancy/appointments/import')
@UseGuards(JwtAuthGuard)
export class AppointmentImportController {
  constructor(private readonly service: AppointmentImportService) {}

  @Post('stage')
  async upload(@Req() req: any, @Body() dto: StageImportDto) {
    return this.service.stageData(req.user.salonId, dto.items);
  }

  @Get('staged-list')
  async getList(@Req() req: any, @Query() query: ImportQueryDto) {
    return this.service.getStagedData(
      req.user.salonId,
      Number(query.page) || 1,
      Number(query.limit) || 10,
    );
  }

  @Post('approve-mass')
  async approve(@Req() req: any, @Body() dto: BulkActionDto) {
    return this.service.approveBulk(req.user.salonId, dto.ids);
  }

  @Delete('reject-mass')
  async reject(@Req() req: any, @Body() dto: BulkActionDto) {
    return this.service.deleteStaged(req.user.salonId, dto.ids);
  }
}
