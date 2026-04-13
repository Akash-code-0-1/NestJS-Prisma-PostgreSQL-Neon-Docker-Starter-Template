/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';
import { SERVICE_CACHE_PREFIX } from '../../../../core/redis/redis.constants';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';

@Injectable()
export class ServicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  private cacheKey(salonId: string): string {
    return `${SERVICE_CACHE_PREFIX}:${salonId}`;
  }

  async create(salonId: string, dto: CreateServiceDto) {
    try {
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
          price: dto.price,
          vat: dto.vat,
          description: dto.description,
          icon: dto.icon,
          employees: {
            create: validEmployees.map((emp) => ({
              employeeId: emp.id,
            })),
          },
        },
      });

      await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
      return service;
    } catch (error) {
      console.error(error);
      throw new HttpException(
        'Failed to create service',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(salonId: string) {
    const key = this.cacheKey(salonId);

    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached as string);

    const services = await this.prisma.service.findMany({
      where: { salonId },
      include: {
        employees: {
          include: {
            employee: { include: { user: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    await this.redis.set(key, JSON.stringify(services), 60);
    return services;
  }

  async findOne(id: string) {
    const service = await this.prisma.service.findUnique({
      where: { id },
      include: {
        employees: { include: { employee: true } },
      },
    });

    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }
    return service;
  }

  async update(salonId: string, id: string, dto: UpdateServiceDto) {
    const service = await this.prisma.service.findFirst({
      where: { id, salonId },
    });

    if (!service) {
      throw new HttpException('Service not found', HttpStatus.NOT_FOUND);
    }

    let employeesData: any = undefined;
    if (dto.employeeIds) {
      const validEmployees = await this.prisma.employeeProfile.findMany({
        where: { id: { in: dto.employeeIds } },
        select: { id: true },
      });
      employeesData = {
        deleteMany: {},
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
        price: dto.price ?? service.price,
        vat: dto.vat ?? service.vat,
        description: dto.description ?? service.description,
        icon: dto.icon ?? service.icon,
        employees: employeesData,
      },
    });

    await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
    return updated;
  }

  async remove(id: string) {
    await this.prisma.service.delete({ where: { id } });
    await this.redis.flushByPrefix(SERVICE_CACHE_PREFIX);
    return { message: 'Service deleted successfully' };
  }

  async searchServices(
    salonId: string,
    search?: string,
    page = 1,
    limit = 10,
    sortBy: string = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    categories?: string[],
  ) {
    const skip = (page - 1) * limit;

    const allowedSortFields = ['createdAt', 'price', 'duration', 'serviceName'];
    const safeSortBy = allowedSortFields.includes(sortBy)
      ? sortBy
      : 'createdAt';
    const safeOrder: 'asc' | 'desc' = order === 'asc' ? 'asc' : 'desc';

    const key = `${SERVICE_CACHE_PREFIX}:${salonId}:search:${search || 'all'}:categories:${categories?.join('|') || 'all'}:page:${page}:limit:${limit}:sort:${safeSortBy}:${safeOrder}`;

    const cached = await this.redis.get(key);
    if (cached) return JSON.parse(cached as string);

    const whereCondition: any = { salonId };

    if (search) {
      whereCondition.serviceName = { contains: search, mode: 'insensitive' };
    }

    if (categories?.length) {
      whereCondition.categories = { hasSome: categories };
    }

    const [services, total] = await Promise.all([
      this.prisma.service.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: { [safeSortBy]: safeOrder },
        include: {
          employees: {
            include: {
              employee: {
                include: { user: true },
              },
            },
          },
        },
      }),
      this.prisma.service.count({ where: whereCondition }),
    ]);

    const formattedServices = services.map((service) => ({
      ...service,
      employees: service.employees.map((se) => ({
        id: se.employee.id,
        name: `${se.employee.user?.firstName || ''} ${se.employee.user?.lastName || ''}`.trim(),
        email: se.employee.user?.email,
        designation: se.employee.designation,
        salary: se.employee.salary,
      })),
    }));

    const result = {
      data: formattedServices,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        sortBy: safeSortBy,
        order: safeOrder,
        categories: categories || null,
      },
    };

    await this.redis.set(key, JSON.stringify(result), 60);

    return result;
  }
}
