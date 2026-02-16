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

    // 1️⃣ Create salon inside a transaction to ensure atomicity for salon itself
    const createdSalon = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.salon.findFirst({
        where: { OR: [{ vtaNumber: dto.vtaNumber }, { email: dto.email }] },
      });
      if (existing) throw new ConflictException('VTA or Email already exists');

      // Only create the salon here
      return tx.salon.create({ data: salonData });
    });

    // 2️⃣ Create owners OUTSIDE transaction to avoid timeout
    if (owners && owners.length > 0) {
      for (const ownerDto of owners) {
        // Check if user already exists
        let user = await this.prisma.user.findUnique({
          where: { email: ownerDto.email },
        });

        if (!user) {
          // Create user
          user = await this.prisma.user.create({
            data: {
              firstName: ownerDto.firstName,
              lastName: ownerDto.lastName,
              email: ownerDto.email,
              role: 'SALON_OWNER',
            },
          });

          // Create owner profile
          await this.prisma.ownerProfile.create({
            data: { userId: user.id, invitationSent: false },
          });
        }

        // Link user to salon
        await this.prisma.salonUser.upsert({
          where: {
            userId_salonId: { userId: user.id, salonId: createdSalon.id },
          },
          create: { userId: user.id, salonId: createdSalon.id },
          update: {}, // do nothing if link exists
        });
      }
    }

    // 3️⃣ Fetch salon with owners and return
    return this.prisma.salon.findUnique({
      where: { id: createdSalon.id },
      include: {
        salonUsers: {
          include: { user: { include: { ownerProfile: true } } },
        },
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

  async update(id: string, dto: UpdateSalonDto) {
    const { owners, ...salonData } = dto;

    // 1️⃣ Update the salon basic info first
    const salon = await this.prisma.salon.update({
      where: { id },
      data: salonData,
    });

    if (!salon) throw new NotFoundException('Salon not found');

    // 2️⃣ Update or create owners outside transaction to avoid timeout
    if (owners && owners.length > 0) {
      for (const ownerDto of owners) {
        // 2a. Check if user exists
        let user = await this.prisma.user.findUnique({
          where: { email: ownerDto.email },
        });

        // 2b. Create user if not exists
        if (!user) {
          user = await this.prisma.user.create({
            data: {
              firstName: ownerDto.firstName,
              lastName: ownerDto.lastName,
              email: ownerDto.email,
              role: 'SALON_OWNER',
            },
          });

          // Create owner profile
          await this.prisma.ownerProfile.create({
            data: { userId: user.id, invitationSent: false },
          });
        }

        // 2c. Upsert salon-user link
        await this.prisma.salonUser.upsert({
          where: { userId_salonId: { userId: user.id, salonId: id } },
          create: { userId: user.id, salonId: id, role: 'SALON_OWNER' },
          update: { role: 'SALON_OWNER' }, // keep role updated
        });
      }
    }

    // 3️⃣ Return updated salon with all owners
    return this.prisma.salon.findUnique({
      where: { id: salon.id },
      include: {
        salonUsers: { include: { user: { include: { ownerProfile: true } } } },
      },
    });
  }

  // DELETE SALON
  async remove(id: string) {
    const salon = await this.prisma.salon.findUnique({ where: { id } });
    if (!salon) throw new NotFoundException('Salon not found');

    await this.prisma.salon.delete({ where: { id } });
    return { message: 'Salon deleted successfully' };
  }
}
