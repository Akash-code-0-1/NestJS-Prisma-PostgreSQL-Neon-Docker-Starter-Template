import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Delete,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { BundlesService } from './bundle.service';
import { CreateBundleDto, BundleQueryDto } from './dto/create-bundle.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { Roles } from '../../../../core/decorators/roles.decorators';

@Controller('salons/:salonId/bundles')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BundlesController {
  constructor(private readonly bundlesService: BundlesService) {}

  @Post()
  @Roles('SALON_OWNER')
  create(@Param('salonId') salonId: string, @Body() dto: CreateBundleDto) {
    return this.bundlesService.create(salonId, dto);
  }

  @Get()
  @Roles('SALON_OWNER', 'EMPLOYEE', 'ACCOUNTANT')
  findAll(@Param('salonId') salonId: string, @Query() query: BundleQueryDto) {
    return this.bundlesService.findAll(salonId, query);
  }

  @Get(':id')
  @Roles('SALON_OWNER', 'EMPLOYEE')
  findOne(@Param('id') id: string, @Param('salonId') salonId: string) {
    return this.bundlesService.findOne(id, salonId);
  }

  @Patch(':id')
  @Roles('SALON_OWNER')
  update(
    @Param('id') id: string,
    @Param('salonId') salonId: string,
    @Body() dto: CreateBundleDto,
  ) {
    return this.bundlesService.update(id, salonId, dto);
  }

  // src/modules/tenancy/bundles/bundles.controller.ts

  @Delete(':id')
  @Roles('SALON_OWNER')
  async remove(@Param('id') id: string, @Param('salonId') salonId: string) {
    return this.bundlesService.remove(id, salonId);
  }
}
