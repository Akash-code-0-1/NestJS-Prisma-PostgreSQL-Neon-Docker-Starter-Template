/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ServiceImportService } from './import-services.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import {
  BulkActionDto,
  ImportQueryDto,
  StageServiceImportDto,
} from './dto/import-services.dto';

@Controller('tenancy/services/import')
@UseGuards(JwtAuthGuard)
export class ServiceImportController {
  constructor(private readonly service: ServiceImportService) {}

  @Post('stage')
  async upload(@Req() req: any, @Body() dto: StageServiceImportDto) {
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
