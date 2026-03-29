// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-call */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
// import { PrismaService } from '../../../core/prisma/prisma.service';
// import { RedisService } from '../../../core/redis/redis.service';
// import { CreateAppointmentDto } from './dto/create-appointment.dto';
// import { AppointmentStatus, Prisma } from '@prisma/client';
// import { Decimal } from '@prisma/client/runtime/library';
// import dayjs from 'dayjs';

// const APPOINTMENT_CACHE_PREFIX = 'appointments';

// @Injectable()
// export class AppointmentService {
//   private readonly logger = new Logger(AppointmentService.name);

//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly redis: RedisService,
//   ) {}

//   async create(salonId: string, dto: CreateAppointmentDto) {
//     try {
//       const result = await this.prisma.$transaction(async (tx) => {
//         // 1. Create main appointment
//         const appointment = await tx.appointment.create({
//           data: {
//             salonId,
//             clientId: dto.clientId,
//             date: new Date(dto.date),
//             note: dto.note,
//             status: dto.status || AppointmentStatus.BOOKED,
//           },
//         });

//         // 2. Handle Participants and Services
//         if (dto.participants) {
//           for (const p of dto.participants) {
//             const participant = await tx.participant.create({
//               data: {
//                 appointmentId: appointment.id,
//                 userId: p.userId,
//                 name: p.name,
//               },
//             });

//             for (const s of p.services) {
//               await tx.appointmentService.create({
//                 data: {
//                   participantId: participant.id,
//                   serviceId: s.serviceId,
//                   employeeId: s.employeeId,
//                   priceAtBooking: new Decimal(s.priceAtBooking),
//                   startAt: new Date(s.startAt),
//                   endAt: new Date(s.endAt),
//                 },
//               });
//             }
//           }
//         }

//         // 3. Handle Payment
//         if (dto.payment) {
//           await tx.payment.create({
//             data: {
//               appointmentId: appointment.id,
//               amount: new Decimal(dto.payment.amount),
//               discount: new Decimal(dto.payment.discount || 0),
//               tax: new Decimal(dto.payment.tax || 0),
//               total: new Decimal(dto.payment.total),
//               method: dto.payment.method,
//             },
//           });
//         }

//         return appointment;
//       });

//       await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
//       return result;
//     } catch (error) {
//       this.logger.error(error);
//       throw new HttpException(
//         'Failed to create appointment',
//         HttpStatus.BAD_REQUEST,
//       );
//     }
//   }

//   async findAll(
//     salonId: string,
//     query: {
//       status?: AppointmentStatus;
//       view?: 'day' | 'week' | 'month';
//       date?: string;
//       search?: string;
//       page?: number; // New
//       limit?: number; // New
//     },
//   ) {
//     const { status, view, date, search } = query;

//     // Default pagination values
//     const page = Number(query.page) || 1;
//     const limit = Number(query.limit) || 10;
//     const skip = (page - 1) * limit;

//     const cacheKey = `${APPOINTMENT_CACHE_PREFIX}:${salonId}:${JSON.stringify(query)}`;
//     const cached = await this.redis.get(cacheKey);
//     if (cached) return cached;

//     // 1. Build the Where Clause
//     const where: Prisma.AppointmentWhereInput = {
//       salonId,
//       ...(status && { status }),
//     };

//     if (date) {
//       const targetDate = dayjs(date);
//       let start = targetDate.startOf('day').toDate();
//       let end = targetDate.endOf('day').toDate();

//       if (view === 'week') {
//         start = targetDate.startOf('week').toDate();
//         end = targetDate.endOf('week').toDate();
//       } else if (view === 'month') {
//         start = targetDate.startOf('month').toDate();
//         end = targetDate.endOf('month').toDate();
//       }
//       where.date = { gte: start, lte: end };
//     }

//     if (search) {
//       where.OR = [
//         { client: { firstName: { contains: search, mode: 'insensitive' } } },
//         { client: { lastName: { contains: search, mode: 'insensitive' } } },
//       ];
//     }

//     // 2. Execute Count and FindMany in parallel for better performance
//     const [total, data] = await Promise.all([
//       this.prisma.appointment.count({ where }),
//       this.prisma.appointment.findMany({
//         where,
//         skip,
//         take: limit,
//         include: {
//           client: {
//             select: {
//               firstName: true,
//               lastName: true,
//               profilePicture: true,
//               email: true,
//             },
//           },
//           participants: {
//             include: {
//               services: {
//                 include: {
//                   service: { select: { serviceName: true } },
//                   employee: {
//                     include: { user: { select: { firstName: true } } },
//                   },
//                 },
//               },
//             },
//           },
//           payment: true,
//         },
//         orderBy: { date: 'asc' },
//       }),
//     ]);

//     const result = {
//       data,
//       meta: {
//         total,
//         page,
//         lastPage: Math.ceil(total / limit),
//         limit,
//       },
//     };

//     await this.redis.set(cacheKey, result, 120);
//     return result;
//   }

//   async update(
//     id: string,
//     salonId: string,
//     dto: Partial<CreateAppointmentDto>,
//   ) {
//     try {
//       const result = await this.prisma.appointment.update({
//         where: { id, salonId },
//         data: {
//           ...(dto.date && { date: new Date(dto.date) }),
//           ...(dto.note !== undefined && { note: dto.note }),
//           ...(dto.status && { status: dto.status }),
//         },
//         include: {
//           client: true,
//           participants: { include: { services: true } },
//           payment: true,
//         },
//       });

//       await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
//       return result;
//     } catch (error) {
//       this.logger.error(error);
//       throw new HttpException(
//         'Update failed',
//         HttpStatus.INTERNAL_SERVER_ERROR,
//       );
//     }
//   }

//   async findOne(id: string, salonId: string) {
//     const data = await this.prisma.appointment.findFirst({
//       where: { id, salonId },
//       include: {
//         client: true,
//         participants: {
//           include: {
//             services: {
//               include: { service: true, employee: { include: { user: true } } },
//             },
//           },
//         },
//         payment: true,
//       },
//     });
//     if (!data) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
//     return data;
//   }

//   async remove(id: string, salonId: string) {
//     await this.prisma.appointment.delete({ where: { id, salonId } });
//     await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
//     return { success: true };
//   }
// }

/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import {
  CreateAppointmentDto,
  AppointmentStatus,
} from './dto/create-appointment.dto';
import { Decimal } from '@prisma/client/runtime/library';
import dayjs from 'dayjs';

const APPOINTMENT_CACHE_PREFIX = 'appointments';

@Injectable()
export class AppointmentService {
  private readonly logger = new Logger(AppointmentService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ---------------------- LOG FUNCTION ----------------------
  private async log(
    tx: any,
    appointmentId: string,
    action: string,
    status: AppointmentStatus,
    userId?: string,
  ) {
    await tx.appointmentLog.create({
      data: {
        appointmentId,
        action,
        status,
        userId,
      },
    });
  }

  // -------------------------------------------------------------------------
  // CREATE
  // -------------------------------------------------------------------------
  async create(salonId: string, dto: CreateAppointmentDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const appointment = await tx.appointment.create({
          data: {
            salonId,
            clientId: dto.clientId,
            date: new Date(dto.date),
            note: dto.note,
            status: (dto.status || AppointmentStatus.BOOKED) as any,
          },
        });

        // ✅ LOG CREATED
        await this.log(
          tx,
          appointment.id,
          'CREATED',
          dto.status || AppointmentStatus.BOOKED,
          dto.clientId,
        );

        // ---------------- PARTICIPANTS ----------------
        if (dto.participants) {
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
                  priceAtBooking: new Decimal(s.priceAtBooking),
                  startAt: new Date(s.startAt),
                  endAt: new Date(s.endAt),
                },
              });
            }
          }
        }

        // ---------------- PAYMENT ----------------
        if (dto.payment) {
          await tx.payment.create({
            data: {
              appointmentId: appointment.id,
              amount: new Decimal(dto.payment.amount),
              discount: new Decimal(dto.payment.discount || 0),
              tax: new Decimal(dto.payment.tax || 0),
              total: new Decimal(dto.payment.total),
              method: dto.payment.method as any,
            },
          });

          // ✅ Update appointment status to PAID
          await tx.appointment.update({
            where: { id: appointment.id },
            data: { status: AppointmentStatus.PAID as any },
          });

          // ✅ Log payment
          await this.log(
            tx,
            appointment.id,
            'PAYMENT_COMPLETED',
            AppointmentStatus.PAID,
            dto.clientId,
          );
        }

        return appointment;
      });

      await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Failed to create appointment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // -------------------------------------------------------------------------
  // FIND ALL
  // -------------------------------------------------------------------------
  async findAll(
    salonId: string,
    query: {
      status?: AppointmentStatus;
      view?: 'day' | 'week' | 'month';
      date?: string;
      search?: string;
      page?: number;
      limit?: number;
    },
  ) {
    const { status, view, date, search } = query;
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const skip = (page - 1) * limit;

    const cacheKey = `${APPOINTMENT_CACHE_PREFIX}:${salonId}:${JSON.stringify(query)}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return cached;

    const where: any = {
      salonId,
      ...(status && { status: status as any }),
    };

    if (date) {
      const targetDate = dayjs(date);
      let start = targetDate.startOf('day').toDate();
      let end = targetDate.endOf('day').toDate();

      if (view === 'week') {
        start = targetDate.startOf('week').toDate();
        end = targetDate.endOf('week').toDate();
      } else if (view === 'month') {
        start = targetDate.startOf('month').toDate();
        end = targetDate.endOf('month').toDate();
      }

      where.date = { gte: start, lte: end };
    }

    if (search) {
      where.OR = [
        { client: { firstName: { contains: search, mode: 'insensitive' } } },
        { client: { lastName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.appointment.count({ where }),
      this.prisma.appointment.findMany({
        where,
        skip,
        take: limit,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
              profilePicture: true,
              email: true,
            },
          },
          participants: {
            include: {
              services: {
                include: {
                  service: { select: { serviceName: true } },
                  employee: {
                    include: { user: { select: { firstName: true } } },
                  },
                },
              },
            },
          },
          payment: true,
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    const result = {
      data,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
        limit,
      },
    };

    await this.redis.set(cacheKey, result, 120);
    return result;
  }

  // -------------------------------------------------------------------------
  // UPDATE
  // -------------------------------------------------------------------------
  async update(
    id: string,
    salonId: string,
    dto: Partial<CreateAppointmentDto>,
  ) {
    try {
      const result = await this.prisma.appointment.update({
        where: { id, salonId },
        data: {
          ...(dto.date && { date: new Date(dto.date) }),
          ...(dto.note !== undefined && { note: dto.note }),
          ...(dto.status && { status: dto.status as any }),
        },
        include: {
          client: true,
          participants: { include: { services: true } },
          payment: true,
        },
      });

      // ✅ LOG UPDATED
      await this.prisma.appointmentLog.create({
        data: {
          appointmentId: id,
          action: 'UPDATED',
          status: (dto.status as any) || result.status,
        },
      });

      if (dto.status) {
        await this.prisma.appointmentLog.create({
          data: {
            appointmentId: id,
            action: 'STATUS_CHANGED',
            status: dto.status,
          },
        });
      }

      await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
      return result;
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Update failed',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  // -------------------------------------------------------------------------
  // FIND ONE
  // -------------------------------------------------------------------------
  async findOne(id: string, salonId: string) {
    const data = await this.prisma.appointment.findFirst({
      where: { id, salonId },
      include: {
        client: true,
        participants: {
          include: {
            services: {
              include: { service: true, employee: { include: { user: true } } },
            },
          },
        },
        payment: true,
      },
    });
    if (!data) throw new HttpException('Not found', HttpStatus.NOT_FOUND);
    return data;
  }

  // -------------------------------------------------------------------------
  // REMOVE
  // -------------------------------------------------------------------------
  async remove(id: string, salonId: string) {
    await this.prisma.appointment.delete({ where: { id, salonId } });

    // ✅ LOG DELETED
    await this.prisma.appointmentLog.create({
      data: {
        appointmentId: id,
        action: 'DELETED',
        status: AppointmentStatus.CANCELLED,
      },
    });

    await this.redis.flushByPrefix(`${APPOINTMENT_CACHE_PREFIX}:${salonId}`);
    return { success: true };
  }

  // -------------------------------------------------------------------------
  // GET LOGS
  // -------------------------------------------------------------------------
  async getLogs(appointmentId: string, salonId: string) {
    try {
      return await this.prisma.appointmentLog.findMany({
        where: {
          appointmentId,
          appointment: { salonId },
        },
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Failed to fetch logs',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
