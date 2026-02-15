// src/modules/tenancy/salons/dto/set-owner-password.dto.ts
import { IsString, MinLength } from 'class-validator';

export class SetOwnerPasswordDto {
  @IsString()
  @MinLength(6)
  password: string;
}
