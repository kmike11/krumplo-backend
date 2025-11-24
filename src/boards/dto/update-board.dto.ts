import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateBoardDto {
  @ApiPropertyOptional({ example: 'Release Readiness' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: 'Updated description for stakeholders' })
  @IsOptional()
  @IsString()
  description?: string;
}
