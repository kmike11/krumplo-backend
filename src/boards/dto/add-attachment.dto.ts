import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsUrl } from 'class-validator';

export class AddAttachmentDto {
  @ApiProperty({ example: 'UI Mockup' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'https://example.com/mockup.png' })
  @IsString()
  @IsUrl()
  url!: string;

  @ApiPropertyOptional({ example: 'image/png' })
  @IsOptional()
  @IsString()
  mimeType?: string;
}
