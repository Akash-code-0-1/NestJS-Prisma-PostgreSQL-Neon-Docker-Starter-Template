// import {
//   IsString,
//   IsOptional,
//   IsArray,
//   ValidateNested,
//   IsDateString,
//   IsNumber,
//   IsEnum,
// } from 'class-validator';
// import { Type } from 'class-transformer';
// import { AppointmentStatus } from '@prisma/client';

// enum PaymentMethod {
//   PAY_IN_SALON = 'PAY_IN_SALON',
//   CARD = 'CARD',
//   APPLE_PAY = 'APPLE_PAY',
//   GOOGLE_PAY = 'GOOGLE_PAY',
//   BANK_TRANSFER = 'BANK_TRANSFER',
// }

// class CreateAppointmentServiceDto {
//   @IsString()
//   serviceId: string;

//   @IsOptional()
//   @IsString()
//   employeeId?: string;

//   @IsNumber()
//   priceAtBooking: number;

//   @IsDateString()
//   startAt: string;

//   @IsDateString()
//   endAt: string;
// }

// class CreateParticipantDto {
//   @IsOptional()
//   @IsString()
//   userId?: string;

//   @IsString()
//   name: string;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateAppointmentServiceDto)
//   services: CreateAppointmentServiceDto[];
// }

// class CreatePaymentDto {
//   @IsNumber()
//   amount: number;

//   @IsOptional()
//   @IsNumber()
//   discount?: number;

//   @IsOptional()
//   @IsNumber()
//   tax?: number;

//   @IsNumber()
//   total: number;

//   @IsEnum(PaymentMethod)
//   method: PaymentMethod;
// }

// export class CreateAppointmentDto {
//   @IsString()
//   clientId: string;

//   @IsDateString()
//   date: string;

//   @IsOptional()
//   @IsString()
//   note?: string;

//   @IsOptional()
//   @IsEnum(AppointmentStatus)
//   status?: AppointmentStatus;

//   @IsArray()
//   @ValidateNested({ each: true })
//   @Type(() => CreateParticipantDto)
//   participants: CreateParticipantDto[];

//   @IsOptional()
//   @ValidateNested()
//   @Type(() => CreatePaymentDto)
//   payment?: CreatePaymentDto;
// }

import {
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
  IsNumber,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';

// Defined locally to prevent Prisma build import errors
export enum AppointmentStatus {
  BOOKED = 'BOOKED',
  STARTED = 'STARTED',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  COMPLETED = 'COMPLETED',
  ARRIVED = 'ARRIVED',
  PAID = 'PAID',
}

enum PaymentMethod {
  PAY_IN_SALON = 'PAY_IN_SALON',
  CARD = 'CARD',
  APPLE_PAY = 'APPLE_PAY',
  GOOGLE_PAY = 'GOOGLE_PAY',
  BANK_TRANSFER = 'BANK_TRANSFER',
}

class CreateAppointmentServiceDto {
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  employeeId?: string;

  @IsNumber()
  priceAtBooking: number;

  @IsDateString()
  startAt: string;

  @IsDateString()
  endAt: string;
}

class CreateParticipantDto {
  @IsOptional()
  @IsString()
  userId?: string;

  @IsString()
  name: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAppointmentServiceDto)
  services: CreateAppointmentServiceDto[];
}

class CreatePaymentDto {
  @IsNumber()
  amount: number;

  @IsOptional()
  @IsNumber()
  discount?: number;

  @IsOptional()
  @IsNumber()
  tax?: number;

  @IsNumber()
  total: number;

  @IsEnum(PaymentMethod)
  method: PaymentMethod;
}

export class CreateAppointmentDto {
  @IsString()
  clientId: string;

  @IsDateString()
  date: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsEnum(AppointmentStatus)
  status?: AppointmentStatus;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateParticipantDto)
  participants: CreateParticipantDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CreatePaymentDto)
  payment?: CreatePaymentDto;
}
