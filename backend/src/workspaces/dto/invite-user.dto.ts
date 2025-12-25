import { IsEmail, IsEnum, IsOptional } from 'class-validator';
import { WorkspaceRole } from '@prisma/client';

export class InviteUserDto {
  @IsEmail()
  invitedUserEmail: string;

  @IsOptional()
  @IsEnum(WorkspaceRole)
  role: WorkspaceRole;
}
