/* eslint-disable @typescript-eslint/no-unsafe-argument */
import {
  IsString,
  IsEnum,
  IsOptional,
  IsNumber,
  IsBoolean,
  IsArray,
  IsUUID,
  Min,
} from 'class-validator';
import {
  BundleScheduleType,
  BundleCategory,
  BundlePriceType,
} from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export class CreateBundleDto {
  @IsString()
  name: string;

  @IsEnum(BundleCategory)
  category: BundleCategory;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(BundlePriceType)
  priceType: BundlePriceType;

  @IsNumber()
  @Min(0)
  price: Decimal;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsEnum(BundleScheduleType)
  scheduleType: BundleScheduleType;

  @IsBoolean()
  @IsOptional()
  addToOnlineBook: boolean;

  @IsArray()
  @IsUUID('4', { each: true })
  serviceId: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];
  serviceIds: any;
}

export class BundleQueryDto {
  @IsOptional() @IsString() page?: string;
  @IsOptional() @IsString() limit?: string;
  @IsOptional() @IsString() search?: string;
  @IsOptional() @IsEnum(BundleCategory) category?: BundleCategory;
}
