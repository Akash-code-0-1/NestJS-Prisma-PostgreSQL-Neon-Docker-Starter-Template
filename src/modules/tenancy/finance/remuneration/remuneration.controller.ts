/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';

import { RemunerationService } from './remuneration.service';
import {
  CreatePayslipDto,
  GetPaymentsPerYearQueryDto,
  GetPayslipCardQueryDto,
  GetRemunerationQueryDto,
  UpdatePayslipDto,
} from './dto/remuneration.dto';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PrismaService } from '../../../../core/prisma/prisma.service';

type RequestWithUser = Request & {
  user?: {
    salonId?: string;
    sub?: string;
    id?: string;
    role?: string;
    email?: string;
  } | null;
};

@Controller('tenancy/finance/remuneration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class RemunerationController {
  constructor(
    private readonly remunerationService: RemunerationService,
    private readonly prisma: PrismaService,
  ) {}

  private async getSalonId(req: RequestWithUser): Promise<string> {
    const salonIdFromToken = req.user?.salonId;
    if (salonIdFromToken) return salonIdFromToken;

    const userId = req.user?.sub || req.user?.id;
    if (!userId) {
      throw new UnauthorizedException('Authenticated user not found');
    }

    const ownerProfile = await this.prisma.ownerProfile.findUnique({
      where: { userId },
      select: { salonId: true },
    });

    if (!ownerProfile?.salonId) {
      throw new UnauthorizedException(
        'Authenticated user or salonId not found',
      );
    }

    return ownerProfile.salonId;
  }

  @Post('payslips')
  async create(@Req() req: RequestWithUser, @Body() dto: CreatePayslipDto) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.create(salonId, dto);
  }

  @Get()
  async getDashboard(
    @Req() req: RequestWithUser,
    @Query() query: GetRemunerationQueryDto,
  ) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.getDashboard(salonId, query);
  }

  @Get('payments-per-year/:employeeId')
  async getPaymentsPerYear(
    @Req() req: RequestWithUser,
    @Param('employeeId') employeeId: string,
    @Query() query: GetPaymentsPerYearQueryDto,
  ) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.getPaymentsPerYear(salonId, {
      ...query,
      employeeId,
    });
  }

  @Get('cards')
  async getCards(
    @Req() req: RequestWithUser,
    @Query() query: GetPayslipCardQueryDto,
  ) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.getCards(salonId, query);
  }

  @Get('payslips/:id')
  async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.findOne(salonId, id);
  }

  @Patch('payslips/:id')
  async update(
    @Req() req: RequestWithUser,
    @Param('id') id: string,
    @Body() dto: UpdatePayslipDto,
  ) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.update(salonId, id, dto);
  }

  @Delete('payslips/:id')
  async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
    const salonId = await this.getSalonId(req);
    return this.remunerationService.remove(salonId, id);
  }
}
