import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class StageServiceImportDto {
  @IsArray()
  items: any[];
}

export class BulkActionDto {
  @IsArray()
  @IsString({ each: true })
  ids: string[];
}

export class ImportQueryDto {
  @IsOptional()
  @IsNumber()
  page?: number;
  @IsOptional()
  @IsNumber()
  limit?: number;
}
