import {
  IsString,
  IsUUID,
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ShiftIntervalDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be HH:mm',
  })
  startTime: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'Time must be HH:mm',
  })
  endTime: string;
}

export class CreateShiftDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId: string;

  @IsString()
  @IsNotEmpty()
  date: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ShiftIntervalDto)
  intervals: ShiftIntervalDto[];
}

export class UpdateShiftDto extends CreateShiftDto {}

export class ShiftQueryDto {
  @IsOptional() @IsUUID() employeeId?: string;
  @IsOptional() page?: string;
  @IsOptional() limit?: string;
}
