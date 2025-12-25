import { IsEmail, IsEnum } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class InviteUserDto {
  @IsEmail()
  invitedUserEmail: string;

  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
