import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CardPriority } from '../common/enums/card-priority.enum';
import { CardType } from '../common/enums/card-type.enum';
import { SprintStatus } from '../common/enums/sprint-status.enum';
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
import { UpdateLabelDto } from './dto/update-label.dto';
import { UpdateSprintDto } from './dto/update-sprint.dto';
import { UpdateSprintStatusDto } from './dto/update-sprint-status.dto';
import { BoardColumnEntity } from './entities/board-column.entity';
import { BoardEntity } from './entities/board.entity';
import { CardEntity } from './entities/card.entity';
import { ChecklistItemEntity } from './entities/checklist-item.entity';
import { CommentEntity } from './entities/comment.entity';
import { LabelEntity } from './entities/label.entity';
import { AttachmentEntity } from './entities/attachment.entity';
import { SprintEntity } from './entities/sprint.entity';
import { AddCommentDto } from './dto/add-comment.dto';
import { AddAttachmentDto } from './dto/add-attachment.dto';
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
        watchers: true,
        labels: true,
        checklistItems: true,
        comments: { author: true },
        attachments: { uploadedBy: true },
        sprint: true,
      },
    },
    labels: true,
    sprints: true,
  } as const;

  constructor(
    @InjectRepository(BoardEntity)
    private readonly boardRepository: Repository<BoardEntity>,
    @InjectRepository(BoardColumnEntity)
    private readonly columnRepository: Repository<BoardColumnEntity>,
    @InjectRepository(CardEntity)
    private readonly cardRepository: Repository<CardEntity>,
    @InjectRepository(LabelEntity)
    private readonly labelRepository: Repository<LabelEntity>,
    @InjectRepository(ChecklistItemEntity)
    private readonly checklistRepository: Repository<ChecklistItemEntity>,
    @InjectRepository(CommentEntity)
    private readonly commentRepository: Repository<CommentEntity>,
    @InjectRepository(AttachmentEntity)
    private readonly attachmentRepository: Repository<AttachmentEntity>,
    @InjectRepository(SprintEntity)
    private readonly sprintRepository: Repository<SprintEntity>,
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

    if (dto.labelIds?.length) {
      card.labels = await this.loadBoardLabels(board, dto.labelIds);
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
    if (dto.labelIds !== undefined) {
      card.labels = dto.labelIds.length
        ? await this.loadBoardLabels(card.board, dto.labelIds)
        : [];
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

  async updateCardAssignee(
    cardId: string,
    userId: string,
    dto: UpdateCardAssigneeDto,
  ): Promise<CardResponseDto> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    card.assignee = dto.assigneeId
      ? await this.loadBoardMember(card.board, dto.assigneeId)
      : undefined;
    await this.cardRepository.save(card);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async updateCardWatchers(
    cardId: string,
    userId: string,
    dto: UpdateCardWatchersDto,
  ): Promise<CardResponseDto> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const watchers = await this.loadBoardMembers(card.board, dto.watcherIds);
    card.watchers = watchers;
    await this.cardRepository.save(card);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async updateCardLabels(
    cardId: string,
    userId: string,
    dto: UpdateCardLabelsDto,
  ): Promise<CardResponseDto> {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const labels = await this.loadBoardLabels(card.board, dto.labelIds);
    card.labels = labels;
    await this.cardRepository.save(card);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async createChecklistItem(
    cardId: string,
    userId: string,
    dto: CreateChecklistItemDto,
  ) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const item = this.checklistRepository.create({
      content: dto.content,
      completed: false,
      position: card.checklistItems?.length ?? 0,
      card,
    });

    await this.checklistRepository.save(item);
    await this.resequenceChecklist(card.id);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async updateChecklistItem(
    cardId: string,
    userId: string,
    itemId: string,
    dto: UpdateChecklistItemDto,
  ) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const item = card.checklistItems?.find((check) => check.id === itemId);
    if (!item) {
      throw new NotFoundException('Checklist item not found');
    }

    if (dto.content !== undefined) {
      item.content = dto.content;
    }
    if (dto.completed !== undefined) {
      item.completed = dto.completed;
    }
    if (dto.position !== undefined) {
      item.position = dto.position;
    }

    await this.checklistRepository.save(item);
    if (dto.position !== undefined) {
      await this.resequenceChecklist(card.id);
    }
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async deleteChecklistItem(cardId: string, userId: string, itemId: string) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    await this.checklistRepository.delete(itemId);
    await this.resequenceChecklist(card.id);
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

  async addAttachment(cardId: string, userId: string, dto: AddAttachmentDto) {
    const card = await this.findCardOrFail(cardId);
    const uploader = await this.loadBoardMember(card.board, userId);

    const attachment = this.attachmentRepository.create({
      name: dto.name,
      url: dto.url,
      mimeType: dto.mimeType,
      card,
      uploadedBy: uploader,
    });

    await this.attachmentRepository.save(attachment);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async deleteAttachment(cardId: string, userId: string, attachmentId: string) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    const attachment = card.attachments?.find((att) => att.id === attachmentId);
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }

    if (
      attachment.uploadedBy &&
      attachment.uploadedBy.id !== userId &&
      !this.isBoardManager(card.board, userId)
    ) {
      throw new ForbiddenException(
        'Only the uploader or board managers can delete attachments',
      );
    }

    await this.attachmentRepository.delete(attachmentId);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async updateCardSprint(
    cardId: string,
    userId: string,
    dto: UpdateCardSprintDto,
  ) {
    const card = await this.findCardOrFail(cardId);
    this.ensureBoardMember(card.board, userId);

    if (dto.sprintId) {
      const sprint = await this.sprintRepository.findOne({
        where: { id: dto.sprintId },
        relations: { board: true },
      });
      if (!sprint || sprint.board.id !== card.board.id) {
        throw new BadRequestException('Sprint must belong to the card board');
      }
      card.sprint = sprint;
    } else {
      card.sprint = undefined;
    }

    await this.cardRepository.save(card);
    const updated = await this.findCardOrFail(cardId);
    return this.toCardResponseDto(updated);
  }

  async createLabel(
    boardId: string,
    userId: string,
    dto: CreateLabelDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const label = this.labelRepository.create({
      name: dto.name,
      color: dto.color,
      board,
    });
    await this.labelRepository.save(label);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async updateLabel(
    boardId: string,
    userId: string,
    labelId: string,
    dto: UpdateLabelDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);
    const label = board.labels?.find((lab) => lab.id === labelId);
    if (!label) {
      throw new NotFoundException('Label not found');
    }

    if (dto.name !== undefined) {
      label.name = dto.name;
    }
    if (dto.color !== undefined) {
      label.color = dto.color;
    }

    await this.labelRepository.save(label);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async deleteLabel(
    boardId: string,
    userId: string,
    labelId: string,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    await this.labelRepository.delete(labelId);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async createSprint(
    boardId: string,
    userId: string,
    dto: CreateSprintDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const sprint = this.sprintRepository.create({
      name: dto.name,
      goal: dto.goal,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
      status: SprintStatus.PLANNED,
      board,
    });

    await this.sprintRepository.save(sprint);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async updateSprint(
    boardId: string,
    userId: string,
    sprintId: string,
    dto: UpdateSprintDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);

    const sprint = board.sprints?.find((spr) => spr.id === sprintId);
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    if (dto.name !== undefined) {
      sprint.name = dto.name;
    }
    if (dto.goal !== undefined) {
      sprint.goal = dto.goal;
    }
    if (dto.startDate !== undefined) {
      sprint.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    }
    if (dto.endDate !== undefined) {
      sprint.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    }

    await this.sprintRepository.save(sprint);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async updateSprintStatus(
    boardId: string,
    userId: string,
    sprintId: string,
    dto: UpdateSprintStatusDto,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);
    const sprint = board.sprints?.find((spr) => spr.id === sprintId);
    if (!sprint) {
      throw new NotFoundException('Sprint not found');
    }

    sprint.status = dto.status;
    await this.sprintRepository.save(sprint);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
  }

  async deleteSprint(
    boardId: string,
    userId: string,
    sprintId: string,
  ): Promise<BoardResponseDto> {
    const board = await this.findBoardOrFail(boardId);
    this.ensureBoardMember(board, userId);
    await this.sprintRepository.delete(sprintId);
    const updated = await this.findBoardOrFail(boardId);
    return this.toBoardResponseDto(updated);
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
            checklistItems: { position: 'ASC' },
          },
        },
        labels: { name: 'ASC' },
        sprints: { createdAt: 'ASC' },
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
        watchers: true,
        labels: true,
        checklistItems: true,
        comments: { author: true },
        attachments: { uploadedBy: true },
        sprint: true,
      },
      order: {
        checklistItems: { position: 'ASC' },
      },
    });

    if (!card) {
      throw new NotFoundException('Card not found');
    }

    card.checklistItems = [...(card.checklistItems ?? [])].sort(
      (a, b) => a.position - b.position,
    );
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
      for (const card of column.cards) {
        card.checklistItems = [...(card.checklistItems ?? [])].sort(
          (a, b) => a.position - b.position,
        );
      }
    }
    board.labels = [...(board.labels ?? [])].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
    board.sprints = [...(board.sprints ?? [])].sort(
      (a, b) => a.createdAt.getTime() - b.createdAt.getTime(),
    );
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

  private async loadBoardLabels(board: BoardEntity, labelIds: string[]) {
    const ids = Array.from(new Set(labelIds));
    const labels = await this.labelRepository.find({
      where: { id: In(ids), board: { id: board.id } },
    });
    if (labels.length !== ids.length) {
      throw new BadRequestException(
        'One or more labels do not belong to the board',
      );
    }
    return labels;
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

  private async resequenceChecklist(cardId: string) {
    const items = await this.checklistRepository.find({
      where: { card: { id: cardId } },
      order: { position: 'ASC', createdAt: 'ASC' },
    });

    items.forEach((item, index) => {
      item.position = index;
    });

    await this.checklistRepository.save(items);
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
      labels: (board.labels ?? []).map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt.toISOString(),
        updatedAt: label.updatedAt.toISOString(),
      })),
      sprints: (board.sprints ?? []).map((sprint) => ({
        id: sprint.id,
        name: sprint.name,
        goal: sprint.goal,
        startDate: sprint.startDate?.toISOString(),
        endDate: sprint.endDate?.toISOString(),
        status: sprint.status,
        createdAt: sprint.createdAt.toISOString(),
        updatedAt: sprint.updatedAt.toISOString(),
      })),
      createdAt: board.createdAt.toISOString(),
      updatedAt: board.updatedAt.toISOString(),
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
      createdAt: column.createdAt.toISOString(),
      updatedAt: column.updatedAt.toISOString(),
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
      watchers: (card.watchers ?? []).map((user) =>
        this.usersService.toResponseDto(user),
      ),
      labels: (card.labels ?? []).map((label) => ({
        id: label.id,
        name: label.name,
        color: label.color,
        createdAt: label.createdAt.toISOString(),
        updatedAt: label.updatedAt.toISOString(),
      })),
      checklistItems: (card.checklistItems ?? []).map((item) => ({
        id: item.id,
        content: item.content,
        completed: item.completed,
        position: item.position,
        createdAt: item.createdAt.toISOString(),
        updatedAt: item.updatedAt.toISOString(),
      })),
      comments: (card.comments ?? []).map((comment) => ({
        id: comment.id,
        content: comment.content,
        author: comment.author
          ? this.usersService.toResponseDto(comment.author)
          : undefined,
        createdAt: comment.createdAt.toISOString(),
        updatedAt: comment.updatedAt.toISOString(),
      })),
      attachments: (card.attachments ?? []).map((attachment) => ({
        id: attachment.id,
        name: attachment.name,
        url: attachment.url,
        mimeType: attachment.mimeType ?? undefined,
        uploadedBy: attachment.uploadedBy
          ? this.usersService.toResponseDto(attachment.uploadedBy)
          : undefined,
        createdAt: attachment.createdAt.toISOString(),
      })),
      sprint: card.sprint
        ? {
            id: card.sprint.id,
            name: card.sprint.name,
            goal: card.sprint.goal,
            startDate: card.sprint.startDate?.toISOString(),
            endDate: card.sprint.endDate?.toISOString(),
            status: card.sprint.status,
            createdAt: card.sprint.createdAt.toISOString(),
            updatedAt: card.sprint.updatedAt.toISOString(),
          }
        : undefined,
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
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
