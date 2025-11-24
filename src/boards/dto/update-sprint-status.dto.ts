import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { SprintStatus } from '../../common/enums/sprint-status.enum';

export class UpdateSprintStatusDto {
  @ApiProperty({ enum: SprintStatus })
  @IsEnum(SprintStatus)
  status!: SprintStatus;
}
