import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  IsUrl,
  Min,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum PayslipStatus {
  DRAFT = 'DRAFT',
  GENERATED = 'GENERATED',
  PAID = 'PAID',
}
export class CreatePayslipDto {
  @IsUUID()
  employeeId: string;

  @IsDateString()
  date: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  netAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grossAmount: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contributions?: number;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  status?: PayslipStatus;
}

export class UpdatePayslipDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  netAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  grossAmount?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  contributions?: number;

  @IsOptional()
  @IsUrl()
  documentUrl?: string;

  @IsOptional()
  @IsString()
  @IsEnum(PayslipStatus)
  status?: PayslipStatus;
}

export class GetRemunerationQueryDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}

export class GetPayslipCardQueryDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsInt()
  @Min(2000)
  year?: number;
}

export class GetPaymentsPerYearQueryDto {
  @IsUUID()
  employeeId: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;
}
