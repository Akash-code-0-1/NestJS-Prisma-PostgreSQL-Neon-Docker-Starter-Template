import { IsString, IsNotEmpty, IsEmail } from 'class-validator';

export class OwnerDto {
  @IsString() @IsNotEmpty() firstName: string;
  @IsString() @IsNotEmpty() lastName: string;
  id: any;
  @IsEmail() email: string;
  invitationSent: boolean;
}
