import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateCardLabelsDto {
  @ApiProperty({
    type: [String],
    description: 'Complete list of label ids applied to the card',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  labelIds!: string[];
}
