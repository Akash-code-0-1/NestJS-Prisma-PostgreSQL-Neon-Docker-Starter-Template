/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
import {
  startOfMonth,
  startOfWeek,
  endOfWeek,
  subDays,
  differenceInDays,
} from 'date-fns';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  REDIS_CLIENT,
  REDIS_DEFAULT_TTL,
} from '../../../../core/redis/redis.constants';

@Injectable()
export class SalonOwnerAnalyticsService {
  private readonly CACHE_PREFIX = 'salon_owner_analytics:v1';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async getActivityTabAnalytics(
    salonId: string,
    employeeId?: string,
    page: number = 1,
    limit: number = 5,
  ) {
    const cacheKey = this.buildCacheKey(salonId, employeeId, page, limit);

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) return JSON.parse(cachedData);

    const now = new Date();
    const thirtyDaysAgo = subDays(now, 30);

    const [metrics, weeklyChart, customersData, hrData, topServices] =
      await Promise.all([
        this.getTopMetrics(salonId, thirtyDaysAgo, employeeId),
        this.getWeeklyAppointmentChart(salonId, employeeId),
        this.getLoyalCustomers(salonId, employeeId, page, limit),
        this.getHRSummary(salonId, employeeId),
        this.getTopServices(salonId, employeeId),
      ]);

    const result = {
      metrics,
      weeklyChart,
      topServices,
      loyalCustomers: customersData.list,
      hrData,
      meta: {
        page,
        limit,
        total: customersData.total,
        totalPages: Math.ceil(customersData.total / limit),
      },
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_DEFAULT_TTL,
    );

    return result;
  }

  private async getTopMetrics(
    salonId: string,
    startDate: Date,
    employeeId?: string,
  ) {
    const commonWhere = {
      salonId,
      ...(employeeId && {
        participants: { some: { services: { some: { employeeId } } } },
      }),
    };

    const [completed, booked] = await Promise.all([
      this.prisma.appointment.count({
        where: {
          ...commonWhere,
          status: 'COMPLETED',
          updatedAt: { gte: startDate },
        },
      }),
      this.prisma.appointment.count({
        where: { ...commonWhere, createdAt: { gte: startDate } },
      }),
    ]);

    return { completed, booked };
  }

  private async getWeeklyAppointmentChart(
    salonId: string,
    employeeId?: string,
  ) {
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    const end = endOfWeek(new Date(), { weekStartsOn: 1 });

    const appointments = await this.prisma.appointment.findMany({
      where: {
        salonId,
        date: {
          gte: start,
          lte: end,
        },
        ...(employeeId && {
          participants: {
            some: {
              services: {
                some: { employeeId },
              },
            },
          },
        }),
      },
      select: {
        id: true,
        date: true,
      },
    });

    const dayMap: Record<string, number> = {};

    appointments.forEach((item) => {
      const day = item.date.toLocaleDateString('en-US', {
        weekday: 'short',
      });
      dayMap[day] = (dayMap[day] || 0) + 1;
    });

    return dayMap;
  }

  private async getTopServices(salonId: string, employeeId?: string) {
    const aggregatedServices = await this.prisma.appointmentService.groupBy({
      by: ['serviceId'],
      where: {
        participant: {
          appointment: {
            salonId,
            status: 'COMPLETED',
          },
        },
        ...(employeeId && { employeeId }),
      },
      _count: {
        serviceId: true,
      },
      orderBy: {
        _count: {
          serviceId: 'desc',
        },
      },
      take: 3,
    });

    if (aggregatedServices.length === 0) return [];

    const serviceDetails = await this.prisma.service.findMany({
      where: {
        id: { in: aggregatedServices.map((s) => s.serviceId) },
      },
      select: {
        id: true,
        serviceName: true,
      },
    });

    return aggregatedServices.map((item) => {
      const detail = serviceDetails.find((d) => d.id === item.serviceId);
      return {
        name: detail?.serviceName || 'Unknown Service',
        count: item._count.serviceId,
      };
    });
  }

  private async getLoyalCustomers(
    salonId: string,
    employeeId: string | undefined,
    page: number,
    limit: number,
  ) {
    const skip = (page - 1) * limit;

    const whereClause = {
      mainAppointments: {
        some: {
          salonId,
          ...(employeeId && {
            participants: { some: { services: { some: { employeeId } } } },
          }),
        },
      },
    };

    const total = await this.prisma.user.count({ where: whereClause });

    const customers = await this.prisma.user.findMany({
      where: whereClause,
      select: {
        firstName: true,
        lastName: true,
        profilePicture: true,
        mainAppointments: {
          where: { salonId },
          orderBy: { date: 'desc' },
          take: 1,
          select: { date: true },
        },
        _count: {
          select: {
            mainAppointments: {
              where: { salonId, status: 'COMPLETED' },
            },
          },
        },
        receipts: {
          where: { salonId, status: 'PAID' },
          select: { totalAmount: true },
        },
      },
      orderBy: { mainAppointments: { _count: 'desc' } },
      skip,
      take: limit,
    });

    const list = customers.map((c) => ({
      name: `${c.firstName} ${c.lastName}`,
      avatar: c.profilePicture,
      lastVisit: c.mainAppointments[0]?.date || null,
      totalAppointments: c._count.mainAppointments,
      totalSpent: c.receipts.reduce((sum, r) => sum + Number(r.totalAmount), 0),
    }));

    return { list, total };
  }

  private async getHRSummary(salonId: string, employeeId?: string) {
    const timeOff = await this.prisma.timeOffRequest.findMany({
      where: {
        employee: { salonId, ...(employeeId && { id: employeeId }) },
        status: 'APPROVED',
        startDate: { gte: startOfMonth(new Date()) },
      },
    });

    const sickDays = timeOff.filter((r) => r.type === 'Sick Leave').length;

    const enjoyedLeave = timeOff
      .filter((r) => r.type === 'Annual Leave')
      .reduce(
        (sum, r) =>
          sum +
          (differenceInDays(new Date(r.endDate), new Date(r.startDate)) + 1),
        0,
      );

    if (employeeId) {
      const profile = await this.prisma.employeeProfile.findUnique({
        where: { id: employeeId },
        select: { yearlyLeaveAllowance: true, nextEvaluationDate: true },
      });

      return {
        sickDays,
        enjoyedLeave,
        maturedLeave: profile?.yearlyLeaveAllowance ?? 0,
        nextEvaluation:
          profile?.nextEvaluationDate instanceof Date
            ? profile.nextEvaluationDate.toISOString().split('T')[0]
            : 'Not Scheduled',
      };
    } else {
      const stats = await this.prisma.employeeProfile.aggregate({
        where: { salonId },
        _sum: { yearlyLeaveAllowance: true },
        _min: { nextEvaluationDate: true },
      });

      return {
        sickDays,
        enjoyedLeave,
        maturedLeave: stats._sum.yearlyLeaveAllowance ?? 0,
        nextEvaluation:
          stats._min.nextEvaluationDate instanceof Date
            ? stats._min.nextEvaluationDate.toISOString().split('T')[0]
            : 'Check Profiles',
      };
    }
  }

  private buildCacheKey(sId: string, eId?: string, p?: number, l?: number) {
    return `${this.CACHE_PREFIX}:activity:${sId}:${eId || 'all'}:${p}:${l}`;
  }
}
