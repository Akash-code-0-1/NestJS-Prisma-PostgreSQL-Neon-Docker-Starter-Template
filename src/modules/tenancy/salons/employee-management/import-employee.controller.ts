/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  Controller,
  UseGuards,
  Post,
  Req,
  Body,
  Get,
  Delete,
} from '@nestjs/common';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { EmployeeImportService } from './import-employee.service';
import { stageEmployeeImportDto } from './dto/import-employee.dto';
import { BulkEmployeeActionDto } from './dto/import-employee.dto';

@Controller('/tenancy/salon/employee-import')
@UseGuards(JwtAuthGuard)
export class EmployeeImportController {
  constructor(private readonly service: EmployeeImportService) {}

  @Post('stage')
  async upload(@Req() req: any, @Body() dto: stageEmployeeImportDto) {
    return this.service.stageData(req.user.salonId, dto.items);
  }

  @Get('staged-list')
  async getList(@Req() req: any) {
    return this.service.getStagedData(
      req.user.salonId,
      Number(req.query.page) || 1,
      Number(req.query.limit) || 10,
    );
  }

  @Post('approve-mass')
  async approve(@Req() req: any, @Body() dto: BulkEmployeeActionDto) {
    const currentUserId = req.user?.id ?? req.user?.sub;

    return this.service.approveBulk(req.user.salonId, dto.ids, currentUserId);
  }

  @Delete('reject-mass')
  async reject(@Req() req: any, @Body() dto: BulkEmployeeActionDto) {
    return this.service.deleteStaged(req.user.salonId, dto.ids);
  }
}
