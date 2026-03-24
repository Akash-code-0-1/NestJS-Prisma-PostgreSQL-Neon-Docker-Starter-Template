import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { PaymentMethod } from '@prisma/client';

export class BuyVoucherDto {
  @IsString()
  voucherId: string;

  @IsString()
  userId: string;

  @IsString()
  senderName: string;

  @IsString()
  recipientName: string;

  @IsEmail()
  recipientEmail: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
