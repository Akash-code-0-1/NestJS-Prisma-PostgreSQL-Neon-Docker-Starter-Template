/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';

@Injectable()
export class SalonsService {
  constructor(private prisma: PrismaService) {}

  // CREATE
  async create(dto: CreateSalonDto) {
    const { owners, ...salonData } = dto;

    return this.prisma.$transaction(async (tx) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      const existing = await tx.salon.findFirst({
        where: { OR: [{ vtaNumber: dto.vtaNumber }, { email: dto.email }] },
      });
      if (existing) throw new ConflictException('VTA or Email already exists');

      return tx.salon.create({
        data: {
          ...salonData,
          ...(owners && owners.length > 0
            ? { owners: { create: owners } }
            : {}),
        },
        include: { owners: true },
      });
    });
  }

  // GET ALL (paginated)
  async findAll(
    page = 1,
    limit = 10,
    search?: string, // optional search by name
  ) {
    const skip = (page - 1) * limit;

    let where = {};

    if (search) {
      where = {
        name: {
          startsWith: search, // or 'contains' if you want anywhere match
          mode: 'insensitive', // case-insensitive
        },
      };
    }

    const total = await this.prisma.salon.count({ where });
    const salons = await this.prisma.salon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { owners: true },
    });

    return {
      data: salons,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // GET ONE
  async findOne(id: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      include: { owners: true },
    });
    if (!salon) throw new NotFoundException('Salon not found');
    return salon;
  }

  // UPDATE
  async update(id: string, dto: UpdateSalonDto) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');

    // Remove owners from dto to avoid type conflict
    const { owners, ...salonData } = dto;

    return this.prisma.salon.update({
      where: { id },
      data: {
        ...salonData,
        // If you want to update owners, use a nested input:
        ...(owners && owners.length > 0
          ? { owners: { set: owners.map((o) => ({ id: o.id })) } }
          : {}),
      },
      include: { owners: true },
    });
  }

  // DELETE
  async remove(id: string) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');

    await this.prisma.salon.delete({ where: { id } });
    return { message: 'Salon deleted successfully' };
  }
}
