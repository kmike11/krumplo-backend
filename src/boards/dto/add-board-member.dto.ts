import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsUUID, ValidateIf } from 'class-validator';

export class AddBoardMemberDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @ValidateIf((dto: AddBoardMemberDto) => !dto.email)
  @IsUUID()
  userId?: string;

  @ApiPropertyOptional({ example: 'new.member@example.com' })
  @ValidateIf((dto: AddBoardMemberDto) => !dto.userId)
  @IsEmail()
  email?: string;
}
