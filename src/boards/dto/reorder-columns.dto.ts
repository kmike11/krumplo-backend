import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsUUID } from 'class-validator';

export class ReorderColumnsDto {
  @ApiProperty({
    type: [String],
    description: 'Ordered list of column identifiers',
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  columnOrder!: string[];
}
