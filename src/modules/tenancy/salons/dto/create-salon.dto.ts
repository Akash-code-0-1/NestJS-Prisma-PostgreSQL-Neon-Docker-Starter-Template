import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OwnerDto } from '../../../../modules/iam/auth/salon-owners/dto/owner.dto'; // Import OwnerDto

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

  // Optional fields
  createdBy?: string; // Can be the admin creating the salon
  updatedBy?: string; // Admin who updates the salon
}
