import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsUUID } from 'class-validator';

export class UpdateCardAssigneeDto {
  @ApiPropertyOptional({
    format: 'uuid',
    description: 'Leave empty to unassign',
  })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}
