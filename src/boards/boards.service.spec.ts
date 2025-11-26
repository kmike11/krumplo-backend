import { BoardsService } from './boards.service';
import { BoardEntity } from './entities/board.entity';
import { BoardColumnEntity } from './entities/board-column.entity';
import { CardEntity } from './entities/card.entity';
import { CommentEntity } from './entities/comment.entity';
import { UserEntity } from '../users/user.entity';
import { UserRole } from '../common/enums/user-role.enum';
import { UsersService } from '../users/users.service';
import { CardPriority } from '../common/enums/card-priority.enum';
import { CardType } from '../common/enums/card-type.enum';

const createUser = (overrides: Partial<UserEntity> = {}): UserEntity => ({
  id: overrides.id ?? 'user-id',
  email: overrides.email ?? 'user@example.com',
  password: overrides.password ?? 'hashed',
  displayName: overrides.displayName ?? 'User',
  role: overrides.role ?? UserRole.USER,
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00.000Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-01T00:00:00.000Z'),
});

describe('BoardsService.toBoardResponseDto', () => {
  let service: BoardsService;
  let usersService: UsersService;

  beforeEach(() => {
    usersService = {
      toResponseDto: jest.fn().mockImplementation((user: UserEntity) => ({
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
      })),
    } as unknown as UsersService;

    service = new BoardsService(
      {} as any,
      {} as any,
      {} as any,
      {} as any,
      usersService,
    );
  });

  it('serializes Date instances to ISO strings', () => {
    const owner = createUser({ id: 'owner-1' });
    const member = createUser({ id: 'member-1', email: 'member@example.com' });
    const board: BoardEntity = {
      id: 'board-1',
      name: 'My Board',
      description: 'Important things',
      owner,
      members: [owner, member],
      columns: [],
      cards: [],
      createdAt: new Date('2024-02-10T12:00:00.000Z'),
      updatedAt: new Date('2024-02-11T08:30:00.000Z'),
    } as BoardEntity;

    const dto = (service as any).toBoardResponseDto(board);

    expect(dto.createdAt).toBe('2024-02-10T12:00:00.000Z');
    expect(dto.updatedAt).toBe('2024-02-11T08:30:00.000Z');
    expect(typeof dto.createdAt).toBe('string');
  });

  it('accepts pre-serialized timestamps from query builder results', () => {
    const isoCreated = '2024-07-04T09:15:00.000Z';
    const isoUpdated = '2024-07-05T09:15:00.000Z';

    const column: BoardColumnEntity = {
      id: 'column-1',
      title: 'Todo',
      position: 0,
      board: {} as BoardEntity,
      cards: [],
      createdAt: isoCreated as unknown as Date,
      updatedAt: isoUpdated as unknown as Date,
    } as BoardColumnEntity;

    const card: CardEntity = {
      id: 'card-1',
      title: 'Stub card',
      position: 0,
      board: {} as BoardEntity,
      column,
      priority: CardPriority.MEDIUM,
      type: CardType.TASK,
      comments: [
        {
          id: 'comment-1',
          content: 'Looks good',
          card: {} as CardEntity,
          createdAt: isoCreated as unknown as Date,
          updatedAt: isoUpdated as unknown as Date,
        } as CommentEntity,
      ],
      createdAt: isoCreated as unknown as Date,
      updatedAt: isoUpdated as unknown as Date,
    } as CardEntity;

    column.cards = [card];

    const board: BoardEntity = {
      id: 'board-2',
      name: 'Serialized board',
      owner: createUser({ id: 'owner-2' }),
      members: [],
      columns: [column],
      cards: [card],
      createdAt: isoCreated as unknown as Date,
      updatedAt: isoUpdated as unknown as Date,
    } as BoardEntity;

    const dto = (service as any).toBoardResponseDto(board);

    expect(dto.createdAt).toBe(isoCreated);
    expect(dto.columns[0]?.createdAt).toBe(isoCreated);
    expect(dto.columns[0]?.cards[0]?.comments[0]?.createdAt).toBe(isoCreated);
  });
});
