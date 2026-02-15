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

  async findAll() {
    return this.prisma.admin.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }
}
