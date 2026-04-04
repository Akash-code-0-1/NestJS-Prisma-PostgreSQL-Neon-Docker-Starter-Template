/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';

import { CreateTestimonialDto } from './dto/create-testimonial.dto';
import { UpdateTestimonialDto } from './dto/update-testimonial.dto';

import { TESTIMONIAL_CACHE_PREFIX } from '../../../../core/redis/redis.constants';

@Injectable()
export class TestimonialService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private cacheKey(salonId: string) {
    return `${TESTIMONIAL_CACHE_PREFIX}:${salonId}`;
  }

  async create(salonId: string, userId: string, dto: CreateTestimonialDto) {
    const testimonial = await this.prisma.testimonial.create({
      data: {
        salonId,
        userId,
        comment: dto.comment,
        rating: dto.rating,
      },
    });

    await this.redis.delete(this.cacheKey(salonId));
    return testimonial;
  }

  async findAll(salonId: string) {
    const cacheKey = this.cacheKey(salonId);
    const cached = await this.redis.get(cacheKey);

    if (cached) return cached;

    const testimonials = await this.prisma.testimonial.findMany({
      where: { salonId },
      include: {
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(cacheKey, testimonials);
    return testimonials;
  }

  async findOne(id: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!testimonial) throw new NotFoundException('Testimonial not found');
    return testimonial;
  }

  async update(
    id: string,
    salonId: string,
    dto: UpdateTestimonialDto,
    userId: string,
  ) {
    const existing = await this.prisma.testimonial.findUnique({
      where: { id },
    });
    if (!existing) throw new NotFoundException('Testimonial not found');
    if (existing.userId !== userId) throw new ForbiddenException('Not allowed');

    const testimonial = await this.prisma.testimonial.update({
      where: { id },
      data: dto,
    });

    await this.redis.delete(this.cacheKey(salonId));
    return testimonial;
  }

  async remove(salonId: string, testimonialId: string, userId: string) {
    const testimonial = await this.prisma.testimonial.findUnique({
      where: { id: testimonialId },
    });

    if (!testimonial) {
      throw new NotFoundException('Testimonial not found');
    }

    if (testimonial.salonId !== salonId) {
      throw new ForbiddenException('Not allowed');
    }

    if (testimonial.userId !== userId) {
      throw new ForbiddenException('Not allowed');
    }

    await this.prisma.testimonial.delete({
      where: { id: testimonialId },
    });

    return { message: 'Deleted successfully' };
  }
}
