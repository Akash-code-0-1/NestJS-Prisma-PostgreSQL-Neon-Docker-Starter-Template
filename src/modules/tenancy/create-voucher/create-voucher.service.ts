/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class VoucherService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private key(salonId: string) {
    return `vouchers:${salonId}`;
  }

  async create(salonId: string, dto: CreateVoucherDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    const voucher = await this.prisma.voucher.create({
      data: {
        salonId,
        title: dto.title,
        subtitle: dto.subtitle,
        value: new Decimal(dto.value),
        price: new Decimal(dto.price),
        discountPercent: dto.discountPercent,
        description: dto.description,
        validityDays: dto.validityDays,
        imageUrl: dto.imageUrl,
        theme: dto.theme,
        isActive: dto.isActive ?? true,
      },
    });

    await this.redis.flushByPrefix('vouchers');
    return voucher;
  }

  async findAll(
    salonId: string,
    search?: string,
    limit = 10,
    offset = 0,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    const key = `${this.key(salonId)}:${search}:${limit}:${offset}`;

    const cached = await this.redis.get(key);
    if (cached) return cached;

    const data = await this.prisma.voucher.findMany({
      where: {
        salonId,
        isActive: true,
        OR: search
          ? [
              { title: { contains: search, mode: 'insensitive' } },
              { theme: { contains: search, mode: 'insensitive' } },
            ]
          : undefined,
      },
      take: +limit,
      skip: +offset,
      orderBy: { [sortBy]: order },
    });

    await this.redis.set(key, data, 60);
    return data;
  }
}
