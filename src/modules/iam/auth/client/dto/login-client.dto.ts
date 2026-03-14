import { IsEmail, IsNotEmpty } from 'class-validator';

export class LoginClientDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  password: string;
}
