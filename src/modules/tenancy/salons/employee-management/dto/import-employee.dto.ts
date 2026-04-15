import { IsArray, IsString, IsOptional, IsNumber } from 'class-validator';

export class stageEmployeeImportDto {
  @IsArray()
  items: any[];
}

export class BulkEmployeeActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class EmployeeImportQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;
  @IsOptional()
  @IsNumber()
  limit?: number;
}
