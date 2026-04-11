/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Query,
  Param,
  Req,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { CreateShiftDto, UpdateShiftDto, ShiftQueryDto } from './dto/shift.dto';

@Controller('tenancy/salons/shift-management/shifts')
@UseGuards(JwtAuthGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  async create(@Req() req: any, @Body() dto: CreateShiftDto) {
    return this.shiftService.create(req.user.salonId, dto);
  }

  @Get()
  async findAll(@Req() req: any, @Query() query: ShiftQueryDto) {
    return this.shiftService.findAll(
      req.user.salonId,
      query.employeeId,
      Number(query.page) || 1,
      Number(query.limit) || 5,
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: any) {
    return this.shiftService.findOne(id, req.user.salonId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Req() req: any,
    @Body() dto: UpdateShiftDto,
  ) {
    return this.shiftService.update(id, req.user.salonId, dto);
  }

  @Put()
  async updateMultiple(
    @Req() req: any,
    @Body() { ids, dto }: { ids: string[]; dto: CreateShiftDto },
  ) {
    return this.shiftService.updateMultiple(ids, req.user.salonId, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    return this.shiftService.remove(id, req.user.salonId);
  }

  @Delete()
  async removeMultiple(@Req() req: any, @Body() ids: string[]) {
    return this.shiftService.removeMultiple(ids, req.user.salonId);
  }
}
