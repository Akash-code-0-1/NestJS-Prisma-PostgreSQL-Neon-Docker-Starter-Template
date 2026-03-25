/* eslint-disable @typescript-eslint/no-unsafe-argument */
// import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
// import { PaymentMethod } from '@prisma/client';

// export class BuyVoucherDto {
//   @IsString()
//   voucherId: string;

//   @IsString()
//   userId: string;

//   @IsString()
//   senderName: string;

//   @IsString()
//   recipientName: string;

//   @IsEmail()
//   recipientEmail: string;

//   @IsOptional()
//   @IsString()
//   message?: string;

//   @IsEnum(PaymentMethod)
//   paymentMethod: PaymentMethod;
// }

import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

// Direct string union matching Prisma schema
export type PaymentMethod =
  | 'PAY_IN_SALON'
  | 'CARD'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'BANK_TRANSFER';

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

  @IsEnum([
    'PAY_IN_SALON',
    'CARD',
    'APPLE_PAY',
    'GOOGLE_PAY',
    'BANK_TRANSFER',
  ] as const)
  paymentMethod: PaymentMethod;
}
