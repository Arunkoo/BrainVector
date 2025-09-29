import { IsUUID, IsNotEmpty } from 'class-validator';

export class InviteUserDto {
  @IsUUID('4', { message: 'Invited user ID must be a valid UUID' })
  @IsNotEmpty()
  invitedUserId: string;
}
