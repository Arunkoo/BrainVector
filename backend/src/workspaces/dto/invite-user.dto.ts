import { IsNotEmpty, IsEmail } from 'class-validator';

export class InviteUserDto {
  @IsEmail()
  @IsNotEmpty()
  inviteEmail: string;
}
