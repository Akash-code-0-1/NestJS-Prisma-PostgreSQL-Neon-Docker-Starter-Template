/* eslint-disable @typescript-eslint/no-unsafe-return */
// src/modules/tenancy/receipts/receipts.controller.ts
import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ReceiptsService } from './receipt.service';
import { CreateReceiptDto } from './dto/receipt.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorators';

@Controller('salons/:salonId/receipts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptsController {
  constructor(private readonly receiptsService: ReceiptsService) {}

  @Post()
  @Roles('SALON_OWNER')
  create(@Param('salonId') salonId: string, @Body() dto: CreateReceiptDto) {
    return this.receiptsService.create(salonId, dto);
  }

  @Get()
  @Roles('SALON_OWNER', 'ACCOUNTANT')
  async findAll(
    @Param('salonId') salonId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('search') search?: string,
    @Query('status') status?: string,
    @Query('method') method?: string,
    @Query('dateRange') dateRange?: string,
  ) {
    // Pass all filters as an object to the service
    return this.receiptsService.findAll(salonId, {
      page,
      limit,
      search,
      status,
      method,
      dateRange,
    });
  }

  @Patch(':id')
  @Roles('SALON_OWNER')
  update(
    @Param('id') id: string,
    @Param('salonId') salonId: string,
    @Body() dto: CreateReceiptDto,
  ) {
    return this.receiptsService.update(id, salonId, dto);
  }
}
