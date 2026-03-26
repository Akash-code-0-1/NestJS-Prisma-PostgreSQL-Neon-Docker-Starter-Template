/* eslint-disable @typescript-eslint/no-base-to-string */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
// src/modules/tenancy/receipts/receipts.service.ts
import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { RECEIPT_CACHE_PREFIX } from '../../../core/redis/redis.constants';
import { CreateReceiptDto } from './dto/receipt.dto';

@Injectable()
export class ReceiptsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private getCacheKey(salonId: string, query: any) {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      method = '',
    } = query;
    return `${RECEIPT_CACHE_PREFIX}:${salonId}:p:${page}:l:${limit}:s:${search}:st:${status}:m:${method}`;
  }

  async create(salonId: string, dto: CreateReceiptDto) {
    return await this.prisma.$transaction(async (tx) => {
      const lastReceipt = await tx.receipt.findFirst({
        where: { salonId },
        orderBy: { createdAt: 'desc' },
        select: { receiptNumber: true },
      });

      const nextNum = lastReceipt
        ? (parseInt(lastReceipt.receiptNumber.replace('#', '')) + 1)
            .toString()
            .padStart(3, '0')
        : '001';

      const subTotal = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0,
      );
      const taxAmount = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity * ((i.vatRate || 0) / 100),
        0,
      );

      const receipt = await tx.receipt.create({
        data: {
          salonId,
          appointmentId: dto.appointmentId || null,
          userId: dto.userId || null,
          receiptNumber: `#${nextNum}`,
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          isIndependent: dto.isIndependent,
          method: dto.method,
          subTotal,
          taxAmount,
          totalAmount: subTotal + taxAmount,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate || 0,
            })),
          },
        },
        include: { items: true },
      });

      await this.redisService.flushByPrefix(
        `${RECEIPT_CACHE_PREFIX}:${salonId}`,
      );
      return receipt;
    });
  }

  async findAll(salonId: string, query: any) {
    const cacheKey = this.getCacheKey(salonId, query);
    const cached = await this.redisService.get(cacheKey);
    if (cached) return JSON.parse(cached.toString());

    const {
      page = 1,
      limit = 10,
      search,
      status,
      method,
      dateRange, // 'All Time', 'Today', 'Last 7 Days', etc.
    } = query;

    const where: any = {
      salonId,
      deletedAt: null,
    };

    // 1. Status Filter (Issued, Draft, Canceled)
    if (status && status !== 'All') {
      where.status = status.toUpperCase();
    }

    // 2. Method Filter (Cash, Card Terminal, Gift Card, Online P.)
    if (method && method !== 'All') {
      // Map frontend labels to DB Enum if they differ
      const methodMap: Record<string, string> = {
        Cash: 'PAY_IN_SALON',
        'Card Terminal': 'CARD',
        'Gift Card': 'BANK_TRANSFER', // Map according to your logic
        'Online P.': 'GOOGLE_PAY', // Map according to your logic
      };
      where.method = methodMap[method] || method;
    }

    // 3. Date Range Filter
    if (dateRange && dateRange !== 'All Time') {
      const now = new Date();
      if (dateRange === 'Today') {
        where.createdAt = { gte: new Date(now.setHours(0, 0, 0, 0)) };
      }
      // Add more cases here as needed...
    }

    // 4. Search Filter (By ID/Receipt Number or Client Name)
    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, receipts] = await this.prisma.$transaction([
      this.prisma.receipt.count({ where }),
      this.prisma.receipt.findMany({
        where,
        skip: (Number(page) - 1) * Number(limit),
        take: Number(limit),
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const res = {
      data: receipts,
      meta: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    };

    await this.redisService.set(cacheKey, JSON.stringify(res), 3600);
    return res;
  }

  async update(id: string, salonId: string, dto: CreateReceiptDto) {
    const existing = await this.prisma.receipt.findUnique({ where: { id } });
    if (!existing || existing.status === 'CANCELLED') {
      throw new HttpException(
        'Receipt cannot be edited',
        HttpStatus.BAD_REQUEST,
      );
    }

    return await this.prisma.$transaction(async (tx) => {
      await tx.receiptItem.deleteMany({ where: { receiptId: id } });

      const subTotal = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0,
      );
      const taxAmount = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity * ((i.vatRate || 0) / 100),
        0,
      );

      const updated = await tx.receipt.update({
        where: { id },
        data: {
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          method: dto.method,
          subTotal,
          taxAmount,
          totalAmount: subTotal + taxAmount,
          items: {
            create: dto.items.map((item) => ({
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              vatRate: item.vatRate || 0,
            })),
          },
        },
        include: { items: true },
      });

      await this.redisService.flushByPrefix(
        `${RECEIPT_CACHE_PREFIX}:${salonId}`,
      );
      return updated;
    });
  }
}
