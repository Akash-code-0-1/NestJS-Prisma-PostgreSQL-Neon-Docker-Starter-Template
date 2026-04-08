/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
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
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { SalonsService } from './salons.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import { JwtAuthGuard } from '../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../core/guards/roles.guard';
import { Roles } from '../../../core/decorators/roles.decorators';
import { SetOwnerPasswordDto } from '../../iam/auth/salon-owners/dto/set-owner-password.dto';
import { FilterSalonDto } from './dto/admin-salon-filter.dto';
import type { Request } from 'express';
import { SalonOwnerAuthService } from '../../iam/auth/salon-owners/salonOwner-auth.service';

@Controller('iam/admin/salons')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalonsController {
  constructor(
    private readonly salonsService: SalonsService,
    private readonly salonOwnerAuthService: SalonOwnerAuthService,
  ) {}

  @Post('create')
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateSalonDto, @Req() req: Request) {
    const user = req.user as any;

    return this.salonsService.create(dto, user.sub);
  }

  @Get()
  @Roles('SUPER_ADMIN')
  findAll(@Query() query: FilterSalonDto) {
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

  @Delete('hard-delete/:id')
  @Roles('SUPER_ADMIN')
  hardDelete(@Param('id') id: string) {
    if (process.env.NODE_ENV === 'production') {
      throw new HttpException(
        'Hard delete is disabled in production',
        HttpStatus.FORBIDDEN,
      );
    }

    return this.salonsService.hardDelete(id);
  }

  @Patch('owner/:ownerId/set-password')
  async setOwnerPassword(
    @Param('ownerId') ownerId: string,
    @Body() dto: SetOwnerPasswordDto,
  ) {
    try {
      return await this.salonOwnerAuthService.setPassword(
        ownerId,
        dto.password,
      );
    } catch (error) {
      throw new HttpException(
        error.message,
        error.status || HttpStatus.BAD_REQUEST,
      );
    }
  }
}
