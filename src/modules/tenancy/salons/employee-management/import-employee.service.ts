/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';

@Injectable()
export class EmployeeImportService {
  private readonly CACHE_PREFIX = 'staged_employees_import:v1';

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  async stageData(salonId: string, items: any[]) {
    // 1. Map raw JSON/CSV data to StagedEmployee schema
    const stagedData = items.map((item) => ({
      salonId,
      externalId: item.id?.toString(),
      firstName: item.firstName || item.name?.split(' ')[0] || 'New',
      lastName:
        item.lastName || item.name?.split(' ').slice(1).join(' ') || 'Employee',
      email: item.email,
      phone: item.phone?.toString(),
      gender: item.gender,
      salary: parseFloat(item.salary) || 0,
      designation: item.role || item.designation || 'Staff',
      dob: item.dob,
      address: item.address,
      city: item.city,
      province: item.province,
      cap: item.cap?.toString(),
      contractType: item.contractType,
      taxIdCode: item.taxIdCode,
      iban: item.iban,
      startDate: item.startDate ? new Date(item.startDate) : new Date(),
      endDate: item.endDate ? new Date(item.endDate) : new Date(),
      remunerationType: item.remunerationType || 'Monthly',
    }));

    await this.prisma.stagedEmployee.createMany({ data: stagedData });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
  }

  async getStagedData(salonId: string, page = 1, limit = 5) {
    const cacheKey = `${this.CACHE_PREFIX}:${salonId}:${page}:${limit}`;
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached as string);

    const skip = (page - 1) * limit;
    const [total, data] = await Promise.all([
      this.prisma.stagedEmployee.count({ where: { salonId } }),
      this.prisma.stagedEmployee.findMany({
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
    await this.redis.set(cacheKey, JSON.stringify(result), 60);
    return result;
  }

  async approveBulk(salonId: string, ids: string[], currentUserId: string) {
    const items = await this.prisma.stagedEmployee.findMany({
      where: { id: { in: ids }, salonId },
    });

    if (items.length === 0)
      throw new BadRequestException('No records found to approve');

    return await this.prisma.$transaction(async (tx) => {
      let count = 0;

      for (const item of items) {
        const existing = await tx.user.findUnique({
          where: { email: item.email },
        });
        if (existing) continue;

        // 1. Create Global Identity
        const user = await tx.user.create({
          data: {
            firstName: item.firstName,
            lastName: item.lastName,
            email: item.email,
            role: 'EMPLOYEE',
            isActive: false,
          },
        });

        // 2. Create Tenant-Specific Employee Profile
        await tx.employeeProfile.create({
          data: {
            userId: user.id,
            salonId,
            salary: item.salary,
            designation: item.designation || 'Employee',
            dob: item.dob || '1990-01-01',
            address: item.address || '',
            city: item.city || '',
            province: item.province || '',
            cap: item.cap || '',
            contractType: item.contractType || 'Fixed-Term',
            taxIdCode: item.taxIdCode || 'PENDING',
            iban: item.iban,
            startDate: item.startDate || new Date(),
            endDate: item.endDate || new Date(),
            remunerationType: item.remunerationType || 'Monthly',
            invitationStatus: true,
            createdBy: currentUserId,
            updatedBy: currentUserId,
          },
        });

        // 3. Register User to Salon
        await tx.salonUser.create({
          data: {
            userId: user.id,
            salonId,
            role: 'EMPLOYEE',
          },
        });

        count++;
      }

      // 4. Hard Delete from Staged Table
      await tx.stagedEmployee.deleteMany({
        where: { id: { in: ids }, salonId },
      });

      await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
      return {
        success: true,
        count,
        message: `Successfully imported ${count} employees.`,
      };
    });
  }

  async deleteStaged(salonId: string, ids: string[]) {
    const result = await this.prisma.stagedEmployee.deleteMany({
      where: { id: { in: ids }, salonId },
    });
    await this.redis.flushByPrefix(`${this.CACHE_PREFIX}:${salonId}`);
    return { success: true, count: result.count };
  }
}
