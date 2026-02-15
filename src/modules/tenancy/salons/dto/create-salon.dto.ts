import {
  IsString,
  IsEmail,
  IsNotEmpty,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class OwnerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  id: any;
  email: string;
  invitationSent: boolean;
}

export class CreateSalonDto {
  @IsString() @IsNotEmpty() name: string;
  @IsString() @IsNotEmpty() businessType: string;
  @IsString() @IsNotEmpty() vtaNumber: string;
  @IsString() @IsNotEmpty() employeeCount: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OwnerDto)
  owners: OwnerDto[];

  @IsEmail() email: string;
  @IsString() @IsNotEmpty() phoneNumber: string;
  @IsString() @IsNotEmpty() country: string;
  @IsString() @IsNotEmpty() city: string;
  @IsString() @IsNotEmpty() province: string;
  @IsString() @IsNotEmpty() zipCode: string;
  @IsString() @IsNotEmpty() trialPeriod: string;
  @IsString() @IsNotEmpty() initialPlan: string;
}
