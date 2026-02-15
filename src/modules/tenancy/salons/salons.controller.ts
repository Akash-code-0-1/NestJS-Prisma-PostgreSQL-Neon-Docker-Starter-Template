import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Patch,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorators';
import { SetOwnerPasswordDto } from './dto/set-owner-password.dto';

@Controller('iam/admin/salons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Post()
  @Roles('ADMIN')
  create(@Body() dto: CreateSalonDto) {
    return this.salonsService.create(dto);
  }

  @Get()
  findAll(
    @Query('page') page: string,
    @Query('limit') limit: string,
    @Query('search') search?: string,
  ) {
    return this.salonsService.findAll(
      Number(page) || 1,
      Number(limit) || 10,
      search,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }

  @Patch(':id')
  @Roles('ADMIN')
  update(@Param('id') id: string, @Body() dto: UpdateSalonDto) {
    return this.salonsService.update(id, dto);
  }

  @Delete(':id')
  @Roles('ADMIN')
  remove(@Param('id') id: string) {
    return this.salonsService.remove(id);
  }

  // PATCH route for owner to set password
  @Patch('owner/:ownerId/set-password')
  setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() dto: SetOwnerPasswordDto,
  ) {
    return this.salonsService.setOwnerPassword(ownerId, dto.password);
  }
}
