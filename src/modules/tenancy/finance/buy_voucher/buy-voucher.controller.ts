import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { BuyVoucherService } from './buy-voucher.service';
import { BuyVoucherDto } from './dto/buy-voucher.dto';

@Controller('salons/:salonId/voucher-purchases')
export class BuyVoucherController {
  constructor(private service: BuyVoucherService) {}

  @Post()
  buy(@Param('salonId') salonId: string, @Body() dto: BuyVoucherDto) {
    return this.service.buy(salonId, dto);
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
