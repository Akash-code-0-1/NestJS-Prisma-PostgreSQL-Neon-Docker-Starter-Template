/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Prisma } from '@prisma/client'; // keep this
import { Decimal } from '@prisma/client/runtime/library';

const APPOINTMENT_CACHE_PREFIX = 'appointments';

@Injectable()
export class AppointmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(salonId: string) {
    return `${APPOINTMENT_CACHE_PREFIX}:${salonId}`;
  }

  async create(salonId: string, dto: CreateAppointmentDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // ✅ 1. Create appointment
        const appointment = await tx.appointment.create({
          data: {
            salonId,
            clientId: dto.clientId,
            date: new Date(dto.date),
            note: dto.note,
          },
        });

        // ✅ 2. Participants + services
        for (const p of dto.participants) {
          const participant = await tx.participant.create({
            data: {
              appointmentId: appointment.id,
              userId: p.userId,
              name: p.name,
            },
          });

          for (const s of p.services) {
            await tx.appointmentService.create({
              data: {
                participantId: participant.id,
                serviceId: s.serviceId,
                employeeId: s.employeeId,
                priceAtBooking: new Decimal(s.priceAtBooking), // ✅ fixed
                startAt: new Date(s.startAt),
                endAt: new Date(s.endAt),
              },
            });
          }
        }

        // ✅ 3. Payment (if exists)
        if (dto.payment) {
          await tx.payment.create({
            data: {
              appointmentId: appointment.id,
              amount: new Decimal(dto.payment.amount), // ✅ fixed
              discount: new Decimal(dto.payment.discount || 0), // ✅ fixed
              tax: new Decimal(dto.payment.tax || 0), // ✅ fixed
              total: new Decimal(dto.payment.total), // ✅ fixed
              method: dto.payment.method,
            },
          });
        }

        // ✅ 4. Return full object
        return tx.appointment.findUnique({
          where: { id: appointment.id },
          include: {
            participants: {
              include: {
                services: true,
              },
            },
            payment: true,
          },
        });
      });

      // ✅ cache clear AFTER success
      await this.redis.flushByPrefix(APPOINTMENT_CACHE_PREFIX);

      return result;
    } catch (error) {
      console.error(error);
      throw new HttpException('Transaction failed', HttpStatus.BAD_REQUEST);
    }
  }

  // ✅ GET ALL

  async findAll(salonId: string) {
    console.log('this.prisma:', this.prisma);
    console.log('appointment model:', (this.prisma as any)?.appointment);
    const key = this.cacheKey(salonId);

    const cached = await this.redis.get(key);
    if (cached) return cached;

    const data = await this.prisma.appointment.findMany({
      where: { salonId },
      include: {
        client: true,
        participants: {
          include: {
            services: {
              include: {
                service: true,
                employee: true,
              },
            },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(key, data, 60);
    return data;
  }

  async findOne(id: string) {
    const data = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        client: true,
        participants: {
          include: {
            services: {
              include: {
                service: true,
                employee: true,
              },
            },
          },
        },
        payment: true,
      },
    });

    if (!data) {
      throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    }

    return data;
  }

  async remove(id: string) {
    await this.prisma.appointment.delete({
      where: { id },
    });

    await this.redis.flushByPrefix(APPOINTMENT_CACHE_PREFIX);

    return { message: 'Deleted' };
  }
}
