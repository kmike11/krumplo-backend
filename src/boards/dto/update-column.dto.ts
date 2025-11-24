import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class UpdateColumnDto {
  @ApiPropertyOptional({ example: 'In Progress' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  position?: number;
}
