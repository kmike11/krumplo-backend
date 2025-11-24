import { ApiProperty } from '@nestjs/swagger';
import { IsHexColor, IsNotEmpty, IsString } from 'class-validator';

export class CreateLabelDto {
  @ApiProperty({ example: 'Backend' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: '#ffb020' })
  @IsString()
  @IsHexColor()
  color!: string;
}
