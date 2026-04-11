/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Redis } from 'ioredis';

import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  REDIS_CLIENT,
  REDIS_DEFAULT_TTL,
} from '../../../../core/redis/redis.constants';
import {
  CreatePayslipDto,
  GetPayslipCardQueryDto,
  GetPaymentsPerYearQueryDto,
  GetRemunerationQueryDto,
  UpdatePayslipDto,
  PayslipStatus,
} from './dto/remuneration.dto';

type MonthlyChartRow = {
  month: number;
  total: number;
};

@Injectable()
export class RemunerationService {
  private readonly CACHE_PREFIX = 'salon_remuneration:v1';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  async create(salonId: string, dto: CreatePayslipDto) {
    const result = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const lastPayslip = await tx.payslip.findFirst({
          where: {
            salonId,
            employeeId: dto.employeeId,
          },
          orderBy: {
            date: 'desc',
          },
        });

        const monthlyTfr = dto.grossAmount / 13.5;
        const accumulated =
          Number(lastPayslip?.tfrAccumulated ?? 0) + monthlyTfr;

        const payslip = await tx.payslip.create({
          data: {
            salonId,
            employeeId: dto.employeeId,
            date: new Date(dto.date),
            netAmount: dto.netAmount,
            grossAmount: dto.grossAmount,
            contributions: dto.contributions ?? 0,
            tfrContribution: monthlyTfr,
            tfrAccumulated: accumulated,
            documentUrl: dto.documentUrl,
            status: (dto.status as PayslipStatus | undefined) ?? 'GENERATED',
          },
        });

        return payslip;
      },
    );

    await this.invalidateCache(salonId, dto.employeeId);
    return result;
  }

  async getDashboard(salonId: string, query: GetRemunerationQueryDto) {
    const employeeId = query.employeeId;
    const year = query.year ?? new Date().getFullYear();
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;

    const cacheKey = this.buildDashboardCacheKey({
      salonId,
      employeeId,
      year,
      page,
      limit,
    });

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as {
        list: unknown[];
        total: number;
        stats: {
          averageSalary: number;
          accumulatedTfr: number;
          lastPayslipAmount: number;
          lastPayslipGross: number;
          lastPayslipDate: Date | null;
        };
        chart: MonthlyChartRow[];
        meta: {
          page: number;
          limit: number;
          totalPages: number;
          year: number;
        };
      };
    }

    const yearStart = new Date(`${year}-01-01T00:00:00.000Z`);
    const yearEnd = new Date(`${year}-12-31T23:59:59.999Z`);

    const baseWhere: Prisma.PayslipWhereInput = {
      salonId,
      employeeId,
      date: {
        gte: yearStart,
        lte: yearEnd,
      },
    };

    const [list, total, aggregateStats, lastPayslip, rawChart] =
      await Promise.all([
        this.prisma.payslip.findMany({
          where: baseWhere,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { date: 'desc' },
        }),
        this.prisma.payslip.count({
          where: baseWhere,
        }),
        this.prisma.payslip.aggregate({
          where: {
            salonId,
            employeeId,
          },
          _avg: {
            netAmount: true,
          },
          _max: {
            tfrAccumulated: true,
          },
        }),
        this.prisma.payslip.findFirst({
          where: {
            salonId,
            employeeId,
          },
          orderBy: {
            date: 'desc',
          },
        }),
        this.prisma.$queryRaw<MonthlyChartRow[]>`
          SELECT
            EXTRACT(MONTH FROM "date")::INT AS month,
            COALESCE(SUM("netAmount")::FLOAT, 0) AS total
          FROM "Payslip"
          WHERE "employeeId" = ${employeeId}
            AND "salonId" = ${salonId}
            AND EXTRACT(YEAR FROM "date") = ${year}
          GROUP BY EXTRACT(MONTH FROM "date")
          ORDER BY month ASC
        `,
      ]);

    const result = {
      list,
      total,
      stats: {
        averageSalary: Number(aggregateStats._avg.netAmount ?? 0),
        accumulatedTfr: Number(aggregateStats._max.tfrAccumulated ?? 0),
        lastPayslipAmount: Number(lastPayslip?.netAmount ?? 0),
        lastPayslipGross: Number(lastPayslip?.grossAmount ?? 0),
        lastPayslipDate: lastPayslip?.date ?? null,
      },
      chart: rawChart.map((item) => ({
        month: Number(item.month),
        total: Number(item.total),
      })),
      meta: {
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        year,
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

  async getPaymentsPerYear(salonId: string, query: GetPaymentsPerYearQueryDto) {
    const employeeId = query.employeeId;
    const page = query.page ?? 1;
    const limit = query.limit ?? 6;
    const offset = (page - 1) * limit;

    const cacheKey = `${this.CACHE_PREFIX}:payments-per-year:${salonId}:${employeeId}:${page}:${limit}`;

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as {
        data: Array<{
          year: number;
          total: number;
          monthlyMean: number;
        }>;
        meta: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    }

    const totalYearsResult = await this.prisma.$queryRaw<
      Array<{ count: number }>
    >`
      SELECT COUNT(*)::INT AS count
      FROM (
        SELECT EXTRACT(YEAR FROM "date")::INT AS year
        FROM "Payslip"
        WHERE "employeeId" = ${employeeId}
          AND "salonId" = ${salonId}
        GROUP BY EXTRACT(YEAR FROM "date")
      ) AS yearly_data
    `;
    const total = totalYearsResult[0]?.count ?? 0;

    const data = await this.prisma.$queryRaw<
      Array<{
        year: number;
        total: number;
        monthlyMean: number;
      }>
    >`
      SELECT
        EXTRACT(YEAR FROM "date")::INT AS year,
        COALESCE(SUM("netAmount")::FLOAT, 0) AS total,
        ROUND((COALESCE(SUM("netAmount")::FLOAT, 0) / 12)::numeric, 2)::FLOAT AS "monthlyMean"
      FROM "Payslip"
      WHERE "employeeId" = ${employeeId}
        AND "salonId" = ${salonId}
      GROUP BY EXTRACT(YEAR FROM "date")
      ORDER BY year ASC
      OFFSET ${Number(offset)} 
      LIMIT ${Number(limit)} 
    `;

    const result = {
      data: data.map((item) => ({
        year: Number(item.year),
        total: Number(item.total),
        monthlyMean: Number(item.monthlyMean),
      })),
      meta: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / limit),
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

  async getCards(salonId: string, query: GetPayslipCardQueryDto) {
    const employeeId = query.employeeId;
    const year = query.year ?? new Date().getFullYear();

    const cacheKey = `${this.CACHE_PREFIX}:cards:${salonId}:${employeeId}:${year}`;

    const cachedData = await this.redis.get(cacheKey);
    if (cachedData) {
      return JSON.parse(cachedData) as {
        averageSalary: number;
        accumulatedTfr: number;
        lastPayslipAmount: number;
        lastPayslipGross: number;
        lastPayslipDate: Date | null;
      };
    }

    const [aggregateStats, lastPayslip] = await Promise.all([
      this.prisma.payslip.aggregate({
        where: {
          salonId,
          employeeId,
          date: {
            gte: new Date(`${year}-01-01T00:00:00.000Z`),
            lte: new Date(`${year}-12-31T23:59:59.999Z`),
          },
        },
        _avg: {
          netAmount: true,
        },
        _max: {
          tfrAccumulated: true,
        },
      }),
      this.prisma.payslip.findFirst({
        where: {
          salonId,
          employeeId,
        },
        orderBy: {
          date: 'desc',
        },
      }),
    ]);

    const result = {
      averageSalary: Number(aggregateStats._avg.netAmount ?? 0),
      accumulatedTfr: Number(aggregateStats._max.tfrAccumulated ?? 0),
      lastPayslipAmount: Number(lastPayslip?.netAmount ?? 0),
      lastPayslipGross: Number(lastPayslip?.grossAmount ?? 0),
      lastPayslipDate: lastPayslip?.date ?? null,
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_DEFAULT_TTL,
    );

    return result;
  }

  async findOne(salonId: string, id: string) {
    const cacheKey = `${this.CACHE_PREFIX}:detail:${salonId}:${id}`;
    const cachedData = await this.redis.get(cacheKey);

    if (cachedData) {
      return JSON.parse(cachedData);
    }

    const payslip = await this.prisma.payslip.findFirst({
      where: { id, salonId },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    await this.redis.set(
      cacheKey,
      JSON.stringify(payslip),
      'EX',
      REDIS_DEFAULT_TTL,
    );

    return payslip;
  }

  async update(salonId: string, id: string, dto: UpdatePayslipDto) {
    const existing = await this.findOneUncached(salonId, id);

    const nextGrossAmount = dto.grossAmount ?? Number(existing.grossAmount);
    const nextTfrContribution = nextGrossAmount / 13.5;
    const tfrDifference =
      nextTfrContribution - Number(existing.tfrContribution ?? 0);

    const updated = await this.prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const current = await tx.payslip.update({
          where: { id },
          data: {
            ...(dto.date ? { date: new Date(dto.date) } : {}),
            ...(dto.netAmount !== undefined
              ? { netAmount: dto.netAmount }
              : {}),
            ...(dto.grossAmount !== undefined
              ? { grossAmount: dto.grossAmount }
              : {}),
            ...(dto.contributions !== undefined
              ? { contributions: dto.contributions }
              : {}),
            ...(dto.documentUrl !== undefined
              ? { documentUrl: dto.documentUrl }
              : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            tfrContribution: nextTfrContribution,
            tfrAccumulated: Number(existing.tfrAccumulated) + tfrDifference,
          },
        });

        if (tfrDifference !== 0) {
          const laterPayslips = await tx.payslip.findMany({
            where: {
              salonId,
              employeeId: existing.employeeId,
              date: {
                gt: existing.date,
              },
            },
            orderBy: {
              date: 'asc',
            },
            select: {
              id: true,
              tfrAccumulated: true,
            },
          });

          for (const payslip of laterPayslips) {
            await tx.payslip.update({
              where: { id: payslip.id },
              data: {
                tfrAccumulated: Number(payslip.tfrAccumulated) + tfrDifference,
              },
            });
          }
        }

        return current;
      },
    );

    await this.invalidateCache(salonId, existing.employeeId, id);
    return updated;
  }

  async remove(salonId: string, id: string) {
    const existing = await this.findOneUncached(salonId, id);

    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      await tx.payslip.delete({
        where: { id },
      });

      const laterPayslips = await tx.payslip.findMany({
        where: {
          salonId,
          employeeId: existing.employeeId,
          date: {
            gt: existing.date,
          },
        },
        orderBy: {
          date: 'asc',
        },
        select: {
          id: true,
          tfrAccumulated: true,
        },
      });

      const removedContribution = Number(existing.tfrContribution);

      for (const payslip of laterPayslips) {
        await tx.payslip.update({
          where: { id: payslip.id },
          data: {
            tfrAccumulated:
              Number(payslip.tfrAccumulated) - removedContribution,
          },
        });
      }
    });

    await this.invalidateCache(salonId, existing.employeeId, id);

    return {
      message: 'Deleted successfully',
    };
  }

  private async findOneUncached(salonId: string, id: string) {
    const payslip = await this.prisma.payslip.findFirst({
      where: { id, salonId },
    });

    if (!payslip) {
      throw new NotFoundException('Payslip not found');
    }

    return payslip;
  }

  private buildDashboardCacheKey(params: {
    salonId: string;
    employeeId: string;
    year: number;
    page: number;
    limit: number;
  }) {
    const { salonId, employeeId, year, page, limit } = params;
    return `${this.CACHE_PREFIX}:dashboard:${salonId}:${employeeId}:${year}:${page}:${limit}`;
  }

  private async invalidateCache(
    salonId: string,
    employeeId: string,
    payslipId?: string,
  ) {
    await Promise.all([
      this.deleteByPattern(
        `${this.CACHE_PREFIX}:dashboard:${salonId}:${employeeId}:*`,
      ),
      this.deleteByPattern(
        `${this.CACHE_PREFIX}:cards:${salonId}:${employeeId}:*`,
      ),
      ...(payslipId
        ? [
            this.redis.del(
              `${this.CACHE_PREFIX}:detail:${salonId}:${payslipId}`,
            ),
          ]
        : []),
    ]);
  }

  private async deleteByPattern(pattern: string) {
    let cursor = '0';

    do {
      const [nextCursor, keys] = await this.redis.scan(
        cursor,
        'MATCH',
        pattern,
        'COUNT',
        100,
      );

      cursor = nextCursor;

      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } while (cursor !== '0');
  }
}
