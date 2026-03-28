import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateContactDto } from './dto/contact.dto';

@Injectable()
export class ContactService {
  constructor(private readonly prisma: PrismaService) {}

  async create(salonId: string, dto: CreateContactDto, userId: string | null) {
    try {
      // 1. Check if salon exists
      const salonExists = await this.prisma.salon.findUnique({
        where: { id: salonId },
      });

      if (!salonExists) {
        throw new HttpException('Salon not found', HttpStatus.NOT_FOUND);
      }

      // 2. Create the message
      return await this.prisma.contactMessage.create({
        data: {
          salonId,
          userId: userId ? String(userId) : null, // Prisma handles null better as undefined or explicit null
          name: dto.name,
          email: dto.email,
          subject: dto.subject,
          message: dto.message,
        },
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;

      console.error('DEBUG PRISMA ERROR:', error);
      throw new HttpException(
        'Failed to send message. Please check the Salon ID.',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async findAll(salonId: string) {
    return this.prisma.contactMessage.findMany({
      where: { salonId },
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
