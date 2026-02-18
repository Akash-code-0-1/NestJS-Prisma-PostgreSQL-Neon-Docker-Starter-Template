/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { SALON_CACHE_PREFIX } from '../../../core/redis/redis.constants';
import { AdminSalonFilterDto } from '../salons/dto/admin-salon-filter.dto';
import { CreateSalonDto } from './dto/create-salon.dto';
import { HttpException, HttpStatus } from '@nestjs/common';

@Injectable()
export class SalonsService {
  findOne(id: string) {
    throw new Error('Method not implemented.');
  }
  setOwnerPassword(ownerId: string, password: string) {
    throw new Error('Method not implemented.');
  }
  remove(id: string) {
    try {
      // Perform a soft delete by setting the `deletedAt` field
      const deletedSalon = this.prisma.salon.update({
        where: { id },
        data: { deletedAt: new Date() }, // Soft delete by marking the salon as deleted
      });

      // Clear the cache after deletion
      this.redisService.flushByPrefix(SALON_CACHE_PREFIX);

      return deletedSalon;
    } catch (error) {
      console.error('Error removing salon:', error);
      throw new HttpException('Failed to delete salon', HttpStatus.BAD_REQUEST);
    }
  }

  constructor(
    private readonly prisma: PrismaService,
    private redisService: RedisService,
  ) {}

  private buildCacheKey(filters: AdminSalonFilterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

  // Create a new salon
  async create(dto: CreateSalonDto) {
    try {
      // Check if a salon with the same vtaNumber or email already exists
      const existingSalon = await this.prisma.salon.findFirst({
        where: {
          OR: [{ vtaNumber: dto.vtaNumber }, { email: dto.email }],
        },
      });

      if (existingSalon) {
        throw new HttpException(
          `Salon with vtaNumber or email already exists.`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create the salon in the database
      const salon = await this.prisma.salon.create({
        data: {
          name: dto.name,
          businessType: dto.businessType,
          vtaNumber: dto.vtaNumber,
          employeeCount: Number(dto.employeeCount), // Convert to number
          email: dto.email,
          phoneNumber: dto.phoneNumber,
          country: dto.country,
          province: dto.province,
          city: dto.city,
          zipCode: dto.zipCode,
          status: 'TRIAL', // Default value for status
          plan: 'BASIC', // Default plan
          trialEndsAt: dto.trialPeriod ? new Date(dto.trialPeriod) : null,
          createdBy: dto.createdBy || null, // Admin user creating the salon
          updatedBy: dto.updatedBy || null, // Admin user updating the salon (optional)
          owners: {
            create: dto.owners.map((owner) => ({
              // Ensure the user is created or connected for each owner
              user: {
                connectOrCreate: {
                  where: { email: owner.email }, // Check if the user already exists by email
                  create: {
                    firstName: owner.firstName,
                    lastName: owner.lastName,
                    email: owner.email,
                    password: '', // Default or handle password creation if needed
                  },
                },
              },
              invitationSent: owner.invitationSent,
            })),
          },
        },
      });

      // Clear the cache after creating the salon
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);

      return salon;
    } catch (error) {
      console.error('Error creating salon:', error);
      if (error.code === 'P2002') {
        throw new HttpException(
          `The vtaNumber or email must be unique. ${error.meta.target} already exists.`,
          HttpStatus.BAD_REQUEST,
        );
      }
      if (error.code === 'P2014') {
        throw new HttpException(
          'Missing required relation: OwnerProfileToUser',
          HttpStatus.BAD_REQUEST,
        );
      }
      throw new HttpException('Failed to create salon', HttpStatus.BAD_REQUEST);
    }
  }

  // Get all salons with filtering and pagination
  async findAll(filters: AdminSalonFilterDto) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    // 🔥 CHECK CACHE FIRST
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log('CACHE HIT');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return JSON.parse(cached);
    }

    console.log('DB HIT');

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { vtaNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (status && status !== 'ALL') {
      where.status = status.toUpperCase();
    }

    if (plan && plan !== 'ALL') {
      where.plan = plan.toUpperCase();
    }

    if (country && country !== 'ALL') {
      where.country = { equals: country, mode: 'insensitive' };
    }

    if (province && province !== 'ALL') {
      where.province = { equals: province, mode: 'insensitive' };
    }

    if (city && city !== 'ALL') {
      where.city = { equals: city, mode: 'insensitive' };
    }

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

    // 🔥 SAVE TO CACHE (60 seconds TTL)
    await this.redisService.set(cacheKey, JSON.stringify(response), 60);

    return response;
  }

  // Update an existing salon
  async update(id: string, data: any) {
    try {
      const updated = await this.prisma.salon.update({
        where: { id },
        data,
      });

      // Clear the cache after updating the salon
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);

      return updated;
    } catch (error) {
      console.error('Error updating salon:', error);
      throw new HttpException('Failed to update salon', HttpStatus.BAD_REQUEST);
    }
  }

  // Soft delete a salon
  async softDelete(id: string) {
    try {
      const deleted = await this.prisma.salon.update({
        where: { id },
        data: { deletedAt: new Date() },
      });

      // Clear the cache after soft deleting the salon
      await this.redisService.flushByPrefix(SALON_CACHE_PREFIX);

      return deleted;
    } catch (error) {
      console.error('Error soft deleting salon:', error);
      throw new HttpException('Failed to delete salon', HttpStatus.BAD_REQUEST);
    }
  }
}
