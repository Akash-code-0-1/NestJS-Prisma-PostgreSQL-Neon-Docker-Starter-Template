import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Delete,
  Patch,
  Query,
} from '@nestjs/common';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Controller('salons/:salonId/services')
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  create(@Param('salonId') salonId: string, @Body() dto: CreateServiceDto) {
    return this.servicesService.create(salonId, dto);
  }

  @Get('search')
  searchServices(
    @Param('salonId') salonId: string,
    @Query('search') search?: string,
    @Query('categories') categories?: string,
    @Query('page') page = '1',
    @Query('limit') limit = '10',
    @Query('sortBy') sortBy = 'createdAt',
    @Query('order') order: 'asc' | 'desc' = 'desc',
  ) {
    const categoryArray = categories ? categories.split(',') : undefined;

    return this.servicesService.searchServices(
      salonId,
      search,
      Number(page),
      Number(limit),
      sortBy,
      order,
      categoryArray,
    );
  }

  @Get()
  findAll(@Param('salonId') salonId: string) {
    return this.servicesService.findAll(salonId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.servicesService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('salonId') salonId: string,
    @Param('id') id: string,
    @Body() dto: UpdateServiceDto,
  ) {
    return this.servicesService.update(salonId, id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.servicesService.remove(id);
  }
}
