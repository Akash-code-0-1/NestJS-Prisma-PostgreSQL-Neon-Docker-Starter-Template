/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { SALON_CACHE_PREFIX } from '../../../core/redis/redis.constants';
import { AdminSalonFilterDto } from '../salons/dto/admin-salon-filter.dto';
import { CreateSalonDto } from './dto/create-salon.dto';

export enum Role {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SALON_OWNER = 'SALON_OWNER',
  EMPLOYEE = 'EMPLOYEE',
}

@Injectable()
export class SalonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private buildCacheKey(filters: AdminSalonFilterDto) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      plan = '',
      country = '',
      province = '',
      city = '',
    } = filters;

    return `${SALON_CACHE_PREFIX}:page:${page}:limit:${limit}:s:${search}:st:${status}:p:${plan}:c:${country}:pr:${province}:ct:${city}`;
  }

  // ----------------- CREATE -----------------
  async create(dto: CreateSalonDto, currentUserId: string) {
    try {
      const existingSalon = await this.prisma.salon.findFirst({
        where: { OR: [{ vtaNumber: dto.vtaNumber }, { email: dto.email }] },
      });

      if (existingSalon) {
        throw new HttpException(
          'Salon with vtaNumber or email already exists.',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Calculate trialEndsAt correctly
      const trialDays = Number(dto.trialPeriod);
      const trialEndsAt = !isNaN(trialDays)
        ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
        : null;

      const salon = await this.prisma.salon.create({
        data: {
          name: dto.name,
          businessType: dto.businessType,
          vtaNumber: dto.vtaNumber,
          employeeCount: Number(dto.employeeCount),
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          country: dto.country,
          province: dto.province,
          city: dto.city,
          zipCode: dto.zipCode,
          status: 'TRIAL',
          plan: dto.initialPlan || 'BASIC',
          trialEndsAt,
          createdBy: currentUserId,
          updatedBy: currentUserId,
          lastActiveAt: new Date(),
          owners: {
            create: dto.owners.map((owner) => ({
              user: {
                connectOrCreate: {
                  where: { email: owner.email },
                  create: {
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                    email: owner.email,
                    password: '', // password will be set later
                  },
                },
              },
              invitationSent: owner.invitationSent,
            })),
          },
        },
      });

      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);
      return salon;
    } catch (error: any) {
      console.error('Error creating salon:', error);
      if (error.code === 'P2002') {
        throw new HttpException(
          `The vtaNumber or email must be unique. ${error.meta.target} already exists.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException('Failed to create salon', HttpStatus.BAD_REQUEST);
    }
  }

  async update(
    id: string,
    data: any,
    currentUserId: string,
    currentUserRole: Role,
  ) {
    try {
      // Fetch salon with owners included
      const salon = await this.prisma.salon.findUnique({
        where: { id },
        include: { owners: { include: { user: true } } }, // Include related user for each owner
      });

      if (!salon) {
        throw new HttpException('Salon not found', HttpStatus.NOT_FOUND);
      }

      // Ensure that the current user is authorized to update the salon
      const isOwner = salon.owners?.some(
        (owner) => owner.userId === currentUserId,
      );

      if (!(isOwner || currentUserRole === Role.SUPER_ADMIN)) {
        throw new HttpException(
          'You do not have permission to update this salon',
          HttpStatus.FORBIDDEN,
        );
      }

      // Handle trialPeriod if provided
      let trialEndsAt = salon.trialEndsAt;
      if (data.trialPeriod) {
        const trialDays = Number(data.trialPeriod);
        trialEndsAt = !isNaN(trialDays)
          ? new Date(Date.now() + trialDays * 24 * 60 * 60 * 1000)
          : salon.trialEndsAt;
      }

      // Separate existing owners and new owners
      const existingOwners = data.owners?.filter((o: any) => o.id) || [];
      const newOwners = data.owners?.filter((o: any) => !o.id) || [];

      const updated = await this.prisma.salon.update({
        where: { id },
        data: {
          name: data.name,
          businessType: data.businessType,
          vtaNumber: data.vtaNumber,
          employeeCount: Number(data.employeeCount),
          email: data.email,
          phoneNumber: data.phoneNumber,
          country: data.country,
          province: data.province,
          city: data.city,
          zipCode: data.zipCode,
          plan: data.initialPlan || salon.plan,
          trialEndsAt,
          updatedBy: currentUserId,
          owners: {
            update: existingOwners.map((owner: any) => ({
              where: { id: owner.id }, // Using actual OwnerProfile id
              data: {
                invitationSent: owner.invitationSent,
                user: {
                  update: {
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                  },
                },
              },
            })),
            create: newOwners.map((owner: any) => ({
              user: {
                connectOrCreate: {
                  where: { email: owner.email },
                  create: {
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                    email: owner.email,
                    password: '', // Password will be set later
                  },
                },
              },
              invitationSent: owner.invitationSent,
              // No salonId needed — Prisma will link it automatically
            })),
          },
        },
      });

      // Clear cache after update
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);

      return updated;
    } catch (error: any) {
      console.error('Error updating salon:', error);
      throw new HttpException('Failed to update salon', HttpStatus.BAD_REQUEST);
    }
  }

  // ----------------- FIND ALL -----------------
  async findAll(filters: AdminSalonFilterDto) {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      plan,
      country,
      province,
      city,
      refresh,
    } = filters;

    const safeLimit = Math.min(Number(limit), 100);
    const skip = (Number(page) - 1) * safeLimit;

    if (refresh === 'true') {
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);
    }

    const cacheKey = this.buildCacheKey(filters);
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { vtaNumber: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status && status !== 'ALL') where.status = status.toUpperCase();
    if (plan && plan !== 'ALL') where.plan = plan.toUpperCase();
    if (country && country !== 'ALL')
      where.country = { equals: country, mode: 'insensitive' };
    if (province && province !== 'ALL')
      where.province = { equals: province, mode: 'insensitive' };
    if (city && city !== 'ALL')
      where.city = { equals: city, mode: 'insensitive' };

    const [total, salons] = await this.prisma.$transaction([
      this.prisma.salon.count({ where }),
      this.prisma.salon.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const response = {
      data: salons,
      meta: {
        total,
        page: Number(page),
        limit: safeLimit,
        lastPage: Math.ceil(total / safeLimit),
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(response), 60);
    return response;
  }

  // ----------------- SOFT DELETE -----------------
  async softDelete(id: string) {
    try {
      const deleted = await this.prisma.salon.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);
      return deleted;
    } catch (error) {
      console.error('Error soft deleting salon:', error);
      throw new HttpException('Failed to delete salon', HttpStatus.BAD_REQUEST);
    }
  }

  // ----------------- FIND ONE -----------------
  async findOne(id: string) {
    const salon = await this.prisma.salon.findUnique({
      where: { id },
      include: { owners: true },
    });
    if (!salon)
      throw new HttpException('Salon not found', HttpStatus.NOT_FOUND);
    return salon;
  }

  // ----------------- REMOVE (alias for softDelete) -----------------
  async remove(id: string) {
    return this.softDelete(id);
  }

  // ----------------- HARD DELETE (DEV ONLY) -----------------
  async hardDelete(id: string) {
    try {
      const deleted = await this.prisma.salon.delete({
        where: { id },
      });
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);
      return deleted;
    } catch (error) {
      console.error('Error hard deleting salon:', error);
      throw new HttpException(
        'Failed to hard delete salon',
        HttpStatus.BAD_REQUEST,
      );
    }
  }
}
