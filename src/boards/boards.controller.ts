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
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import { AddCommentDto } from './dto/add-comment.dto';
import { BoardResponseDto, CardResponseDto } from './dto/board-response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
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
}
