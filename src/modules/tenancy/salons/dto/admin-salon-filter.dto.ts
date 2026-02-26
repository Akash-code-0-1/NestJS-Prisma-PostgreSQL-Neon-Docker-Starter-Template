import { IsOptional, IsString, IsNumberString } from 'class-validator';

export class FilterSalonDto {
  @IsOptional()
  @IsNumberString()
  page?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  limit?: number; // Change from string to number

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
  minEmployees?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  maxEmployees?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  minRevenue?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  maxRevenue?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  minSupport?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  maxSupport?: number; // Change from string to number

  @IsOptional()
  @IsNumberString()
  refresh?: string;
}
