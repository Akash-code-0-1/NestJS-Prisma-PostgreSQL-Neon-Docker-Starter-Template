import { IsString, IsNotEmpty, MinLength } from 'class-validator';

export class SetOwnerPasswordDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(6) // Enforce a minimum length for password
  password: string;
}
