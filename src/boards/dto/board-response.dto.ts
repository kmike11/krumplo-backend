import { ApiProperty } from '@nestjs/swagger';
import { CardPriority } from '../../common/enums/card-priority.enum';
import { CardType } from '../../common/enums/card-type.enum';
import { SprintStatus } from '../../common/enums/sprint-status.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';

export class ChecklistItemResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty()
  completed!: boolean;

  @ApiProperty()
  position!: number;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CommentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  content!: string;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  author?: UserResponseDto;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class AttachmentResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  url!: string;

  @ApiProperty({ nullable: true })
  mimeType?: string;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  uploadedBy?: UserResponseDto;

  @ApiProperty()
  createdAt!: string;
}

export class LabelResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty()
  color!: string;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class SprintResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  goal?: string;

  @ApiProperty({ nullable: true })
  startDate?: string;

  @ApiProperty({ nullable: true })
  endDate?: string;

  @ApiProperty({ enum: SprintStatus })
  status!: SprintStatus;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class CardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty()
  position!: number;

  @ApiProperty({ nullable: true })
  dueDate?: string;

  @ApiProperty({ enum: CardPriority })
  priority!: CardPriority;

  @ApiProperty({ enum: CardType })
  type!: CardType;

  @ApiProperty({ nullable: true })
  storyPoints?: number;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  assignee?: UserResponseDto;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  reporter?: UserResponseDto;

  @ApiProperty({ type: () => [UserResponseDto] })
  watchers!: UserResponseDto[];

  @ApiProperty({ type: () => [LabelResponseDto] })
  labels!: LabelResponseDto[];

  @ApiProperty({ type: () => [ChecklistItemResponseDto] })
  checklistItems!: ChecklistItemResponseDto[];

  @ApiProperty({ type: () => [CommentResponseDto] })
  comments!: CommentResponseDto[];

  @ApiProperty({ type: () => [AttachmentResponseDto] })
  attachments!: AttachmentResponseDto[];

  @ApiProperty({ type: () => SprintResponseDto, nullable: true })
  sprint?: SprintResponseDto;

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class BoardColumnResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty()
  position!: number;

  @ApiProperty({ type: () => [CardResponseDto] })
  cards!: CardResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}

export class BoardResponseDto {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  name!: string;

  @ApiProperty({ nullable: true })
  description?: string;

  @ApiProperty({ type: () => UserResponseDto, nullable: true })
  owner?: UserResponseDto;

  @ApiProperty({ type: () => [UserResponseDto] })
  members!: UserResponseDto[];

  @ApiProperty({ type: () => [BoardColumnResponseDto] })
  columns!: BoardColumnResponseDto[];

  @ApiProperty({ type: () => [LabelResponseDto] })
  labels!: LabelResponseDto[];

  @ApiProperty({ type: () => [SprintResponseDto] })
  sprints!: SprintResponseDto[];

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
