import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { AddAttachmentDto } from './dto/add-attachment.dto';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { BoardResponseDto, CardResponseDto } from './dto/board-response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateChecklistItemDto } from './dto/create-checklist-item.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { CreateLabelDto } from './dto/create-label.dto';
import { CreateSprintDto } from './dto/create-sprint.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateCardAssigneeDto } from './dto/update-card-assignee.dto';
import { UpdateCardLabelsDto } from './dto/update-card-labels.dto';
import { UpdateCardSprintDto } from './dto/update-card-sprint.dto';
import { UpdateCardWatchersDto } from './dto/update-card-watchers.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateChecklistItemDto } from './dto/update-checklist-item.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { UpdateLabelDto } from './dto/update-label.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UpdateSprintStatusDto } from './dto/update-sprint-status.dto';
import { BoardsService } from './boards.service';
import { UserEntity } from '../users/user.entity';

@ApiTags('boards')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Get()
  async listBoards(
    @CurrentUser() user: UserEntity,
  ): Promise<BoardResponseDto[]> {
    return this.boardsService.listBoardsForUser(user.id);
  }

  @Post()
  async createBoard(
    @CurrentUser() user: UserEntity,
    @Body() dto: CreateBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.createBoard(user.id, dto);
  }

  @Get(':boardId')
  async getBoard(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
  ): Promise<BoardResponseDto> {
    return this.boardsService.getBoard(boardId, user.id);
  }

  @Patch(':boardId')
  async updateBoard(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.updateBoard(boardId, user.id, dto);
  }

  @Delete(':boardId')
  async deleteBoard(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
  ): Promise<void> {
    return this.boardsService.deleteBoard(boardId, user.id);
  }

  @Post(':boardId/members')
  async addMember(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: AddBoardMemberDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.addMember(boardId, user.id, dto);
  }

  @Delete(':boardId/members/:memberId')
  async removeMember(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('memberId') memberId: string,
  ): Promise<BoardResponseDto> {
    return this.boardsService.removeMember(boardId, user.id, memberId);
  }

  @Post(':boardId/columns')
  async createColumn(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: CreateColumnDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.createColumn(boardId, user.id, dto);
  }

  @Patch(':boardId/columns/:columnId')
  async updateColumn(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: UpdateColumnDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.updateColumn(boardId, user.id, columnId, dto);
  }

  @Patch(':boardId/columns/reorder')
  async reorderColumns(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: ReorderColumnsDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.reorderColumns(boardId, user.id, dto);
  }

  @Delete(':boardId/columns/:columnId')
  async deleteColumn(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
  ): Promise<BoardResponseDto> {
    return this.boardsService.deleteColumn(boardId, user.id, columnId);
  }

  @Post(':boardId/columns/:columnId/cards')
  async createCard(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('columnId') columnId: string,
    @Body() dto: CreateCardDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.createCard(boardId, columnId, user.id, dto);
  }

  @Patch('cards/:cardId')
  async updateCard(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateCard(cardId, user.id, dto);
  }

  @Delete('cards/:cardId')
  async deleteCard(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
  ): Promise<void> {
    return this.boardsService.deleteCard(cardId, user.id);
  }

  @Patch('cards/:cardId/move')
  async moveCard(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: MoveCardDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.moveCard(cardId, user.id, dto);
  }

  @Patch('cards/:cardId/assignee')
  async updateCardAssignee(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardAssigneeDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateCardAssignee(cardId, user.id, dto);
  }

  @Patch('cards/:cardId/watchers')
  async updateCardWatchers(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardWatchersDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateCardWatchers(cardId, user.id, dto);
  }

  @Patch('cards/:cardId/labels')
  async updateCardLabels(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardLabelsDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateCardLabels(cardId, user.id, dto);
  }

  @Post('cards/:cardId/checklist')
  async createChecklistItem(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: CreateChecklistItemDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.createChecklistItem(cardId, user.id, dto);
  }

  @Patch('cards/:cardId/checklist/:itemId')
  async updateChecklistItem(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Param('itemId') itemId: string,
    @Body() dto: UpdateChecklistItemDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateChecklistItem(cardId, user.id, itemId, dto);
  }

  @Delete('cards/:cardId/checklist/:itemId')
  async deleteChecklistItem(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Param('itemId') itemId: string,
  ): Promise<CardResponseDto> {
    return this.boardsService.deleteChecklistItem(cardId, user.id, itemId);
  }

  @Post('cards/:cardId/comments')
  async addComment(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: AddCommentDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.addComment(cardId, user.id, dto);
  }

  @Patch('cards/:cardId/comments/:commentId')
  async updateComment(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateComment(cardId, user.id, commentId, dto);
  }

  @Delete('cards/:cardId/comments/:commentId')
  async deleteComment(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Param('commentId') commentId: string,
  ): Promise<CardResponseDto> {
    return this.boardsService.deleteComment(cardId, user.id, commentId);
  }

  @Post('cards/:cardId/attachments')
  async addAttachment(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: AddAttachmentDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.addAttachment(cardId, user.id, dto);
  }

  @Delete('cards/:cardId/attachments/:attachmentId')
  async deleteAttachment(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Param('attachmentId') attachmentId: string,
  ): Promise<CardResponseDto> {
    return this.boardsService.deleteAttachment(cardId, user.id, attachmentId);
  }

  @Patch('cards/:cardId/sprint')
  async updateCardSprint(
    @CurrentUser() user: UserEntity,
    @Param('cardId') cardId: string,
    @Body() dto: UpdateCardSprintDto,
  ): Promise<CardResponseDto> {
    return this.boardsService.updateCardSprint(cardId, user.id, dto);
  }

  @Post(':boardId/labels')
  async createLabel(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: CreateLabelDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.createLabel(boardId, user.id, dto);
  }

  @Patch(':boardId/labels/:labelId')
  async updateLabel(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('labelId') labelId: string,
    @Body() dto: UpdateLabelDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.updateLabel(boardId, user.id, labelId, dto);
  }

  @Delete(':boardId/labels/:labelId')
  async deleteLabel(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('labelId') labelId: string,
  ): Promise<BoardResponseDto> {
    return this.boardsService.deleteLabel(boardId, user.id, labelId);
  }

  @Post(':boardId/sprints')
  async createSprint(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Body() dto: CreateSprintDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.createSprint(boardId, user.id, dto);
  }

  @Patch(':boardId/sprints/:sprintId')
  async updateSprint(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.updateSprint(boardId, user.id, sprintId, dto);
  }

  @Patch(':boardId/sprints/:sprintId/status')
  async updateSprintStatus(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('sprintId') sprintId: string,
    @Body() dto: UpdateSprintStatusDto,
  ): Promise<BoardResponseDto> {
    return this.boardsService.updateSprintStatus(
      boardId,
      user.id,
      sprintId,
      dto,
    );
  }

  @Delete(':boardId/sprints/:sprintId')
  async deleteSprint(
    @CurrentUser() user: UserEntity,
    @Param('boardId') boardId: string,
    @Param('sprintId') sprintId: string,
  ): Promise<BoardResponseDto> {
    return this.boardsService.deleteSprint(boardId, user.id, sprintId);
  }
}
