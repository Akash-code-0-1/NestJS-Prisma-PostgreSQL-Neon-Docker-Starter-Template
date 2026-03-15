import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
} from 'class-validator';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  serviceName: string;

  @IsArray()
  @IsString({ each: true })
  categories: string[];

  @IsNumber()
  duration: number;

  @IsNumber()
  postBreakMin: number;

  @IsNumber()
  price: number;

  @IsNumber()
  vat: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsArray()
  @IsString({ each: true })
  employeeIds: string[];

  @IsOptional()
  @IsString()
  icon?: string;
}
