import { IsEnum, IsNotEmpty } from 'class-validator';

export class UpdateMemberRoleDto {
  @IsNotEmpty()
  @IsEnum(['Editor', 'Viewer'])
  role: 'Editor' | 'Viewer';
}
