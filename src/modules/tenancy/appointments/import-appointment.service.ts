/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';

@Injectable()
export class AppointmentImportService {
  private readonly CACHE_PREFIX = 'staged_appointments_import:v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async stageData(salonId: string, items: any[]) {
    await this.prisma.stagedAppointment.createMany({
      data: items.map((item) => ({
        salonId,
        externalId: item.id,
        startAt: new Date(item.start_at),
        endAt: new Date(item.end_at),
        clientRef: item.client_ref,
        serviceRef: item.service_ref,
        staffRef: item.staff_ref,
        status: item.status || 'BOOKED',
        note: item.note,
      })),
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
  }

  async getStagedData(salonId: string, page = 1, limit = 10) {
    const cacheKey = `${this.CACHE_PREFIX}:${salonId}:${page}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.stagedAppointment.count({ where: { salonId } }),
      this.prisma.stagedAppointment.findMany({
        where: { salonId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const result = {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
    await this.redis.set(cacheKey, JSON.stringify(result), 60);
    return result;
  }

  // POST: Mass Approval (Save Button)
  async approveBulk(salonId: string, ids: string[]) {
    const items = await this.prisma.stagedAppointment.findMany({
      where: { id: { in: ids }, salonId },
    });

    await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.appointment.create({
          data: {
            salonId,
            clientId: item.clientRef || 'import-default',
            date: item.startAt,
            status: item.status as any,
            note: item.note,
            // Add participants/services logic here
          },
        });
      }
      // Delete from staging after moving to live
      await tx.stagedAppointment.deleteMany({ where: { id: { in: ids } } });
    });

    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
    await this.redis.flushByPrefix(`appointments:${salonId}`);
  }

  async deleteStaged(salonId: string, ids: string[]) {
    await this.prisma.stagedAppointment.deleteMany({
      where: { id: { in: ids }, salonId },
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
  }
}
