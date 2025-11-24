import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AddCommentDto {
  @ApiProperty({ example: 'Remember to sync with the QA team on staging.' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
