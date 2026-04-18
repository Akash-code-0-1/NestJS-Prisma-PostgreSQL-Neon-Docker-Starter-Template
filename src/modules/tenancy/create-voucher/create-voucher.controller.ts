import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { VoucherService } from './create-voucher.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';

@Controller('salons/:salonId/vouchers')
export class VoucherController {
  constructor(private service: VoucherService) {}

  @Post()
  create(@Param('salonId') salonId: string, @Body() dto: CreateVoucherDto) {
    return this.service.create(salonId, dto);
  }

  
  @Get()
  findAll(
    @Param('salonId') salonId: string,
    @Query('search') search?: string,
    @Query('limit') limit = 10,
    @Query('offset') offset = 0,
    @Query('sortBy') sortBy = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    return this.service.findAll(
      salonId,
      search,
      +limit,
      +offset,
      sortBy,
      order,
    );
  }
}
