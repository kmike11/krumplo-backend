import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email!: string;

  @ApiProperty({ minLength: 6 })
  @IsString()
  @MinLength(6)
  password!: string;

  @ApiProperty({ example: 'Jane Doe' })
  @IsString()
  displayName!: string;

  @ApiProperty({ enum: ['ADMIN', 'USER'], required: false })
  @IsOptional()
  @IsString()
  role?: string;
}
