/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
import { EmployeeImportService } from './import-employee.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import {
  BulkEmployeeActionDto,
  EmployeeImportQueryDto,
  StageEmployeeImportDto,
} from './dto/import-employee.dto';

@Controller('tenancy/employees/import')
@UseGuards(JwtAuthGuard)
export class EmployeeImportController {
  constructor(private readonly service: EmployeeImportService) {}

  @Post('stage')
  async upload(@Req() req: any, @Body() dto: StageEmployeeImportDto) {
    return this.service.stageData(req.user.salonId, dto.items);
  }

  @Get('staged-list')
  async getList(@Req() req: any, @Query() query: EmployeeImportQueryDto) {
    return this.service.getStagedData(
      req.user.salonId,
      Number(query.page) || 1,
      Number(query.limit) || 10,
    );
  }

  @Post('approve-mass')
  async approve(@Req() req: any, @Body() dto: BulkEmployeeActionDto) {
    const currentUserId = req.user.id ?? req.user.sub;
    return this.service.approveBulk(req.user.salonId, dto.ids, currentUserId);
  }

  @Delete('reject-mass')
  async reject(@Req() req: any, @Body() dto: BulkEmployeeActionDto) {
    return this.service.deleteStaged(req.user.salonId, dto.ids);
  }
}
