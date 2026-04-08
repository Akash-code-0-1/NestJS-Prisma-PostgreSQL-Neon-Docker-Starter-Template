/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Redis } from 'ioredis';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import {
  REDIS_CLIENT,
  REDIS_DEFAULT_TTL,
} from '../../../../core/redis/redis.constants';
import {
  CreateShiftDto,
  UpdateShiftDto,
  ShiftIntervalDto,
} from './dto/shift.dto';
import { differenceInMinutes, parse } from 'date-fns';

@Injectable()
export class ShiftService {
  private readonly CACHE_PREFIX = 'shifts:v1';

  constructor(
    private readonly prisma: PrismaService,
    @Inject(REDIS_CLIENT) private readonly redis: Redis,
  ) {}

  private calculateTotalHours(intervals: ShiftIntervalDto[]): number {
    const totalMinutes = intervals.reduce((acc, interval) => {
      const start = parse(interval.startTime, 'HH:mm', new Date());
      const end = parse(interval.endTime, 'HH:mm', new Date());
      return acc + differenceInMinutes(end, start);
    }, 0);
    return totalMinutes / 60;
  }

  async create(salonId: string, dto: CreateShiftDto) {
    const totalHours = this.calculateTotalHours(dto.intervals);
    const shift = await this.prisma.shift.create({
      data: {
        salonId,
        employeeId: dto.employeeId,
        date: new Date(dto.date),
        totalHours,
        intervals: { create: dto.intervals },
      },
      include: { intervals: true },
    });
    await this.clearCache(salonId);
    return shift;
  }

  async findAll(salonId: string, employeeId?: string, page = 1, limit = 5) {
    const cacheKey = `${this.CACHE_PREFIX}:${salonId}:${employeeId || 'all'}:${page}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const skip = (page - 1) * limit;
    const where = { salonId, ...(employeeId && { employeeId }) };

    const [data, total, aggregate] = await Promise.all([
      this.prisma.shift.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: 'desc' },
        include: {
          intervals: true,
          employee: {
            select: { user: { select: { firstName: true, lastName: true } } },
          },
        },
      }),
      this.prisma.shift.count({ where }),
      this.prisma.shift.aggregate({ where, _sum: { totalHours: true } }),
    ]);

    const result = {
      success: true,
      data,
      totalHoursSum: Number(aggregate._sum.totalHours || 0),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };

    await this.redis.set(
      cacheKey,
      JSON.stringify(result),
      'EX',
      REDIS_DEFAULT_TTL,
    );
    return result;
  }

  async update(id: string, salonId: string, dto: UpdateShiftDto) {
    const totalHours = this.calculateTotalHours(dto.intervals);
    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.shiftInterval.deleteMany({ where: { shiftId: id } });
      return tx.shift.update({
        where: { id, salonId },
        data: {
          date: new Date(dto.date),
          totalHours,
          intervals: { create: dto.intervals },
        },
        include: { intervals: true },
      });
    });
    await this.clearCache(salonId);
    return updated;
  }

  async findOne(id: string, salonId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: { id, salonId },
      include: { intervals: true },
    });
    if (!shift) throw new NotFoundException('Shift not found');
    return shift;
  }

  async remove(id: string, salonId: string) {
    // Verify existence and ownership first
    const shift = await this.prisma.shift.findFirst({
      where: { id, salonId },
    });

    if (!shift) {
      throw new NotFoundException(
        `Shift with ID ${id} not found in this salon`,
      );
    }

    await this.prisma.shift.delete({
      where: { id },
    });

    await this.clearCache(salonId);

    return { success: true, message: 'Shift deleted successfully' };
  }

  private async clearCache(salonId: string) {
    const keys = await this.redis.keys(`${this.CACHE_PREFIX}:${salonId}:*`);
    if (keys.length > 0) await this.redis.del(...keys);
  }
}
