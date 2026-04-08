/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Controller,
  Get,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { SalonOwnerAnalyticsService } from './salonowner-analytics.service';
import { JwtAuthGuard } from '../../../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../../../core/guards/roles.guard';
import { PrismaService } from '../../../../core/prisma/prisma.service';

type RequestWithUser = Request & {
  user?: {
    salonId?: string;
    sub?: string;
    id?: string;
    role?: string;
  } | null;
};

@Controller('tenancy/analytics/salon-owner-analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalonOwnerAnalyticsController {
  constructor(
    private readonly analyticsService: SalonOwnerAnalyticsService,
    private readonly prisma: PrismaService,
  ) {}

  //Helper to ensure we are always scoped to the correct Salon

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
      throw new UnauthorizedException('SalonId not found for this user');
    }

    return ownerProfile.salonId;
  }

  @Get('activity-tab')
  async getActivityTabData(
    @Req() req: RequestWithUser,
    @Query('employeeId') employeeId?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const salonId = await this.getSalonId(req);

    return this.analyticsService.getActivityTabAnalytics(
      salonId,
      employeeId,
      Number(page) || 1,
      Number(limit) || 5,
    );
  }
}
