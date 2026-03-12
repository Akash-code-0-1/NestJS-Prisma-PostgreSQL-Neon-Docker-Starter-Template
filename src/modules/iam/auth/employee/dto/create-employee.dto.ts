import { IsNotEmpty, IsEmail, IsOptional } from 'class-validator';

export class CreateEmployeeDto {
  @IsNotEmpty()
  firstName: string;

  @IsNotEmpty()
  lastName: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  salary: number;

  @IsNotEmpty()
  designation: string;

  @IsNotEmpty()
  dob: string;

  @IsNotEmpty()
  address: string;

  @IsNotEmpty()
  city: string;

  @IsNotEmpty()
  province: string;

  @IsNotEmpty()
  cap: string;

  @IsOptional()
  emcName?: string;

  @IsOptional()
  emcNumber?: string;

  @IsNotEmpty()
  contractType: string;

  @IsNotEmpty()
  taxIdCode: string;

  @IsOptional()
  iban?: string;

  @IsNotEmpty()
  startDate: Date;

  @IsNotEmpty()
  endDate: Date;

  @IsNotEmpty()
  remunerationType: string;
}
