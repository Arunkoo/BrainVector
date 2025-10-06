import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty({ message: 'Document title cannot be empty.' })
  @MaxLength(255, { message: 'Title cannot be exceed 255 characters.' })
  title: string;

  @IsString()
  content: string;
}
