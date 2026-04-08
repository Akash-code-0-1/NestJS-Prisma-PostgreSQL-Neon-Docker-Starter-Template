/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../core/prisma/prisma.service';
import { RedisService } from '../../../../core/redis/redis.service';
import { RECEIPT_CACHE_PREFIX } from '../../../../core/redis/redis.constants';
import { CreateReceiptDto } from './dto/receipt.dto';
import dayjs from 'dayjs';

@Injectable()
export class ReceiptsService {
  private readonly logger = new Logger(ReceiptsService.name);

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
      dateRange = '',
    } = query;
    return `${RECEIPT_CACHE_PREFIX}:${salonId}:p:${page}:l:${limit}:s:${search}:st:${status}:m:${method}:d:${dateRange}`;
  }

  private async log(
    tx: any,
    appointmentId: string,
    action: string,
    status: any,
    userId?: string,
  ) {
    await tx.appointmentLog.create({
      data: {
        appointmentId,
        action,
        status,
        userId,
      },
    });
  }

  async create(salonId: string, dto: CreateReceiptDto) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const currentYear = new Date().getFullYear();
        const lastReceipt = await tx.receipt.findFirst({
          where: {
            salonId,
            receiptNumber: { startsWith: `${currentYear}-` },
          },
          orderBy: { createdAt: 'desc' },
          select: { receiptNumber: true },
        });

        const nextNum = lastReceipt
          ? (parseInt(lastReceipt.receiptNumber.split('-')[1]) + 1)
              .toString()
              .padStart(6, '0')
          : '000001';

        const finalReceiptNumber = `${currentYear}-${nextNum}`;

        const subTotal = dto.items.reduce(
          (acc, i) => acc + Number(i.unitPrice) * Number(i.quantity),
          0,
        );

        const taxAmount = dto.items.reduce(
          (acc, i) =>
            acc +
            Number(i.unitPrice) *
              Number(i.quantity) *
              (Number(i.vatRate || 0) / 100),
          0,
        );

        const receipt = await tx.receipt.create({
          data: {
            salonId,
            appointmentId: dto.appointmentId || null,
            userId: dto.userId || null,
            receiptNumber: finalReceiptNumber,
            clientName: dto.clientName,
            clientEmail: dto.clientEmail,
            isIndependent: dto.isIndependent,
            method: dto.method as any,
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

        if (dto.appointmentId) {
          await tx.appointment.update({
            where: { id: dto.appointmentId },
            data: { status: 'COMPLETED' as any },
          });

          await this.log(
            tx,
            dto.appointmentId,
            'Payment Completed',
            'COMPLETED',
            dto.userId,
          );

          await this.log(
            tx,
            dto.appointmentId,
            'Receipt Generated',
            'COMPLETED',
            dto.userId,
          );
        }

        return receipt;
      });

      await this.redisService.flushByPrefix(
        `${RECEIPT_CACHE_PREFIX}:${salonId}`,
      );
      return result;
    } catch (error) {
      this.logger.error(`Receipt Creation Error: ${error.message}`);
      throw new HttpException(
        'Failed to generate receipt',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async findAll(salonId: string, query: any) {
    const cacheKey = this.getCacheKey(salonId, query);

    const cached = await this.redisService.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

    const { page = 1, limit = 10, search, status, method, dateRange } = query;
    const where: any = { salonId, deletedAt: null };

    if (status && status !== 'All') {
      where.status = status.toUpperCase() as any;
    }

    if (method && method !== 'All') {
      const methodMap: Record<string, string> = {
        Cash: 'PAY_IN_SALON',
        'Card Terminal': 'CARD',
        'Gift Card': 'BANK_TRANSFER',
        'Online P.': 'GOOGLE_PAY',
        'Apple Pay': 'APPLE_PAY',
      };
      where.method = (methodMap[method] || method) as any;
    }

    if (dateRange && dateRange !== 'All Time') {
      const now = dayjs();
      if (dateRange === 'Today' || dateRange === 'Day') {
        where.createdAt = { gte: now.startOf('day').toDate() };
      } else if (dateRange === 'Week') {
        where.createdAt = { gte: now.startOf('week').toDate() };
      } else if (dateRange === 'Month') {
        where.createdAt = { gte: now.startOf('month').toDate() };
      }
    }

    if (search) {
      where.OR = [
        { clientName: { contains: search, mode: 'insensitive' } },
        { receiptNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [total, receipts] = await Promise.all([
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

    await this.redisService.set(cacheKey, res, 3600);
    return res;
  }

  async findOne(id: string, salonId: string) {
    const cacheKey = `${RECEIPT_CACHE_PREFIX}:detail:${id}`;

    const cached = await this.redisService.get(cacheKey);
    if (cached) return typeof cached === 'string' ? JSON.parse(cached) : cached;

    const receipt = await this.prisma.receipt.findFirst({
      where: { id, salonId },
      include: {
        items: true,
        salon: true,
        user: true,
      },
    });

    if (!receipt)
      throw new HttpException('Receipt not found', HttpStatus.NOT_FOUND);

    const vatSummary = receipt.items.reduce((acc, item) => {
      const rate = Number(item.vatRate);
      const taxable = Number(item.unitPrice) * item.quantity;
      const iva = taxable * (rate / 100);

      if (!acc[rate]) acc[rate] = { rate, taxable: 0, iva: 0 };
      acc[rate].taxable += taxable;
      acc[rate].iva += iva;
      return acc;
    }, {});

    const result = {
      ...receipt,
      vatSummary: Object.values(vatSummary),
    };

    await this.redisService.set(cacheKey, result, 3600);
    return result;
  }

  async update(id: string, salonId: string, dto: CreateReceiptDto) {
    const existing = await this.prisma.receipt.findUnique({ where: { id } });
    if (!existing || existing.status === ('CANCELLED' as any)) {
      throw new HttpException(
        'Receipt cannot be edited',
        HttpStatus.BAD_REQUEST,
      );
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      await tx.receiptItem.deleteMany({ where: { receiptId: id } });

      const subTotal = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity,
        0,
      );
      const taxAmount = dto.items.reduce(
        (acc, i) => acc + i.unitPrice * i.quantity * ((i.vatRate || 0) / 100),
        0,
      );

      return await tx.receipt.update({
        where: { id },
        data: {
          clientName: dto.clientName,
          clientEmail: dto.clientEmail,
          method: dto.method as any,
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
    });

    await this.redisService.flushByPrefix(`${RECEIPT_CACHE_PREFIX}:${salonId}`);
    return updated;
  }
}
