import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsHexColor, IsOptional, IsString } from 'class-validator';

export class UpdateLabelDto {
  @ApiPropertyOptional({ example: 'Frontend' })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ example: '#34a853' })
  @IsOptional()
  @IsHexColor()
  color?: string;
}
