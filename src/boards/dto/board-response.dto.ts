import { ApiProperty } from '@nestjs/swagger';
import { CardPriority } from '../../common/enums/card-priority.enum';
import { CardType } from '../../common/enums/card-type.enum';
import { UserResponseDto } from '../../users/dto/user-response.dto';

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

  @ApiProperty({ type: () => [CommentResponseDto] })
  comments!: CommentResponseDto[];

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

  @ApiProperty()
  createdAt!: string;

  @ApiProperty()
  updatedAt!: string;
}
