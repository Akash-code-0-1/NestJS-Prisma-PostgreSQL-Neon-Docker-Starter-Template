// filter-employee.dto.ts
import { IsOptional, IsEnum, IsString, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

// Lowercase-friendly enums
export const EmploymentStatusValues = [
  'active',
  'inactive',
  'pending',
] as const;
export const ContractTypeValues = [
  'full time',
  'part time',
  'contract',
] as const;

export type EmploymentStatus = (typeof EmploymentStatusValues)[number];
export type ContractType = (typeof ContractTypeValues)[number];

export class FilterEmployeeDto {
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsString()
  role?: string;

  @IsOptional()
  @IsEnum(EmploymentStatusValues, {
    message: `employmentStatus must be one of: ${EmploymentStatusValues.join(', ')}`,
  })
  employmentStatus?: EmploymentStatus;

  @IsOptional()
  @IsString()
  profileStatus?: string;

  @IsOptional()
  @IsEnum(ContractTypeValues, {
    message: `contractType must be one of: ${ContractTypeValues.join(', ')}`,
  })
  contractType?: ContractType;

  @IsOptional()
  @IsString()
  sortBy?: string;

  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsString()
  province?: string;
}
