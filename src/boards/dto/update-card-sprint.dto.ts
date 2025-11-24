import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateCardSprintDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description:
      'Sprint identifier to link the card to. Omit to remove from sprint.',
  })
  @IsOptional()
  @IsUUID()
  sprintId?: string;
}
