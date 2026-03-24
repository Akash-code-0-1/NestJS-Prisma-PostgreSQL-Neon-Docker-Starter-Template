import { IsString, IsNumber, IsOptional, IsBoolean } from 'class-validator';

export class CreateVoucherDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  subtitle?: string;

  @IsNumber()
  value: number;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discountPercent?: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsNumber()
  validityDays: number;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  theme?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
