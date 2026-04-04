// /* eslint-disable @typescript-eslint/no-base-to-string */
// /* eslint-disable @typescript-eslint/no-unsafe-member-access */
// /* eslint-disable @typescript-eslint/no-unsafe-return */
// /* eslint-disable @typescript-eslint/no-unsafe-assignment */
// import { Injectable } from '@nestjs/common';
// import { PrismaService } from '../../../../core/prisma/prisma.service';
// import { CreateBundleDto } from './dto/create-bundle.dto';
// import { BUNDLE_CACHE_PREFIX } from 'src/core/redis/redis.constants';
// import { RedisService } from 'src/core/redis/redis.service';
// import { HttpException, HttpStatus } from '@nestjs/common';

// @Injectable()
// export class BundlesService {
//   constructor(
//     private readonly prisma: PrismaService,
//     private readonly redisService: RedisService,
//   ) {}

//   private async calculateDuration(
//     serviceIds: string[],
//     scheduleType: string,
//   ): Promise<number> {
//     const services = await this.prisma.service.findMany({
//       where: { id: { in: serviceIds } },
//       select: { duration: true },
//     });

//     if (scheduleType === 'BOOKED_IN_SEQUENCE') {
//       return services.reduce((acc, s) => acc + s.duration, 0);
//     }
//     return Math.max(...services.map((s) => s.duration), 0);
//   }

//   async create(salonId: string, dto: CreateBundleDto) {
//     const duration = await this.calculateDuration(
//       dto.serviceIds,
//       dto.scheduleType,
//     );

//     const bundle = await this.prisma.$transaction(async (tx) => {
//       return tx.bundle.create({
//         data: {
//           salonId,
//           name: dto.name,
//           category: dto.category,
//           description: dto.description,
//           priceType: dto.priceType,
//           price: dto.price,
//           duration,
//           scheduleType: dto.scheduleType,
//           addToOnlineBook: dto.addToOnlineBook,
//           services: { create: dto.serviceIds.map((id) => ({ serviceId: id })) },
//           members: {
//             create: dto.employeeIds.map((id) => ({ employeeId: id })),
//           },
//         },
//       });
//     });

//     await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);
//     return bundle;
//   }

//   async findAll(salonId: string, query: any) {
//     const { page = 1, limit = 10, search, category } = query;
//     const cacheKey = `${BUNDLE_CACHE_PREFIX}:${salonId}:p:${page}:l:${limit}:s:${search}:c:${category}`;

//     const cached = await this.redisService.get(cacheKey);
//     if (cached) return JSON.parse(cached.toString());

//     const where: any = { salonId, isActive: true };
//     if (search) where.name = { contains: search, mode: 'insensitive' };
//     if (category) where.category = category;

//     const [total, data] = await this.prisma.$transaction([
//       this.prisma.bundle.count({ where }),
//       this.prisma.bundle.findMany({
//         where,
//         skip: (Number(page) - 1) * Number(limit),
//         take: Number(limit),
//         include: {
//           _count: { select: { services: true, members: true } },
//         },
//         orderBy: { createdAt: 'desc' },
//       }),
//     ]);

//     const res = {
//       data,
//       meta: { total, page: Number(page), limit: Number(limit) },
//     };
//     await this.redisService.set(cacheKey, JSON.stringify(res), 3600);
//     return res;
//   }

//   async findOne(id: string, salonId: string) {
//     const bundle = await this.prisma.bundle.findFirst({
//       where: { id, salonId, isActive: true },
//       include: {
//         services: { include: { service: true } },
//         members: { include: { employee: { include: { user: true } } } },
//       },
//     });
//     if (!bundle)
//       throw new HttpException('Bundle not found', HttpStatus.NOT_FOUND);
//     return bundle;
//   }

//   async update(id: string, salonId: string, dto: CreateBundleDto) {
//     await this.findOne(id, salonId); // Ensure exists
//     const duration = await this.calculateDuration(
//       dto.serviceIds,
//       dto.scheduleType,
//     );

//     const updated = await this.prisma.$transaction(async (tx) => {
//       await tx.bundleService.deleteMany({ where: { bundleId: id } });
//       await tx.bundleMember.deleteMany({ where: { bundleId: id } });

//       return tx.bundle.update({
//         where: { id },
//         data: {
//           name: dto.name,
//           category: dto.category,
//           description: dto.description,
//           priceType: dto.priceType,
//           price: dto.price,
//           duration,
//           scheduleType: dto.scheduleType,
//           addToOnlineBook: dto.addToOnlineBook,
//           services: {
//             create: dto.serviceIds.map((sId) => ({ serviceId: sId })),
//           },
//           members: {
//             create: dto.employeeIds.map((eId) => ({ employeeId: eId })),
//           },
//         },
//       });
//     });

//     await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);
//     return updated;
//   }

//   async remove(id: string, salonId: string) {
//     // 1. Verify ownership and existence
//     const bundle = await this.prisma.bundle.findFirst({
//       where: { id, salonId },
//     });

//     if (!bundle) {
//       throw new HttpException(
//         'Bundle not found or unauthorized',
//         HttpStatus.NOT_FOUND,
//       );
//     }

//     // 2. Perform deletion in a transaction
//     await this.prisma.$transaction(async (tx) => {
//       // Delete junction table entries first
//       await tx.bundleService.deleteMany({ where: { bundleId: id } });
//       await tx.bundleMember.deleteMany({ where: { bundleId: id } });

//       // Delete the actual bundle
//       await tx.bundle.delete({ where: { id } });
//     });

//     // 3. Invalidate Cache
//     await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);

//     return {
//       success: true,
//       message: 'Bundle and all associated relations deleted permanently',
//     };
//   }
// }

/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { CreateBundleDto } from './dto/create-bundle.dto';
import { BUNDLE_CACHE_PREFIX } from 'src/core/redis/redis.constants';
import { RedisService } from 'src/core/redis/redis.service';
import { $Enums } from '@prisma/client'; // ✅ FIX

@Injectable()
export class BundlesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private async calculateDuration(
    serviceIds: string[],
    scheduleType: string,
  ): Promise<number> {
    const services = await this.prisma.service.findMany({
      where: { id: { in: serviceIds } },
      select: { duration: true },
    });

    if (scheduleType === 'BOOKED_IN_SEQUENCE') {
      return services.reduce((acc, s) => acc + s.duration, 0);
    }

    return Math.max(...services.map((s) => s.duration), 0);
  }

  async create(salonId: string, dto: CreateBundleDto) {
    const duration = await this.calculateDuration(
      dto.serviceIds,
      dto.scheduleType,
    );

    const bundle = await this.prisma.$transaction(async (tx) => {
      return tx.bundle.create({
        data: {
          salonId,
          name: dto.name,

          // ✅ FIXED ENUMS
          category: dto.category as unknown as $Enums.BundleCategory,
          priceType: dto.priceType as unknown as $Enums.BundlePriceType,
          scheduleType:
            dto.scheduleType as unknown as $Enums.BundleScheduleType,

          description: dto.description,
          price: dto.price,
          duration,
          addToOnlineBook: dto.addToOnlineBook,

          services: {
            create: dto.serviceIds.map((id) => ({ serviceId: id })),
          },
          members: {
            create: dto.employeeIds.map((id) => ({ employeeId: id })),
          },
        },
      });
    });

    await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);
    return bundle;
  }

  async findAll(salonId: string, query: any) {
    const { page = 1, limit = 10, search, category } = query;

    const cacheKey = `${BUNDLE_CACHE_PREFIX}:${salonId}:p:${page}:l:${limit}:s:${search}:c:${category}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached.toString());

    const where: any = {
      salonId,
      isActive: true,
    };

    if (search) {
      where.name = {
        contains: search,
        mode: 'insensitive',
      };
    }

    if (category) {
      where.category = category as unknown as $Enums.BundleCategory;
    }

    const [total, data] = await this.prisma.$transaction([
      this.prisma.bundle.count({ where }),
      this.prisma.bundle.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: {
          _count: {
            select: {
              services: true,
              members: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const res = {
      data,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(res), 3600);
    return res;
  }

  async findOne(id: string, salonId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, salonId, isActive: true },
      include: {
        services: { include: { service: true } },
        members: {
          include: {
            employee: {
              include: { user: true },
            },
          },
        },
      },
    });

    if (!bundle) {
      throw new HttpException('Bundle not found', HttpStatus.NOT_FOUND);
    }

    return bundle;
  }

  async update(id: string, salonId: string, dto: CreateBundleDto) {
    await this.findOne(id, salonId);

    const duration = await this.calculateDuration(
      dto.serviceIds,
      dto.scheduleType,
    );

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.bundleService.deleteMany({
        where: { bundleId: id },
      });

      await tx.bundleMember.deleteMany({
        where: { bundleId: id },
      });

      return tx.bundle.update({
        where: { id },
        data: {
          name: dto.name,

          // ✅ FIXED ENUMS
          category: dto.category as unknown as $Enums.BundleCategory,
          priceType: dto.priceType as unknown as $Enums.BundlePriceType,
          scheduleType:
            dto.scheduleType as unknown as $Enums.BundleScheduleType,

          description: dto.description,
          price: dto.price,
          duration,
          addToOnlineBook: dto.addToOnlineBook,

          services: {
            create: dto.serviceIds.map((sId) => ({
              serviceId: sId,
            })),
          },

          members: {
            create: dto.employeeIds.map((eId) => ({
              employeeId: eId,
            })),
          },
        },
      });
    });

    await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);
    return updated;
  }

  async remove(id: string, salonId: string) {
    const bundle = await this.prisma.bundle.findFirst({
      where: { id, salonId },
    });

    if (!bundle) {
      throw new HttpException(
        'Bundle not found or unauthorized',
        HttpStatus.NOT_FOUND,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.bundleService.deleteMany({
        where: { bundleId: id },
      });

      await tx.bundleMember.deleteMany({
        where: { bundleId: id },
      });

      await tx.bundle.delete({
        where: { id },
      });
    });

    await this.redisService.flushByPrefix(`${BUNDLE_CACHE_PREFIX}:${salonId}`);

    return {
      success: true,
      message: 'Bundle and all associated relations deleted permanently',
    };
  }
}
