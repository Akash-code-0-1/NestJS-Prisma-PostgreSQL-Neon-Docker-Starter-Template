import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsBoolean,
  IsNumber,
  IsEnum,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';

export type PaymentMethod =
  | 'PAY_IN_SALON'
  | 'CARD'
  | 'APPLE_PAY'
  | 'GOOGLE_PAY'
  | 'BANK_TRANSFER';
export type ReceiptStatus =
  | 'DRAFT'
  | 'ISSUED'
  | 'PAID'
  | 'CANCELLED'
  | 'REFUNDED';

export class ReceiptItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitPrice: number;

  @IsNumber()
  @IsOptional()
  vatRate?: number;
}

export class CreateReceiptDto {
  @IsOptional()
  @IsString()
  appointmentId?: string;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsOptional()
  @IsEmail()
  clientEmail?: string;

  @IsBoolean()
  isIndependent: boolean;

  @IsEnum(['PAY_IN_SALON', 'CARD', 'APPLE_PAY', 'GOOGLE_PAY', 'BANK_TRANSFER'])
  method: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReceiptItemDto)
  items: ReceiptItemDto[];
}

export class UpdateReceiptStatusDto {
  @IsEnum(['DRAFT', 'ISSUED', 'PAID', 'CANCELLED', 'REFUNDED'])
  status: ReceiptStatus;
}
