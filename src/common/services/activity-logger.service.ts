import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class ActivityLoggerService {
  constructor(private prisma: PrismaService) {}

  async logAppointment(
    salonId: string,
    appointmentId: string,
    userId: string,
    action: string,
    status: AppointmentStatus,
  ) {
    return await this.prisma.appointmentLog.create({
      data: {
        salonId,
        appointmentId,
        userId,
        action, // e.g., "Receipt Printed"
        status,
      },
    });
  }
}
