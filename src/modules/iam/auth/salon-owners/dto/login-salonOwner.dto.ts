import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class LoginSalonOwnerDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
