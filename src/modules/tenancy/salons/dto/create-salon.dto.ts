import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OwnerDto } from '../../../../modules/iam/auth/salon-owners/dto/owner.dto';

export type PlanType = 'BASIC' | 'PREMIUM' | 'ENTERPRISE';

export class CreateSalonDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  businessType: string;

  @IsString()
  @IsNotEmpty()
  vtaNumber: string;

  @IsString()
  @IsNotEmpty()
  employeeCount: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnerDto)
  owners: OwnerDto[];

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @IsString()
  @IsNotEmpty()
  country: string;

  @IsString()
  @IsNotEmpty()
  city: string;

  @IsString()
  @IsNotEmpty()
  province: string;

  @IsString()
  @IsNotEmpty()
  zipCode: string;

  @IsString()
  @IsNotEmpty()
  trialPeriod: string;

  @IsEnum(['BASIC', 'PREMIUM', 'ENTERPRISE'] as const)
  initialPlan: PlanType;
}
