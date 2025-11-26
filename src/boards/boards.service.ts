import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CardPriority } from '../common/enums/card-priority.enum';
import { CardType } from '../common/enums/card-type.enum';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { AddBoardMemberDto } from './dto/add-board-member.dto';
import {
  BoardResponseDto,
  BoardColumnResponseDto,
  CardResponseDto,
} from './dto/board-response.dto';
import { CreateBoardDto } from './dto/create-board.dto';
import { CreateCardDto } from './dto/create-card.dto';
import { CreateColumnDto } from './dto/create-column.dto';
import { MoveCardDto } from './dto/move-card.dto';
import { ReorderColumnsDto } from './dto/reorder-columns.dto';
import { UpdateBoardDto } from './dto/update-board.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { UpdateColumnDto } from './dto/update-column.dto';
import { BoardColumnEntity } from './entities/board-column.entity';
import { BoardEntity } from './entities/board.entity';
import { CardEntity } from './entities/card.entity';
import { CommentEntity } from './entities/comment.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Injectable()
export class BoardsService {
  private readonly boardRelations = {
    owner: true,
    members: true,
    columns: {
      cards: {
        assignee: true,
        reporter: true,
        comments: { author: true },
      },
    },
  } as const;

  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardColumnEntity)
    private readonly columnRepository: Repository<BoardColumnEntity>,
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    private readonly usersService: UsersService,
  ) {}

  async listBoardsForUser(userId: string): Promise<BoardResponseDto[]> {
    const boardIds = await this.boardRepository
      .createQueryBuilder('board')
      .leftJoin('board.members', 'member')
      .leftJoin('board.owner', 'owner')
      .select('board.id', 'id')
      .where('member.id = :userId', { userId })
      .orWhere('owner.id = :userId', { userId })
      .getRawMany<{ id: string }>();

    const uniqueIds = Array.from(
      new Set<string>(boardIds.map((row) => row.id)),
    );

    const result: BoardResponseDto[] = [];
    for (const id of uniqueIds) {
      const board = await this.findBoardOrFail(id);
      this.ensureBoardMember(board, userId);
      result.push(this.toBoardResponseDto(board));
    }

    return result;
  }

  async createBoard(
    ownerId: string,
    dto: CreateBoardDto,
  ): Promise<BoardResponseDto> {
    const owner = await this.usersService.findByIdOrFail(ownerId);
    const board = this.boardRepository.create({
      name: dto.name,
      description: dto.description,
      owner,
      members: [owner],
    });

    await this.boardRepository.save(board);
    const created = await this.findBoardOrFail(board.id);
    return this.toBoardResponseDto(created);
  }

  async getBoard(boardId: string, userId: string): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);
    return this.toBoardResponseDto(board);
  }

  async updateBoard(
    boardId: string,
    userId: string,
    dto: UpdateBoardDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardManager(board, userId);

    if (dto.name) {
      board.name = dto.name;
    }
    if (dto.description !== undefined) {
      board.description = dto.description;
    }

    await this.boardRepository.save(board);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async deleteBoard(boardId: string, userId: string): Promise<void> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardManager(board, userId);
    await this.boardRepository.delete(boardId);
  }

  async addMember(
    boardId: string,
    actorId: string,
    dto: AddBoardMemberDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardManager(board, actorId);

    if (!dto.userId && !dto.email) {
      throw new BadRequestException('Provide either userId or email');
    }

    const targetUser = dto.userId
      ? await this.usersService.findByIdOrFail(dto.userId)
      : await this.findUserByEmailOrFail(dto.email!);

    const alreadyInBoard =
      (board.members ?? []).some((member) => member.id === targetUser.id) ||
      board.owner?.id === targetUser.id;
    if (alreadyInBoard) {
      return this.toBoardResponseDto(board);
    }

    board.members = [...(board.members ?? []), targetUser];

    await this.boardRepository.save(board);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async removeMember(
    boardId: string,
    actorId: string,
    memberId: string,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardManager(board, actorId);

    if (board.owner?.id === memberId) {
      throw new BadRequestException('Cannot remove the board owner');
    }

    board.members = (board.members ?? []).filter(
      (member) => member.id !== memberId,
    );
    await this.boardRepository.save(board);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async createColumn(
    boardId: string,
    userId: string,
    dto: CreateColumnDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const nextPosition = dto.position ?? board.columns?.length ?? 0;
    const column = this.columnRepository.create({
      title: dto.title,
      position: nextPosition,
      board,
    });

    await this.columnRepository.save(column);
    await this.resequenceColumns(boardId);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async updateColumn(
    boardId: string,
    userId: string,
    columnId: string,
    dto: UpdateColumnDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const column = board.columns?.find((col) => col.id === columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    if (dto.title !== undefined) {
      column.title = dto.title;
    }
    if (dto.position !== undefined) {
      column.position = dto.position;
    }

    await this.columnRepository.save(column);
    if (dto.position !== undefined) {
      await this.resequenceColumns(boardId);
    }

    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async reorderColumns(
    boardId: string,
    userId: string,
    dto: ReorderColumnsDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const columns = board.columns ?? [];
    if (columns.length !== dto.columnOrder.length) {
      throw new BadRequestException(
        'Column order does not match existing columns',
      );
    }

    const orderMap = new Map(
      dto.columnOrder.map((columnId, index) => [columnId, index]),
    );
    for (const column of columns) {
      const newPosition = orderMap.get(column.id);
      if (newPosition === undefined) {
        throw new BadRequestException('Column order missing existing column');
      }
      column.position = newPosition;
    }

    await this.columnRepository.save(columns);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async deleteColumn(
    boardId: string,
    userId: string,
    columnId: string,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const column = board.columns?.find((col) => col.id === columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    await this.columnRepository.delete(columnId);
    await this.resequenceColumns(boardId);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async createCard(
    boardId: string,
    columnId: string,
    userId: string,
    dto: CreateCardDto,
  ): Promise<CardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const column = board.columns?.find((col) => col.id === columnId);
    if (!column) {
      throw new NotFoundException('Column not found');
    }

    const card = this.cardRepository.create({
      title: dto.title,
      description: dto.description,
      position: column.cards?.length ?? 0,
      dueDate: dto.dueDate ? new Date(dto.dueDate) : undefined,
      priority: dto.priority ?? CardPriority.MEDIUM,
      type: dto.type ?? CardType.TASK,
      storyPoints: dto.storyPoints,
      column,
      board,
    });

    if (dto.assigneeId) {
      card.assignee = await this.loadBoardMember(board, dto.assigneeId);
    }

    if (dto.reporterId) {
      card.reporter = await this.loadBoardMember(board, dto.reporterId);
    }

    await this.cardRepository.save(card);
    const saved = await this.findCardOrFail(card.id);
    this.ensureBoardMember(saved.board, userId);
    return this.toCardResponseDto(saved);
  }

  async updateCard(
    cardId: string,
    userId: string,
    dto: UpdateCardDto,
  ): Promise<CardResponseDto> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    if (dto.title !== undefined) {
      card.title = dto.title;
    }
    if (dto.description !== undefined) {
      card.description = dto.description;
    }
    if (dto.priority !== undefined) {
      card.priority = dto.priority;
    }
    if (dto.type !== undefined) {
      card.type = dto.type;
    }
    if (dto.dueDate !== undefined) {
      card.dueDate = dto.dueDate ? new Date(dto.dueDate) : undefined;
    }
    if (dto.storyPoints !== undefined) {
      card.storyPoints = dto.storyPoints;
    }
    if (dto.assigneeId !== undefined) {
      card.assignee = dto.assigneeId
        ? await this.loadBoardMember(card.board, dto.assigneeId)
        : undefined;
    }
    if (dto.reporterId !== undefined) {
      card.reporter = dto.reporterId
        ? await this.loadBoardMember(card.board, dto.reporterId)
        : undefined;
    }
    await this.cardRepository.save(card);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async deleteCard(cardId: string, userId: string): Promise<void> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const columnId = card.column.id;
    await this.cardRepository.delete(cardId);
    await this.resequenceCards(columnId);
  }

  async moveCard(
    cardId: string,
    userId: string,
    dto: MoveCardDto,
  ): Promise<CardResponseDto> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const targetColumn = await this.columnRepository.findOne({
      where: { id: dto.targetColumnId },
      relations: { board: { members: true, owner: true } },
    });
    if (!targetColumn || targetColumn.board.id !== card.board.id) {
      throw new BadRequestException(
        'Target column must belong to the same board',
      );
    }

    const previousColumnId = card.column.id;
    card.column = targetColumn;
    card.position = dto.targetPosition ?? targetColumn.cards?.length ?? 0;

    await this.cardRepository.save(card);
    await this.resequenceCards(previousColumnId);
    await this.resequenceCards(targetColumn.id);

    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async addComment(cardId: string, userId: string, dto: AddCommentDto) {
    const card = await this.findCardOrFail(cardId);
    const author = await this.loadBoardMember(card.board, userId);

    const comment = this.commentRepository.create({
      content: dto.content,
      card,
      author,
    });

    await this.commentRepository.save(comment);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async updateComment(
    cardId: string,
    userId: string,
    commentId: string,
    dto: UpdateCommentDto,
  ) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const comment = card.comments?.find((comm) => comm.id === commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (!comment.author || comment.author.id !== userId) {
      throw new ForbiddenException('Only the author can edit comments');
    }

    comment.content = dto.content;
    await this.commentRepository.save(comment);

    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async deleteComment(cardId: string, userId: string, commentId: string) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const comment = card.comments?.find((comm) => comm.id === commentId);
    if (!comment) {
      throw new NotFoundException('Comment not found');
    }

    if (
      comment.author &&
      comment.author.id !== userId &&
      !this.isBoardManager(card.board, userId)
    ) {
      throw new ForbiddenException(
        'Only the author or board managers can delete comments',
      );
    }

    await this.commentRepository.delete(commentId);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  private async findBoardOrFail(boardId: string): Promise<BoardEntity> {
    const board = await this.boardRepository.findOne({
      where: { id: boardId },
      relations: this.boardRelations,
      order: {
        columns: {
          position: 'ASC',
          cards: {
            position: 'ASC',
          },
        },
      },
    });

    if (!board) {
      throw new NotFoundException('Board not found');
    }

    this.normalizeBoardSort(board);
    return board;
  }

  private async findCardOrFail(cardId: string): Promise<CardEntity> {
    const card = await this.cardRepository.findOne({
      where: { id: cardId },
      relations: {
        board: { members: true, owner: true },
        column: { board: { members: true, owner: true } },
        assignee: true,
        reporter: true,
        comments: { author: true },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }
    return card;
  }

  private normalizeBoardSort(board: BoardEntity) {
    board.columns = [...(board.columns ?? [])].sort(
      (a, b) => a.position - b.position,
    );
    for (const column of board.columns) {
      column.cards = [...(column.cards ?? [])].sort(
        (a, b) => a.position - b.position,
      );
    }
  }

  private ensureBoardMember(board: BoardEntity, userId: string) {
    const isMember = (board.members ?? []).some(
      (member) => member.id === userId,
    );
    if (!isMember && board.owner?.id !== userId) {
      throw new ForbiddenException(
        'You must be a member of the board to perform this action',
      );
    }
  }

  private ensureBoardManager(board: BoardEntity, userId: string) {
    const isManager = this.isBoardManager(board, userId);
    if (!isManager) {
      throw new ForbiddenException(
        'Only board owner or administrators can perform this action',
      );
    }
  }

  private isBoardManager(board: BoardEntity, userId: string) {
    if (board.owner?.id === userId) {
      return true;
    }

    const user = (board.members ?? []).find((member) => member.id === userId);
    return user?.role === UserRole.ADMIN;
  }

  private async loadBoardMember(board: BoardEntity, memberId: string) {
    const members = await this.loadBoardMembers(board, [memberId]);
    return members[0];
  }

  private async loadBoardMembers(board: BoardEntity, memberIds: string[]) {
    const ids = Array.from(new Set(memberIds)).filter(Boolean);
    if (!ids.length) {
      return [];
    }

    const members = await Promise.all(
      ids.map((id) => this.usersService.findByIdOrFail(id)),
    );
    for (const member of members) {
      const belongsToBoard =
        (board.members ?? []).some((existing) => existing.id === member.id) ||
        board.owner?.id === member.id;
      if (!belongsToBoard) {
        throw new BadRequestException(
          'All referenced users must belong to the board',
        );
      }
    }

    return members;
  }

  private async resequenceColumns(boardId: string) {
    const columns = await this.columnRepository.find({
      where: { board: { id: boardId } },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    columns.forEach((column, index) => {
      column.position = index;
    });

    await this.columnRepository.save(columns);
  }

  private async resequenceCards(columnId: string) {
    const cards = await this.cardRepository.find({
      where: { column: { id: columnId } },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    cards.forEach((card, index) => {
      card.position = index;
    });

    await this.cardRepository.save(cards);
  }

  private toBoardResponseDto(board: BoardEntity): BoardResponseDto {
    return {
      id: board.id,
      name: board.name,
      description: board.description ?? undefined,
      owner: board.owner
        ? this.usersService.toResponseDto(board.owner)
        : undefined,
      members: (board.members ?? []).map((member) =>
        this.usersService.toResponseDto(member),
      ),
      columns: (board.columns ?? []).map((column) =>
        this.toColumnResponseDto(column),
      ),
      createdAt: this.toIsoString(board.createdAt),
      updatedAt: this.toIsoString(board.updatedAt),
    };
  }

  private toColumnResponseDto(
    column: BoardColumnEntity,
  ): BoardColumnResponseDto {
    return {
      id: column.id,
      title: column.title,
      position: column.position,
      cards: (column.cards ?? []).map((card) => this.toCardResponseDto(card)),
      createdAt: this.toIsoString(column.createdAt),
      updatedAt: this.toIsoString(column.updatedAt),
    };
  }

  private toCardResponseDto(card: CardEntity): CardResponseDto {
    return {
      id: card.id,
      title: card.title,
      description: card.description,
      position: card.position,
      dueDate: card.dueDate?.toISOString(),
      priority: card.priority,
      type: card.type,
      storyPoints: card.storyPoints ?? undefined,
      assignee: card.assignee
        ? this.usersService.toResponseDto(card.assignee)
        : undefined,
      reporter: card.reporter
        ? this.usersService.toResponseDto(card.reporter)
        : undefined,
      comments: (card.comments ?? []).map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author
          ? this.usersService.toResponseDto(comment.author)
          : undefined,
        createdAt: this.toIsoString(comment.createdAt),
        updatedAt: this.toIsoString(comment.updatedAt),
      })),
      createdAt: this.toIsoString(card.createdAt),
      updatedAt: this.toIsoString(card.updatedAt),
    };
  }

  private toIsoString(value: Date | string): string {
    if (value instanceof Date) {
      return value.toISOString();
    }

    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
      throw new Error(
        'Invalid date value encountered while mapping board data',
      );
    }

    return parsed.toISOString();
  }

  private async findUserByEmailOrFail(email: string) {
    const normalized = email.trim().toLowerCase();
    const user = await this.usersService.findByEmail(normalized);
    if (!user) {
      throw new NotFoundException(`User with email ${normalized} not found`);
    }
    return user;
  }
}
