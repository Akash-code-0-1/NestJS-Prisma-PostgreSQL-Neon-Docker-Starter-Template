import { HttpException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../core/prisma/prisma.service';
import { RedisService } from '../../../core/redis/redis.service';
import { BuyVoucherDto } from './dto/buy-voucher.dto';
import { randomUUID } from 'crypto';

@Injectable()
export class BuyVoucherService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async buy(salonId: string, dto: BuyVoucherDto) {
    return this.prisma.$transaction(async (tx) => {
      // Step 1: find voucher
      const voucher = await tx.voucher.findUnique({
        where: { id: dto.voucherId },
      });

      if (!voucher || !voucher.isActive) {
        throw new HttpException('Invalid voucher', 400);
      }

      // Step 2: calculate expiry
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + voucher.validityDays);

      // Step 3: create voucher purchase (without payment first)
      const purchase = await tx.voucherPurchase.create({
        data: {
          voucherId: voucher.id,
          salonId,
          userId: dto.userId,
          code: randomUUID(),
          senderName: dto.senderName,
          recipientName: dto.recipientName,
          recipientEmail: dto.recipientEmail,
          message: dto.message,
          expiryDate,
        },
      });

      // Step 4: create payment and connect to purchase
      const payment = await tx.payment.create({
        data: {
          amount: voucher.price,
          total: voucher.price,
          method: dto.paymentMethod, // must match PaymentMethod enum
          status: 'PENDING',
          voucherPurchase: { connect: { id: purchase.id } },
        },
      });

      // Step 5: update purchase with paymentId
      await tx.voucherPurchase.update({
        where: { id: purchase.id },
        data: { paymentId: payment.id },
      });

      return payment; // return payment or purchase depending on API design
    });
  }

  async findAll(
    salonId: string,
    search?: string,
    limit = 10,
    offset = 0,
    sortBy = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
  ) {
    return this.prisma.voucherPurchase.findMany({
      where: {
        salonId,
        OR: search
          ? [
              { recipientName: { contains: search, mode: 'insensitive' } },
              { code: { contains: search } },
            ]
          : undefined,
      },
      include: {
        voucher: true,
        payment: true,
      },
      take: +limit,
      skip: +offset,
      orderBy: { [sortBy]: order },
    });
  }
}
