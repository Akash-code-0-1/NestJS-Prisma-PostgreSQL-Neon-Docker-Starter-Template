/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
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
  Req,
} from '@nestjs/common';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorators';
import { SetOwnerPasswordDto } from '../../iam/auth/salon-owners/dto/set-owner-password.dto';
import { FilterSalonDto } from './dto/admin-salon-filter.dto';
import { Request } from 'express';

@Controller('iam/admin/salons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalonsController {
  constructor(private readonly salonsService: SalonsService) {}

  @Post('create')
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateSalonDto, @Req() req: Request) {
    const user = req.user as any;

    return this.salonsService.create(dto, user.sub);
  }

  // ✅ Updated findAll using FilterSalonDto
  @Get()
  @Roles('SUPER_ADMIN')
  findAll(@Query() query: FilterSalonDto) {
    // Convert numeric string fields to numbers
    const filters = {
      ...query,
      page: query.page ? Number(query.page) : 1,
      limit: query.limit ? Number(query.limit) : 10,
      minEmployees: query.minEmployees ? Number(query.minEmployees) : undefined,
      maxEmployees: query.maxEmployees ? Number(query.maxEmployees) : undefined,
      minRevenue: query.minRevenue ? Number(query.minRevenue) : undefined,
      maxRevenue: query.maxRevenue ? Number(query.maxRevenue) : undefined,
      minSupport: query.minSupport ? Number(query.minSupport) : undefined,
      maxSupport: query.maxSupport ? Number(query.maxSupport) : undefined,
    };

    return this.salonsService.findAll(filters);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salonsService.findOne(id);
  }

  @Patch('update/:id')
  @Roles('SUPER_ADMIN')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSalonDto,
    @Req() req: Request,
  ) {
    const user = req.user as any;

    return this.salonsService.update(id, dto, user.sub, user.role);
  }

  @Delete('delete/:id')
  @Roles('SUPER_ADMIN')
  remove(@Param('id') id: string) {
    return this.salonsService.remove(id);
  }

  // HARD DELETE - DEV ONLY
  @Delete('hard-delete/:id')
  @Roles('SUPER_ADMIN')
  hardDelete(@Param('id') id: string) {
    // Optionally, you can add a check for NODE_ENV !== 'production'
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException(
        'Hard delete is disabled in production',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.salonsService.hardDelete(id);
  }

  // PATCH route for owner to set password
  @Patch('owner/:ownerId/set-password')
  setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() dto: SetOwnerPasswordDto,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    return this.salonsService.setOwnerPassword(ownerId, dto.password);
  }
}
