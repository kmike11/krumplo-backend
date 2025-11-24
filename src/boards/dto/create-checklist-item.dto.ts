import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreateChecklistItemDto {
  @ApiProperty({ example: 'Write unit tests' })
  @IsString()
  @IsNotEmpty()
  content!: string;
}
