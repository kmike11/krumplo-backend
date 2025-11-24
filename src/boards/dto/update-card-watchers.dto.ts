import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID } from 'class-validator';

export class UpdateCardWatchersDto {
  @ApiProperty({
    type: [String],
    description: 'Complete list of watcher user ids',
  })
  @IsArray()
  @IsUUID('all', { each: true })
  watcherIds!: string[];
}
