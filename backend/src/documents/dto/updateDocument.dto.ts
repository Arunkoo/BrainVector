import { IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateDocumentDto {
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Title cannot exceed 255 characters.' })
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}
