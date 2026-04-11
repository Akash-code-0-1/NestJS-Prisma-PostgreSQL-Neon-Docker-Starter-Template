import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { AppointmentStatus } from '../../modules/tenancy/appointments/dto/create-appointment.dto';

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
        action,
        status,
      },
    });
  }
}
