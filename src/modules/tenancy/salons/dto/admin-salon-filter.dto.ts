import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterSalonDto {
  @IsOptional()
  @IsNumberString()
  page?: number;

  @IsOptional()
  @IsNumberString()
  limit?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  @IsString()
  country?: string;

  @IsOptional()
  @IsString()
  province?: string;

  @IsOptional()
  @IsString()
  city?: string;

  @IsOptional()
  @IsNumberString()
  minEmployees?: number;

  @IsOptional()
  @IsNumberString()
  maxEmployees?: number;

  @IsOptional()
  @IsNumberString()
  minRevenue?: number;

  @IsOptional()
  @IsNumberString()
  maxRevenue?: number;

  @IsOptional()
  @IsNumberString()
  minSupport?: number;

  @IsOptional()
  @IsNumberString()
  maxSupport?: number;

  @IsOptional()
  @IsNumberString()
  refresh?: string;
}
