import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateBoardDto {
  @ApiProperty({ example: 'Product Roadmap' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ required: false, example: 'Planning the next major release' })
  @IsOptional()
  @IsString()
  description?: string;
}
