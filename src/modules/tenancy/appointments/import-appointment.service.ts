/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { Injectable, BadRequestException } from '@nestjs/common';
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
        externalId: item.id?.toString(),
        startAt: new Date(item.start_at),
        endAt: new Date(item.end_at),
        clientRef: item.client_ref,
        serviceRef: item.service_ref,
        staffRef: item.staff_ref,
        status: (item.status || 'BOOKED').toUpperCase(),
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

  async approveBulk(salonId: string, ids: string[]) {
    const items = await this.prisma.stagedAppointment.findMany({
      where: { id: { in: ids }, salonId },
    });

    if (items.length === 0) {
      throw new BadRequestException('No items found to approve');
    }

    return await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        let finalClientId: string;

        // 1. Try to find existing user
        const existingUser = await tx.user.findFirst({
          where: {
            OR: [{ id: item.clientRef || '' }, { email: item.clientRef || '' }],
          },
        });

        if (existingUser) {
          finalClientId = existingUser.id;
        } else {
          // 2. Auto-generate Client using string literals for Role
          const uniqueEmail = `import.${Date.now()}.${Math.floor(Math.random() * 1000)}@salon-guest.com`;

          const newClient = await tx.user.create({
            data: {
              firstName: item.clientRef || 'Imported',
              lastName: 'Client',
              email: uniqueEmail,
              role: 'CLIENT' as any,
              isActive: true,
              salonUsers: {
                create: {
                  salonId: salonId,
                  role: 'CLIENT' as any,
                },
              },
            },
          });
          finalClientId = newClient.id;
        }

        // 3. Create Appointment using string literal for Status
        const normalizedStatus = item.status?.toUpperCase() || 'BOOKED';

        await tx.appointment.create({
          data: {
            salonId: salonId,
            clientId: finalClientId,
            date: item.startAt,
            status: normalizedStatus as any,
            note: item.note,
          },
        });
      }

      // 4. Cleanup
      await tx.stagedAppointment.deleteMany({
        where: { id: { in: ids }, salonId },
      });

      await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
      await this.redis.flushByPrefix(`appointments:${salonId}`);

      return { success: true, count: items.length };
    });
  }

  async deleteStaged(salonId: string, ids: string[]) {
    const result = await this.prisma.stagedAppointment.deleteMany({
      where: { id: { in: ids }, salonId },
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
    return result;
  }
}
