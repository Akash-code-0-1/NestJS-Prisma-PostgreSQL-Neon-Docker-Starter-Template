/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';

@Injectable()
export class ServiceImportService {
  private readonly CACHE_PREFIX = 'staged_services_import:v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async stageData(salonId: string, items: any[]) {
    await this.prisma.stagedService.createMany({
      data: items.map((item) => ({
        salonId,
        externalId: item.id?.toString(),
        name: item.name || 'Unnamed Service',
        description: item.description,
        duration: parseInt(item.default_duration) || 0,
        price: parseFloat(item.price) || 0,
        vat: parseFloat(item.vat) || 0,
        category: item.category,
        postBreakMin: parseInt(item.post_break_min) || 0,
      })),
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
  }

  async getStagedData(salonId: string, page = 1, limit = 5) {
    const cachekey = `${this.CACHE_PREFIX}:${salonId}:${page}:${limit}`;
    const cached = await this.redis.get(cachekey);
    if (cached) return JSON.parse(cached as string);

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.stagedService.count({ where: { salonId } }),
      this.prisma.stagedService.findMany({
        where: { salonId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);
    const result = {
      data,
      meta: { total, page, lastPage: Math.ceil(total / limit) },
    };
    await this.redis.set(cachekey, JSON.stringify(result), 60);
    return result;
  }

  async approveBulk(salonId: string, ids: string[]) {
    const items = await this.prisma.stagedService.findMany({
      where: { id: { in: ids }, salonId },
    });

    if (items.length === 0) {
      throw new BadRequestException('No services found to approve');
    }

    return await this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.service.create({
          data: {
            salonId,
            serviceName: item.name,
            description: item.description,
            duration: item.duration,
            price: item.price,
            vat: item.vat,
            categories: item.category ? [item.category] : [],
            postBreakMin: item.postBreakMin,
          },
        });
      }
      await tx.stagedService.deleteMany({
        where: { id: { in: ids }, salonId },
      });

      await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
      await this.redis.flushByPrefix(`services:v1:${salonId}`);

      return {
        success: true,
        count: items.length,
        message: `${items.length} services approved and imported successfully`,
      };
    });
  }

  async deleteStaged(salonId: string, ids: string[]) {
    const result = await this.prisma.stagedService.deleteMany({
      where: { id: { in: ids }, salonId },
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
    return {
      success: true,
      count: result.count,
      message: `${result.count} staged services deleted successfully`,
    };
  }
}
