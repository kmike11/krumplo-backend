import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class MoveCardDto {
  @ApiProperty({ format: 'uuid' })
  @IsUUID()
  targetColumnId!: string;

  @ApiPropertyOptional({
    minimum: 0,
    description: 'New zero-based index within the target column',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  targetPosition?: number;
}
