/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { CreateSalonDto } from './dto/create-salon.dto';
import { UpdateSalonDto } from './dto/update-salon.dto';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class SalonsService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  // CREATE SALON WITH MULTIPLE OWNERS
  async create(dto: CreateSalonDto) {
    const { owners, ...salonData } = dto;

    // Transaction for creation
    const createdSalon = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.salon.findFirst({
        where: { OR: [{ vtaNumber: dto.vtaNumber }, { email: dto.email }] },
      });
      if (existing) throw new ConflictException('VTA or Email already exists');

      const salon = await tx.salon.create({ data: salonData });

      if (owners && owners.length > 0) {
        for (const ownerDto of owners) {
          // Create user
          const user = await tx.user.create({
            data: {
              firstName: ownerDto.firstName,
              lastName: ownerDto.lastName,
              email: ownerDto.email,
              role: 'SALON_OWNER',
            },
          });

          // Create ownerProfile
          await tx.ownerProfile.create({
            data: { userId: user.id, invitationSent: false },
          });

          // Link user to salon
          await tx.salonUser.create({
            data: { userId: user.id, salonId: salon.id },
          });
        }
      }

      return salon;
    });

    // Fetch salon with owners outside transaction
    return this.prisma.salon.findUnique({
      where: { id: createdSalon.id },
      include: {
        salonUsers: { include: { user: { include: { ownerProfile: true } } } },
      },
    });
  }

  // SET OWNER PASSWORD
  async setOwnerPassword(ownerId: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: ownerId },
      include: { ownerProfile: true },
    });

    if (!user) throw new NotFoundException('Owner not found');

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create jwt payload
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // generate tokens
    const accessToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_ACCESS_SECRET,
      expiresIn: '50m',
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: process.env.JWT_REFRESH_SECRET,
      expiresIn: '7d',
    });

    const hashedRefresh = await bcrypt.hash(refreshToken, 10);

    // update user
    await this.prisma.user.update({
      where: { id: ownerId },
      data: {
        password: hashedPassword,
        refreshToken: hashedRefresh,
        isActive: true,
      },
    });

    // mark invitation used
    await this.prisma.ownerProfile.update({
      where: { userId: ownerId },
      data: { invitationSent: true },
    });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    };
  }

  // GET ALL SALONS (PAGINATED)
  async findAll(page = 1, limit = 10, search?: string) {
    const skip = (page - 1) * limit;

    const where = search
      ? { name: { startsWith: search, mode: 'insensitive' } }
      : {};

    const total = await this.prisma.salon.count({ where });
    const salons = await this.prisma.salon.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        salonUsers: { include: { user: { include: { ownerProfile: true } } } },
      },
    });

    return {
      data: salons,
      total,
      page,
      lastPage: Math.ceil(total / limit),
    };
  }

  // GET ONE SALON
  async findOne(id: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      include: {
        salonUsers: { include: { user: { include: { ownerProfile: true } } } },
      },
    });
    if (!salon) throw new NotFoundException('Salon not found');
    return salon;
  }

  // UPDATE SALON + OWNERS
  async update(id: string, dto: UpdateSalonDto) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');

    const { owners, ...salonData } = dto;

    const updatedSalon = await this.prisma.salon.update({
      where: { id },
      data: salonData,
    });

    if (owners && owners.length > 0) {
      for (const ownerDto of owners) {
        // Upsert owner user
        let user = await this.prisma.user.findUnique({
          where: { email: ownerDto.email },
        });
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              firstName: ownerDto.firstName,
              lastName: ownerDto.lastName,
              email: ownerDto.email,
              role: 'SALON_OWNER',
            },
          });

          await this.prisma.ownerProfile.create({
            data: { userId: user.id, invitationSent: false },
          });
        }

        // Upsert salon-user link
        await this.prisma.salonUser.upsert({
          where: { userId_salonId: { userId: user.id, salonId: id } },
          create: { userId: user.id, salonId: id },
          update: {},
        });
      }
    }

    return this.findOne(id);
  }

  // DELETE SALON
  async remove(id: string) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');

    await this.prisma.salon.delete({ where: { id } });
    return { message: 'Salon deleted successfully' };
  }
}
