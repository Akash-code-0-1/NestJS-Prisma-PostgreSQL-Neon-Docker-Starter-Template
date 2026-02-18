import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterSalonDto {
  @IsOptional()
  @IsNumberString()
  page?: string;

  @IsOptional()
  @IsNumberString()
  limit?: string;

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
  minEmployees?: string;

  @IsOptional()
  @IsNumberString()
  maxEmployees?: string;

  @IsOptional()
  @IsNumberString()
  minRevenue?: string;

  @IsOptional()
  @IsNumberString()
  maxRevenue?: string;

  @IsOptional()
  @IsNumberString()
  minSupport?: string;

  @IsOptional()
  @IsNumberString()
  maxSupport?: string;
}
