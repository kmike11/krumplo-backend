import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString } from 'class-validator';

export class CreateSprintDto {
  @ApiProperty({ example: 'Sprint 12' })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ example: 'Finalize payment integration' })
  @IsOptional()
  @IsString()
  goal?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ format: 'date-time' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}
