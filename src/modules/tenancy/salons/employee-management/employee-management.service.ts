/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
// employee-management.service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';
import { FilterEmployeeDto } from './dto/filter-employee.dto';

@Injectable()
export class EmployeeManagementService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  private employmentStatusMap: Record<
    string,
    'ACTIVE' | 'INACTIVE' | 'PENDING'
  > = {
    active: 'ACTIVE',
    inactive: 'INACTIVE',
    pending: 'PENDING',
  };

  private contractTypeMap: Record<
    string,
    'FULL_TIME' | 'PART_TIME' | 'CONTRACT'
  > = {
    'full time': 'FULL_TIME',
    'part time': 'PART_TIME',
    contract: 'CONTRACT',
  };

  async getEmployees(query: FilterEmployeeDto) {
    const {
      page = 1,
      limit = 20,
      role,
      employmentStatus,
      profileStatus,
      contractType,
      sortBy,
      sortOrder = 'desc',
      city,
      province,
    } = query;

    const pageNumber = Number(page);
    const limitNumber = Number(limit);

    const cacheKey = `emp:${pageNumber}:${limitNumber}:${JSON.stringify(query)}`;
    // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
    const cached = (await this.redis.get(cacheKey)) as string | null;

    if (cached) return JSON.parse(cached);

    const where: any = {};
    if (role) where.role = role;

    const mappedEmploymentStatus = employmentStatus
      ? this.employmentStatusMap[employmentStatus.toLowerCase()]
      : undefined;
    const mappedContractType = contractType
      ? this.contractTypeMap[contractType.toLowerCase()]
      : undefined;

    where.employeeProfile = {};

    if (mappedEmploymentStatus)
      where.employeeProfile.employmentStatus = mappedEmploymentStatus;
    if (profileStatus) where.employeeProfile.profileStatus = profileStatus;
    if (mappedContractType)
      where.employeeProfile.contractType = mappedContractType;
    if (city) where.employeeProfile.city = city;
    if (province) where.employeeProfile.province = province;

    if (Object.keys(where.employeeProfile).length === 0)
      delete where.employeeProfile;

    const orderBy: any = sortBy
      ? { employeeProfile: { [sortBy]: sortOrder } }
      : { createdAt: 'desc' };

    const [employees, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          profilePicture: true,
          employeeProfile: {
            select: {
              employmentStatus: true,
              profileStatus: true,
              contractType: true,
              city: true,
              province: true,
              lastActiveAt: true,
              dateOfJoining: true,
            },
          },
        },
        skip: (pageNumber - 1) * limitNumber,
        take: limitNumber,
        orderBy,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = employees.map((e) => ({
      id: e.id,
      name: `${e.firstName} ${e.lastName}`,
      email: e.email,
      profilePicture: e.profilePicture,
      employmentStatus: e.employeeProfile?.employmentStatus,
      profileStatus: e.employeeProfile?.profileStatus,
      contractType: e.employeeProfile?.contractType,
      city: e.employeeProfile?.city,
      province: e.employeeProfile?.province,
      lastActiveAt: e.employeeProfile?.lastActiveAt,
      dateOfJoining: e.employeeProfile?.dateOfJoining,
    }));

    const response = {
      data,
      pagination: {
        page: pageNumber,
        limit: limitNumber,
        total,
        totalPages: Math.ceil(total / limitNumber),
      },
    };

    await this.redis.set(cacheKey, JSON.stringify(response), 300);

    return response;
  }
}
