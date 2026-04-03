/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';
import {
  UpdateMemberDto,
  EmployeeActionDto,
  EmployeeActionType,
  MemberProfileQueryDto,
  FilterEmployeeDto,
  TimeOffDto,
} from './dto/filter-employee.dto';

@Injectable()
export class EmployeeManagementService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  // --- LIST EMPLOYEES ---
  async getEmployees(query: FilterEmployeeDto) {
    const {
      page = 1,
      limit = 20,
      role,
      employmentStatus,
      sortBy,
      sortOrder = 'desc',
    } = query;
    const skip = (Number(page) - 1) * Number(limit);

    const where: any = { isDeleted: false };
    if (role) where.user = { role };
    if (employmentStatus)
      where.employmentStatus = employmentStatus.toUpperCase();

    const [data, total] = await Promise.all([
      this.prisma.employeeProfile.findMany({
        where,
        include: { user: true },
        skip,
        take: Number(limit),
        orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
      }),
      this.prisma.employeeProfile.count({ where }),
    ]);

    return {
      data: data.map((emp) => ({
        id: emp.id,
        name: `${emp.user.firstName} ${emp.user.lastName}`,
        email: emp.user.email,
        employmentStatus: emp.employmentStatus,
        designation: emp.designation,
      })),
      pagination: { total, page: Number(page), limit: Number(limit) },
    };
  }

  // --- GET PROFILE (Includes New TimeOff & Manager Relations) ---
  async getMemberProfile(id: string, query: MemberProfileQueryDto) {
    const { servicePage = 1, serviceLimit = 5 } = query;

    const employee = await this.prisma.employeeProfile.findUnique({
      where: { id },
      include: {
        user: true,
        languages: true,
        socialConnections: true,
        directManager: true,
        timeOffRequests: { orderBy: { startDate: 'desc' }, take: 10 },
        services: {
          skip: (Number(servicePage) - 1) * Number(serviceLimit),
          take: Number(serviceLimit),
          include: { service: true },
        },
      },
    });

    if (!employee) throw new NotFoundException('Member not found');
    return employee;
  }

  // --- UPDATE (Handles Language Table & Manager Link) ---
  async updateMember(id: string, dto: UpdateMemberDto) {
    await this.clearCache(id);

    if (dto.languages && Array.isArray(dto.languages)) {
      await this.prisma.employeeLanguage.deleteMany({
        where: { employeeId: id },
      });

      await this.prisma.employeeLanguage.createMany({
        data: dto.languages.map((l: any) => ({
          name: l.language || l.name,
          level: l.level,
          employeeId: id,
        })),
      });
    }

    return this.prisma.employeeProfile.update({
      where: { id },
      data: {
        phone: dto.phone,
        gender: dto.gender,
        age: dto.age,
        dob: dto.dob,
        designation: dto.designation,
        salary: dto.salary,
        address: dto.address,
        city: dto.city,
        province: dto.province,
        cap: dto.cap,
        certifications: dto.certifications,
        completedCourses: dto.completedCourses,
        // FIXED: Use 'connect' for the relation to avoid TS2322 XOR error
        directManager: dto.directManagerId
          ? { connect: { id: dto.directManagerId } }
          : undefined,
        startDate: dto.startDate ? new Date(dto.startDate) : undefined,
        endDate: dto.endDate ? new Date(dto.endDate) : undefined,
        user:
          dto.firstName || dto.lastName || dto.email
            ? {
                update: {
                  firstName: dto.firstName,
                  lastName: dto.lastName,
                  email: dto.email,
                },
              }
            : undefined,
      },
    });
  }

  // --- ADD TIME OFF (Now saves to TimeOffRequest table) ---
  async addTimeOff(id: string, dto: TimeOffDto) {
    await this.clearCache(id);

    const timeOff = await this.prisma.timeOffRequest.create({
      data: {
        employeeId: id,
        type: dto.type,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        startTime: dto.startTime,
        endTime: dto.endTime,
        repeat: dto.repeat,
        repeatFrequency: dto.repeatFrequency,
        description: dto.description,
        status: 'APPROVED',
      },
    });

    await this.prisma.employeeProfile.update({
      where: { id },
      data: { employmentStatus: 'ON_LEAVE' },
    });

    return timeOff;
  }

  // --- DROP-DOWN ACTIONS ---
  async performAction(id: string, dto: EmployeeActionDto) {
    await this.clearCache(id);
    const emp = await this.prisma.employeeProfile.findUnique({ where: { id } });
    if (!emp) throw new NotFoundException('Employee not found');

    switch (dto.action) {
      case EmployeeActionType.TERMINATE_CONTRACT:
        return this.prisma.employeeProfile.update({
          where: { id },
          data: {
            employmentStatus: 'INACTIVE',
            endDate: dto.date ? new Date(dto.date) : new Date(),
            statusNote: dto.note,
          },
        });
      case EmployeeActionType.DISABLE_ACCESS:
        return this.prisma.user.update({
          where: { id: emp.userId },
          data: { isActive: false },
        });
      case EmployeeActionType.ENABLE_ACCESS:
        return this.prisma.user.update({
          where: { id: emp.userId },
          data: { isActive: true },
        });
      default:
        throw new BadRequestException('Action not supported');
    }
  }

  private async clearCache(id: string) {
    try {
      await this.redis.delete(`emp_prof:${id}:svc_p1`);
      // eslint-disable-next-line no-empty
    } catch (e) {}
  }
}
