import {
  IsOptional,
  IsEnum,
  IsString,
  IsInt,
  Min,
  IsUUID,
  IsEmail,
  IsArray,
  IsNumber,
  IsDateString,
  IsNotEmpty,
  IsBoolean,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export enum RepeatFrequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  EVERY_2_WEEKS = 'EVERY_2_WEEKS',
  MONTHLY = 'MONTHLY',
  QUARTERLY = 'QUARTERLY',
  YEARLY = 'YEARLY',
}

export enum EmployeeActionType {
  ADD_TIME_OFF = 'ADD_TIME_OFF',
  TERMINATE_CONTRACT = 'TERMINATE_CONTRACT',
  DISABLE_ACCESS = 'DISABLE_ACCESS',
  ENABLE_ACCESS = 'ENABLE_ACCESS',
}

export class LanguageDto {
  @IsString() name: string;
  @IsString() level: string;
}

export class MemberIdParamDto {
  @IsUUID() @IsNotEmpty() id: string;
}

export class MemberProfileQueryDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) servicePage?: number = 1;
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) serviceLimit?: number = 5;
}

export class FilterEmployeeDto {
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Type(() => Number) @Min(1) limit?: number = 20;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() employmentStatus?: string;
  @IsOptional() @IsString() sortBy?: string;
  @IsOptional() @IsString() sortOrder?: 'asc' | 'desc' = 'desc';
}

export class TimeOffDto {
  @IsString() type: string;
  @IsDateString() startDate: string;
  @IsDateString() endDate: string;
  @IsOptional() @IsString() startTime?: string;
  @IsOptional() @IsString() endTime?: string;
  @IsBoolean() repeat: boolean;
  @IsOptional() @IsEnum(RepeatFrequency) repeatFrequency?: RepeatFrequency;
  @IsOptional() @IsString() description?: string;
}

export class EmployeeActionDto {
  @IsEnum(EmployeeActionType) action: EmployeeActionType;
  @IsOptional() @IsDateString() date?: string;
  @IsOptional() @IsString() note?: string;
}

export class UpdateMemberDto {
  @IsOptional() @IsString() firstName?: string;
  @IsOptional() @IsString() lastName?: string;
  @IsOptional() @IsEmail() email?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() gender?: string;
  @IsOptional() @IsInt() age?: number;
  @IsOptional() @IsString() dob?: string;
  @IsOptional() @IsString() designation?: string;
  @IsOptional() @IsNumber() salary?: number;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() city?: string;
  @IsOptional() @IsString() province?: string;
  @IsOptional() @IsString() cap?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) certifications?: string[];
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  completedCourses?: string[];
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LanguageDto)
  languages?: LanguageDto[];
  @IsOptional() @IsUUID() directManagerId?: string;
  @IsOptional() @IsDateString() startDate?: string;
  @IsOptional() @IsDateString() endDate?: string;
}
