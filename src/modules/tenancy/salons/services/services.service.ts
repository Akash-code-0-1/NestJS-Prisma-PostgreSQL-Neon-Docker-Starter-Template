/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';
import { SERVICE_CACHE_PREFIX } from '../../../../core/redis/redis.constants';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(salonId: string): string {
    return `${SERVICE_CACHE_PREFIX}:${salonId}`;
  }

  // ✅ Create service
  async create(salonId: string, dto: CreateServiceDto) {
    try {
      // Filter valid employees first to avoid FK errors
      const validEmployees = dto.employeeIds
        ? await this.prisma.employeeProfile.findMany({
            where: { id: { in: dto.employeeIds } },
            select: { id: true },
          })
        : [];

      const service = await this.prisma.service.create({
        data: {
          salonId,
          serviceName: dto.serviceName,
          categories: dto.categories,
          duration: dto.duration,
          postBreakMin: dto.postBreakMin,
          price: new Prisma.Decimal(dto.price),
          vat: new Prisma.Decimal(dto.vat),
          description: dto.description,
          icon: dto.icon,
          employees: {
            create: validEmployees.map((emp) => ({ employeeId: emp.id })),
          },
        },
      });

      await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
      return service;
    } catch (error: unknown) {
      console.error(error);
      throw new HttpException(
        'Failed to create service',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  // ✅ Get all services
  async findAll(salonId: string) {
    const key = this.cacheKey(salonId);
    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached as string);

    const services = await this.prisma.service.findMany({
      where: { salonId },
      include: {
        employees: {
          include: { employee: { include: { user: true } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(key, JSON.stringify(services), 60);
    return services;
  }

  // ✅ Get single service
  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        employees: { include: { employee: true } },
      },
    });

    if (!service)
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);

    return service;
  }

  // ✅ Update service
  async update(salonId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id, salonId },
    });

    if (!service)
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);

    // Optionally update employees safely
    let employeesData: any = undefined;
    if (dto.employeeIds) {
      const validEmployees = await this.prisma.employeeProfile.findMany({
        where: { id: { in: dto.employeeIds } },
        select: { id: true },
      });
      employeesData = {
        deleteMany: {}, // remove old relations
        create: validEmployees.map((emp) => ({ employeeId: emp.id })),
      };
    }

    const updated = await this.prisma.service.update({
      where: { id },
      data: {
        serviceName: dto.serviceName ?? service.serviceName,
        categories: dto.categories ?? service.categories,
        duration: dto.duration ?? service.duration,
        postBreakMin: dto.postBreakMin ?? service.postBreakMin,
        price:
          dto.price !== undefined
            ? new Prisma.Decimal(dto.price)
            : service.price,
        vat: dto.vat !== undefined ? new Prisma.Decimal(dto.vat) : service.vat,
        description: dto.description ?? service.description,
        icon: dto.icon ?? service.icon,
        employees: employeesData,
      },
    });

    await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
    return updated;
  }

  // ✅ Delete service
  async remove(id: string) {
    await this.prisma.service.delete({ where: { id } });
    await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
    return { message: 'Service deleted successfully' };
  }
}
