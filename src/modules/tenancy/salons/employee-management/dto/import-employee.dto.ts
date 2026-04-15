import { IsArray, IsOptional, IsString } from 'class-validator';

export class StageEmployeeImportDto {
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
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
