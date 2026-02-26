/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Create a new Admin
  async create(dto: CreateUserDto) {
    const email = dto.email.toLowerCase();

    const existing = await this.prisma.admin.findUnique({ where: { email } });
    if (existing) throw new Error('Email already registered');

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    return this.prisma.admin.create({
      data: {
        name: dto.name,
        email,
        password: hashedPassword,
        refreshToken: null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.admin.findUnique({
      where: { email: email.toLowerCase() },
    });
  }

  async findById(id: string) {
    return this.prisma.admin.findUnique({ where: { id } });
  }

  async updateRefreshToken(adminId: string, token: string | null) {
    return this.prisma.admin.update({
      where: { id: adminId },
      data: { refreshToken: token },
    });
  }

  async findAll(page: number = 1, limit: number = 10, search: string = '') {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await this.prisma.$transaction([
      this.prisma.admin.count({ where }), // Get the total count of users
      this.prisma.admin.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
