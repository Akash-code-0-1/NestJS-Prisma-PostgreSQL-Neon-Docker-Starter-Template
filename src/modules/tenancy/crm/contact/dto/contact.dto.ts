import { IsString, IsEmail, IsNotEmpty, MaxLength } from 'class-validator';

export class CreateContactDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  subject: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  message: string;
}
