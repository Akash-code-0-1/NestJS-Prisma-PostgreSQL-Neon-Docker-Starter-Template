// import {
//   IsString,
//   IsEnum,
//   IsOptional,
//   IsNumber,
//   IsBoolean,
//   IsArray,
//   IsUUID,
//   Min,
// } from 'class-validator';
// import { Decimal } from '@prisma/client/runtime/library';

// enum BundleScheduleType {
//   BOOKED_IN_SEQUENCE = 'BOOKED_IN_SEQUENCE',
//   BOOKED_IN_PARALLEL = 'BOOKED_IN_PARALLEL',
// }

// enum BundlePriceType {
//   REGULAR = 'REGULAR',
//   PROMOTION = 'PROMOTION',
// }

// enum BundleCategory {
//   FIXED = 'FIXED',
//   PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
// }

// export class CreateBundleDto {
//   @IsString()
//   name: string;

//   @IsEnum(BundleCategory)
//   category: BundleCategory;

//   @IsOptional()
//   @IsString()
//   description?: string;

//   @IsEnum(BundlePriceType)
//   priceType: BundlePriceType;

//   @IsNumber()
//   @Min(0)
//   price: Decimal;

//   @IsNumber()
//   @Min(0)
//   duration: number;

//   @IsEnum(BundleScheduleType)
//   scheduleType: BundleScheduleType;

//   @IsBoolean()
//   @IsOptional()
//   addToOnlineBook: boolean;

//   @IsArray()
//   @IsUUID('4', { each: true })
//   serviceId: string[];

//   @IsArray()
//   @IsUUID('4', { each: true })
//   employeeIds: string[];
//   serviceIds: any;
// }

// export class BundleQueryDto {
//   @IsOptional() @IsString() page?: string;
//   @IsOptional() @IsString() limit?: string;
//   @IsOptional() @IsString() search?: string;
//   @IsOptional() @IsEnum(BundleCategory) category?: BundleCategory;
// }

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

// ✅ reuse SAME enums (no duplication across files ideally)
export enum BundleScheduleType {
  BOOKED_IN_SEQUENCE = 'BOOKED_IN_SEQUENCE',
  BOOKED_IN_PARALLEL = 'BOOKED_IN_PARALLEL',
}

export enum BundlePriceType {
  REGULAR = 'REGULAR',
  PROMOTION = 'PROMOTION',
}

export enum BundleCategory {
  FIXED = 'FIXED',
  PERCENTAGE_DISCOUNT = 'PERCENTAGE_DISCOUNT',
}

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
  price: number;

  @IsNumber()
  @Min(0)
  duration: number;

  @IsEnum(BundleScheduleType)
  scheduleType: BundleScheduleType;

  @IsBoolean()
  @IsOptional()
  addToOnlineBook?: boolean;

  // ✅ FIXED (removed duplicate + wrong naming)
  @IsArray()
  @IsUUID('4', { each: true })
  serviceIds: string[];

  @IsArray()
  @IsUUID('4', { each: true })
  employeeIds: string[];
}

export class BundleQueryDto {
  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(BundleCategory)
  category?: BundleCategory;
}
